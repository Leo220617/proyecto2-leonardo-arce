import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export function signJWT(user) {
  return jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '2h' });
}

export function verifyJWT(token) {
  try { return jwt.verify(token, process.env.JWT_SECRET); } catch { return null; }
}

export async function hashPassword(plain) { return bcrypt.hash(plain, 10); }
export async function checkPassword(plain, hash) { return bcrypt.compare(plain, hash); }

export function requireAuth(req, res, next) {
  const token = req.cookies?.[process.env.TOKEN_COOKIE_NAME || 'token'] || (req.headers.authorization?.split(' ')[1]);
  const payload = token && verifyJWT(token);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.user = payload;
  next();
}
