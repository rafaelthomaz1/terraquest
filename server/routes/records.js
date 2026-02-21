import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { dbHelper } from '../db.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  try {
    const rows = dbHelper.prepare(`
      SELECT game_mode, score as best_score, total, time_seconds as best_time
      FROM (
        SELECT game_mode, score, total, time_seconds,
          ROW_NUMBER() OVER (PARTITION BY game_mode ORDER BY score DESC, time_seconds ASC) as rn
        FROM game_records WHERE user_id = ?
      ) ranked
      WHERE rn = 1
    `).all(req.session.userId);

    const records = {};
    for (const row of rows) {
      records[row.game_mode] = {
        score: row.best_score,
        total: row.total,
        time_seconds: row.best_time,
      };
    }

    res.json({ records });
  } catch (err) {
    console.error('Records fetch error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/', requireAuth, (req, res) => {
  try {
    const { game_mode, score, total, time_seconds } = req.body;

    if (!game_mode || score == null || total == null || time_seconds == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: game_mode, score, total, time_seconds' });
    }

    dbHelper.prepare(
      'INSERT INTO game_records (user_id, game_mode, score, total, time_seconds) VALUES (?, ?, ?, ?, ?)'
    ).run(req.session.userId, game_mode, score, total, time_seconds);

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Record save error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
