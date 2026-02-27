import { dbHelper } from '../db.js';

const ADMIN_EMAIL = 'rafaelthomaz887@gmail.com';

export function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  dbHelper.prepare('SELECT email FROM users WHERE id = ?').get(req.session.userId)
    .then(user => {
      if (!user || user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      next();
    })
    .catch(() => res.status(500).json({ error: 'Erro interno' }));
}
