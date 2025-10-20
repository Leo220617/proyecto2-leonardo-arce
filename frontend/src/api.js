// Detecta si estamos sirviendo todo a través de Netlify Dev (puerto 8888)
const isNetlifyDev = typeof window !== 'undefined' && window.location && window.location.port === '8888';
// En Netlify Dev llamamos directo a la Function; en prod usamos /api (redirige por netlify.toml)
const base = isNetlifyDev ? '/.netlify/functions/api' : '/api';

// Helper robusto para manejar respuestas que no son JSON (p. ej. index.html)
async function parseJsonSafe(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { __raw: text }; }
}

async function req(path, opts = {}) {
  const res = await fetch(base + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const msg = (data && data.error) ? data.error
      : (typeof data === 'string' ? data
      : (data && data.__raw ? data.__raw.slice(0, 120) : 'Error'));
    throw new Error(msg);
  }

  return data;
}

export const api = {
  register: (u, p) => req('/auth/register', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  login:    (u, p) => req('/auth/login',    { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  logout:          () => req('/auth/logout', { method: 'POST' }),
  me:              () => req('/auth/me'),
  listAuthors:     () => req('/authors'),
  getAuthor:  (id) => req(`/authors/${id}`),
  listBooks:       () => req('/books'),
  queue: (payload) => req('/queue/send', { method: 'POST', body: JSON.stringify(payload) }),
  apply:          () => req('/queue/apply', { method: 'POST' })
};
