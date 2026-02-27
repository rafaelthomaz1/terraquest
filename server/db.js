import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const SCORE_RATIO_MODES = [
  "world-type", "world-click", "world-flags", "world-capitals",
  "world-languages", "br-states", "br-capitals", "us-states", "us-capitals"
];
const STREAK_MODES = [
  "world-silhouettes", "world-population", "world-area-game",
  "world-flags-game", "world-capitals-game", "world-languages-game",
  "landmarks-game"
];

const DIFFICULTY_MULTIPLIERS = { learning: 1, easy: 2, hard: 4 };

export function calculateXP(gameMode, score, total, timeSeconds, difficulty) {
  let baseXP;
  if (SCORE_RATIO_MODES.includes(gameMode)) {
    baseXP = total > 0 ? Math.round((score / total) * 100) : 0;
  } else if (STREAK_MODES.includes(gameMode)) {
    baseXP = Math.min(Math.round(score * 5), 200);
  } else if (gameMode === "world-where") {
    baseXP = Math.round((score / 7000) * 100);
  } else if (gameMode === "world-walk") {
    baseXP = total > 0 ? Math.round(Math.min(total / Math.max(score, 1), 1) * 100) : 50;
  } else {
    baseXP = total > 0 ? Math.round((score / total) * 100) : 25;
  }
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1;
  return Math.round(baseXP * multiplier);
}

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('Conexao com PostgreSQL estabelecida');

    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        ip_address TEXT,
        country TEXT,
        city TEXT,
        user_agent TEXT,
        referrer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_page_views_country ON page_views(country)');

    await client.query(`
      CREATE TABLE IF NOT EXISTS login_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        method TEXT,
        ip_address TEXT,
        country TEXT,
        city TEXT,
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('ALTER TABLE login_events ADD COLUMN IF NOT EXISTS city TEXT').catch(() => {});
    await client.query('CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_login_events_created ON login_events(created_at)');

    await client.query(`
      CREATE TABLE IF NOT EXISTS screen_time (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        screen_name TEXT,
        duration_seconds INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_screen_time_created ON screen_time(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_screen_time_screen ON screen_time(screen_name)');

    await client.query('CREATE INDEX IF NOT EXISTS idx_records_mode_difficulty ON game_records(game_mode, difficulty)');

    console.log('Tabelas de analytics verificadas');
  } finally {
    client.release();
  }
}

function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

export const dbHelper = {
  prepare(sql) {
    const pgSql = convertPlaceholders(sql);
    return {
      async get(...params) {
        const { rows } = await pool.query(pgSql, params);
        return rows[0] || undefined;
      },
      async all(...params) {
        const { rows } = await pool.query(pgSql, params);
        return rows;
      },
      async run(...params) {
        const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
        let finalSql = pgSql;
        if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
          finalSql = pgSql + ' RETURNING id';
        }
        const result = await pool.query(finalSql, params);
        const lastInsertRowid = isInsert ? (result.rows[0]?.id || 0) : 0;
        const changes = result.rowCount;
        return { lastInsertRowid, changes };
      },
    };
  },
};

export { pool };
