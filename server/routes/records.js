import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { dbHelper, calculateXP } from '../db.js';

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

router.get('/stats', requireAuth, (req, res) => {
  try {
    const uid = req.session.userId;

    const user = dbHelper.prepare(
      'SELECT total_xp FROM users WHERE id = ?'
    ).get(uid);

    const modeStats = dbHelper.prepare(`
      SELECT game_mode,
        COUNT(*) as games_played,
        MAX(score) as best_score,
        MAX(total) as best_total,
        MIN(CASE WHEN score = (SELECT MAX(s2.score) FROM game_records s2
          WHERE s2.user_id = ? AND s2.game_mode = game_records.game_mode)
          THEN time_seconds ELSE NULL END) as best_time,
        SUM(time_seconds) as total_time,
        SUM(xp_earned) as mode_xp
      FROM game_records WHERE user_id = ?
      GROUP BY game_mode
    `).all(uid, uid);

    const overall = dbHelper.prepare(`
      SELECT COUNT(*) as total_games,
        SUM(time_seconds) as total_time,
        COUNT(DISTINCT game_mode) as modes_played
      FROM game_records WHERE user_id = ?
    `).get(uid);

    const playDates = dbHelper.prepare(`
      SELECT DISTINCT date(played_at) as play_date
      FROM game_records WHERE user_id = ?
      ORDER BY play_date DESC
    `).all(uid);

    res.json({
      totalXP: user?.total_xp || 0,
      modeStats,
      overall,
      playDates: playDates.map(r => r.play_date)
    });
  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/', requireAuth, (req, res) => {
  try {
    const { game_mode, score, total, time_seconds } = req.body;

    if (!game_mode || score == null || total == null || time_seconds == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: game_mode, score, total, time_seconds' });
    }

    const xp = calculateXP(game_mode, score, total, time_seconds);

    dbHelper.prepare(
      'INSERT INTO game_records (user_id, game_mode, score, total, time_seconds, xp_earned) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.session.userId, game_mode, score, total, time_seconds, xp);

    dbHelper.prepare(
      'UPDATE users SET total_xp = total_xp + ? WHERE id = ?'
    ).run(xp, req.session.userId);

    res.status(201).json({ ok: true, xp_earned: xp });
  } catch (err) {
    console.error('Record save error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
