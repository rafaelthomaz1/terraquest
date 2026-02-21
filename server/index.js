import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import recordsRoutes from './routes/records.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd ? 'https://terraquest.com.br' : 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

if (isProd) {
  app.set('trust proxy', 1);
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'terraquest-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api/records', recordsRoutes);

(async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Terra Quest API rodando na porta ${PORT}`);
  });
})();
