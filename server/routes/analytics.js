import { Router } from 'express';
import { dbHelper } from '../db.js';
import { getClientIp, lookupGeo } from '../utils/geo.js';

const router = Router();

router.post('/pageview', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const { country, city } = lookupGeo(ip);
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';
    const userId = req.session.userId || null;

    await dbHelper.prepare(
      'INSERT INTO page_views (user_id, ip_address, country, city, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, ip, country, city, userAgent, referrer);

    res.json({ ok: true });
  } catch (err) {
    console.error('Pageview error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/screentime', async (req, res) => {
  try {
    const { screen, duration } = req.body;
    if (!screen || typeof duration !== 'number' || duration < 2 || duration > 86400) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const userId = req.session.userId || null;

    await dbHelper.prepare(
      'INSERT INTO screen_time (user_id, screen_name, duration_seconds) VALUES (?, ?, ?)'
    ).run(userId, screen, Math.round(duration));

    res.json({ ok: true });
  } catch (err) {
    console.error('Screentime error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
