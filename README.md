# Proyecto 2 — Sistemas Distribuidos (Netlify + MongoDB Atlas + RabbitMQ)

## Requisitos
- Node 18+
- Cuenta Netlify
- MongoDB Atlas + credenciales
- RabbitMQ (CloudAMQP u otro)

## Variables de entorno
Ver `.env.example` y configurar en Netlify (Site Settings → Environment variables).

## Desarrollo local
```bash
npm i
npm i -w frontend
# Terminal 1 (frontend)
npm run dev
# Terminal 2 (funciones)
npx netlify dev
```

Frontend: http://localhost:5173
API:      http://localhost:8888/api

## Despliegue
- Conecta el repo a Netlify
- Build command: `npm run build`
- Publish dir: `frontend/dist`
- Functions dir: `netlify/functions`

## Flujo
1. Login/Registro → cookie JWT + sesión de Express en Mongo
2. CRUD diferido: `POST /api/queue/send` encola `{ entity, action, data }`
3. Procesar pendientes: `POST /api/queue/apply` aplica en MongoDB
4. Lecturas directas: `/api/authors`, `/api/authors/:id`, `/api/books`
