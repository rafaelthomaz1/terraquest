import { Router } from 'express';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { dbHelper } from '../db.js';

const router = Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const existing = dbHelper.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = dbHelper.prepare(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
    ).run(name, email, passwordHash);

    req.session.userId = result.lastInsertRowid;

    const user = dbHelper.prepare('SELECT id, name, email, picture FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = dbHelper.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    req.session.userId = user.id;
    res.json({ user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      console.error('Google auth: body recebido sem code:', JSON.stringify(req.body));
      return res.status(400).json({ error: 'Código Google não fornecido' });
    }

    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = dbHelper.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

    if (!user) {
      const existingByEmail = dbHelper.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (existingByEmail) {
        dbHelper.prepare('UPDATE users SET google_id = ?, picture = ? WHERE id = ?').run(googleId, picture, existingByEmail.id);
        user = dbHelper.prepare('SELECT * FROM users WHERE id = ?').get(existingByEmail.id);
      } else {
        const result = dbHelper.prepare(
          'INSERT INTO users (name, email, google_id, picture) VALUES (?, ?, ?, ?)'
        ).run(name, email, googleId, picture);
        user = dbHelper.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }
    }

    req.session.userId = user.id;
    res.json({ user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
  } catch (err) {
    console.error('Google auth error:', err.message || err);
    const msg = err.response?.data?.error_description
      || err.message
      || 'Falha na autenticação Google';
    res.status(401).json({ error: `Falha na autenticação Google: ${msg}` });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const user = dbHelper.prepare('SELECT id, name, email, picture FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  res.json({ user });
});

router.get('/config', (req, res) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || '' });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

export default router;
