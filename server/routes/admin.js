import { Router } from 'express';
import { requireAdmin } from '../middleware/admin.js';
import { pool } from '../db.js';

const router = Router();
router.use(requireAdmin);

router.get('/overview', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const totals = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM users) AS total_users,
          (SELECT COUNT(*) FROM game_records) AS total_games,
          (SELECT COUNT(*) FROM page_views) AS total_pageviews,
          (SELECT COUNT(*) FROM login_events WHERE success = true) AS total_logins
      `);

      const today = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE created_at::date = CURRENT_DATE) AS users_today,
          (SELECT COUNT(*) FROM game_records WHERE played_at::date = CURRENT_DATE) AS games_today,
          (SELECT COUNT(*) FROM page_views WHERE created_at::date = CURRENT_DATE) AS pageviews_today,
          (SELECT COUNT(*) FROM login_events WHERE created_at::date = CURRENT_DATE AND success = true) AS logins_today
      `);

      const activity = await client.query(`
        SELECT d::date AS day,
          COALESCE(pv.cnt, 0) AS pageviews,
          COALESCE(le.cnt, 0) AS logins,
          COALESCE(gr.cnt, 0) AS games
        FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day') d
        LEFT JOIN (SELECT created_at::date AS day, COUNT(*) AS cnt FROM page_views WHERE created_at >= CURRENT_DATE - INTERVAL '29 days' GROUP BY 1) pv ON pv.day = d::date
        LEFT JOIN (SELECT created_at::date AS day, COUNT(*) AS cnt FROM login_events WHERE created_at >= CURRENT_DATE - INTERVAL '29 days' AND success = true GROUP BY 1) le ON le.day = d::date
        LEFT JOIN (SELECT played_at::date AS day, COUNT(*) AS cnt FROM game_records WHERE played_at >= CURRENT_DATE - INTERVAL '29 days' GROUP BY 1) gr ON gr.day = d::date
        ORDER BY d
      `);

      res.json({
        totals: totals.rows[0],
        today: today.rows[0],
        activity: activity.rows
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows: countRow } = await pool.query('SELECT COUNT(*) AS total FROM users');
    const total = parseInt(countRow[0].total);

    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.picture, u.created_at, u.total_xp,
        COUNT(gr.id) AS games_played,
        MAX(gr.played_at) AS last_active,
        (SELECT COUNT(*) FROM login_events WHERE user_id = u.id) AS login_count
      FROM users u
      LEFT JOIN game_records gr ON gr.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({ users: rows, total, page, limit });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/games', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT game_mode,
        COUNT(*) AS total_plays,
        COUNT(DISTINCT user_id) AS unique_players,
        ROUND(AVG(CASE WHEN total > 0 THEN (score::numeric / total) * 100 ELSE 0 END), 1) AS avg_score_pct,
        ROUND(AVG(time_seconds)) AS avg_time,
        SUM(xp_earned) AS total_xp
      FROM game_records
      GROUP BY game_mode
      ORDER BY total_plays DESC
    `);
    res.json({ games: rows });
  } catch (err) {
    console.error('Admin games error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows: countRow } = await pool.query('SELECT COUNT(*) AS total FROM login_events');
    const total = parseInt(countRow[0].total);

    const { rows } = await pool.query(`
      SELECT le.id, le.method, le.ip_address, le.country, le.city, le.success, le.created_at,
        u.name, u.email
      FROM login_events le
      LEFT JOIN users u ON u.id = le.user_id
      ORDER BY le.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({ sessions: rows, total, page, limit });
  } catch (err) {
    console.error('Admin sessions error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/geo', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT country,
        COUNT(*) FILTER (WHERE source = 'pageview') AS pageviews,
        COUNT(*) FILTER (WHERE source = 'login') AS logins
      FROM (
        SELECT country, 'pageview' AS source FROM page_views WHERE country IS NOT NULL
        UNION ALL
        SELECT country, 'login' AS source FROM login_events WHERE country IS NOT NULL
      ) combined
      GROUP BY country
      ORDER BY pageviews DESC
    `);
    res.json({ geo: rows });
  } catch (err) {
    console.error('Admin geo error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/screentime', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT screen_name,
        SUM(duration_seconds) AS total_seconds,
        ROUND(AVG(duration_seconds)) AS avg_seconds,
        COUNT(*) AS sessions
      FROM screen_time
      GROUP BY screen_name
      ORDER BY total_seconds DESC
    `);
    res.json({ screentime: rows });
  } catch (err) {
    console.error('Admin screentime error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
