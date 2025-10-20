// netlify/functions/api.js
import serverless from 'serverless-http';
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import mongoose from 'mongoose';

import { connectDB } from './utils/db.js';
import { enqueueUpdate, drainUpdates } from './utils/mq.js';
import { signJWT, verifyJWT, hashPassword, checkPassword, requireAuth } from './utils/auth.js';
import { Author, Book } from '../../shared/models.js';

const app = express();

// CORS + JSON + cookies
const allowed = process.env.ALLOWED_ORIGIN?.split(',') || '*';
app.use(cors({ origin: allowed, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// --- Sesiones usando el mismo cliente de Mongoose (clientPromise) ---
const clientPromise = (async () => {
  await connectDB(); // conexión cacheada
  return mongoose.connection.getClient();
})();

let sessionStore;
try {
  sessionStore = MongoStore.create({
    clientPromise,
    collectionName: 'sessions',
    stringify: false,
    autoRemove: 'interval',
    autoRemoveInterval: 10, // min
    ttl: 2 * 60 * 60 // 2h
  });
  console.log('✅ Sesión conectada a MongoDB');
} catch (err) {
  console.error('⚠️ No se pudo inicializar MongoStore. Usando MemoryStore:', err.message);
  sessionStore = undefined; // fallback dev
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 2 * 60 * 60 * 1000 }
}));

// asegurar conexión por request
app.use(async (_req, _res, next) => { try { await connectDB(); } catch(e){ console.error('MongoDB error:', e?.message||e); } next(); });

// === Modelo de usuario ===
const UserSchema = new mongoose.Schema({ username: { type: String, unique: true }, password: String });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// === Auth ===
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const exists = await User.findOne({ username });
  if (exists) return res.status(409).json({ error: 'user exists' });
  const user = await User.create({ username, password: await hashPassword(password) });
  const token = signJWT(user);
  req.session.userId = user._id.toString();
  res.cookie(process.env.TOKEN_COOKIE_NAME || 'token', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true, username });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await checkPassword(password, user.password))) return res.status(401).json({ error: 'invalid credentials' });
  const token = signJWT(user);
  req.session.userId = user._id.toString();
  res.cookie(process.env.TOKEN_COOKIE_NAME || 'token', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true, username });
});

app.post('/auth/logout', (req, res) => {
  req.session?.destroy?.(() => {
    res.clearCookie(process.env.TOKEN_COOKIE_NAME || 'token');
    res.json({ ok: true });
  });
});

app.get('/auth/me', (req, res) => {
  const token = req.cookies?.[process.env.TOKEN_COOKIE_NAME || 'token'];
  const payload = token && verifyJWT(token);
  if (!payload || !req.session?.userId) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, username: payload.username });
});

// === RabbitMQ (diferido) ===
app.post('/queue/send', requireAuth, async (req, res) => {
  const { entity, action, data } = req.body;
  if (!entity || !action) return res.status(400).json({ error: 'entity and action required' });
  await enqueueUpdate({ entity, action, data, by: req.user.username, ts: Date.now() });
  res.json({ queued: true });
});

app.post('/queue/apply', requireAuth, async (_req, res) => {
  let applied = 0;
  await drainUpdates(async (msg) => {
    const { entity, action, data } = msg;
    if (entity === 'author') {
      if (action === 'create') await Author.create(data);
      if (action === 'update') await Author.findByIdAndUpdate(data._id, data);
      if (action === 'delete') await Author.findByIdAndDelete(data._id);
    }
    if (entity === 'book') {
      if (action === 'create') await Book.create(data);
      if (action === 'update') await Book.findByIdAndUpdate(data._id, data);
      if (action === 'delete') await Book.findByIdAndDelete(data._id);
    }
    applied++;
  });
  res.json({ applied });
});

// === Lecturas directas ===
app.get('/authors', requireAuth, async (_req, res) => {
  const authors = await Author.find().sort({ createdAt: -1 });
  res.json(authors);
});

app.get('/authors/:id', requireAuth, async (req, res) => {
  const a = await Author.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'not found' });
  const books = await Book.find({ author: a._id }).sort({ createdAt: -1 });
  res.json({ author: a, books });
});

app.get('/books', requireAuth, async (_req, res) => {
  const books = await Book.find().populate('author', 'name');
  res.json(books);
});

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// CLAVE: basePath para que machee /.netlify/functions/api/*
export const handler = serverless(app, { basePath: '/.netlify/functions/api' });
