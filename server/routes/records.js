import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { dbHelper, calculateXP, pool } from '../db.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await dbHelper.prepare(`
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

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const uid = req.session.userId;

    const user = await dbHelper.prepare(
      'SELECT total_xp FROM users WHERE id = ?'
    ).get(uid);

    const modeStats = await dbHelper.prepare(`
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

    const overall = await dbHelper.prepare(`
      SELECT COUNT(*) as total_games,
        SUM(time_seconds) as total_time,
        COUNT(DISTINCT game_mode) as modes_played
      FROM game_records WHERE user_id = ?
    `).get(uid);

    const playDates = await dbHelper.prepare(`
      SELECT DISTINCT played_at::date as play_date
      FROM game_records WHERE user_id = ?
      ORDER BY play_date DESC
    `).all(uid);

    const difficultyStats = await dbHelper.prepare(`
      SELECT difficulty,
        COUNT(*) as games_played,
        MAX(score) as best_score,
        SUM(xp_earned) as total_xp
      FROM game_records WHERE user_id = ? AND difficulty IS NOT NULL
      GROUP BY difficulty
    `).all(uid);

    res.json({
      totalXP: user?.total_xp || 0,
      modeStats,
      overall,
      playDates: playDates.map(r => r.play_date),
      difficultyStats
    });
  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { game_mode, score, total, time_seconds, difficulty, extra_data } = req.body;

    if (!game_mode || score == null || total == null || time_seconds == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: game_mode, score, total, time_seconds' });
    }

    const xp = calculateXP(game_mode, score, total, time_seconds, difficulty);

    await dbHelper.prepare(
      'INSERT INTO game_records (user_id, game_mode, score, total, time_seconds, xp_earned, difficulty, extra_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.session.userId, game_mode, score, total, time_seconds, xp, difficulty || null, extra_data ? JSON.stringify(extra_data) : null);

    await dbHelper.prepare(
      'UPDATE users SET total_xp = total_xp + ? WHERE id = ?'
    ).run(xp, req.session.userId);

    res.status(201).json({ ok: true, xp_earned: xp });
  } catch (err) {
    console.error('Record save error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/rankings', requireAuth, async (req, res) => {
  try {
    const { game_mode, difficulty } = req.query;
    const params = [];
    const conditions = [];
    let idx = 1;

    if (game_mode) {
      conditions.push(`gr.game_mode = $${idx++}`);
      params.push(game_mode);
    }
    if (difficulty) {
      conditions.push(`gr.difficulty = $${idx++}`);
      params.push(difficulty);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const sql = `
      SELECT CASE
        WHEN u.name LIKE '% %' THEN split_part(u.name, ' ', 1) || ' ' || left(split_part(u.name, ' ', array_length(string_to_array(u.name, ' '), 1)), 1) || '.'
        ELSE u.name
      END as name, ranked.best_score, ranked.total, ranked.best_time, ranked.xp_earned
      FROM (
        SELECT user_id, score as best_score, total, time_seconds as best_time, xp_earned,
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, time_seconds ASC) as rn
        FROM game_records gr
        ${where}
      ) ranked
      JOIN users u ON u.id = ranked.user_id
      WHERE ranked.rn = 1
      ORDER BY ranked.best_score DESC, ranked.best_time ASC
      LIMIT 50
    `;

    const { rows } = await pool.query(sql, params);
    res.json({ rankings: rows });
  } catch (err) {
    console.error('Rankings fetch error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
