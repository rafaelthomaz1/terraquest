import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, '..', 'terraquest.db');

let db;

const SCORE_RATIO_MODES = [
  "world-type", "world-click", "world-flags", "world-capitals",
  "world-languages", "br-states", "br-capitals", "us-states", "us-capitals"
];
const STREAK_MODES = [
  "world-silhouettes", "world-population", "world-area-game",
  "world-flags-game", "world-capitals-game", "world-languages-game",
  "landmarks-game"
];

export function calculateXP(gameMode, score, total, timeSeconds) {
  if (SCORE_RATIO_MODES.includes(gameMode)) {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  }
  if (STREAK_MODES.includes(gameMode)) {
    return Math.min(Math.round(score * 5), 200);
  }
  if (gameMode === "world-where") {
    return Math.round((score / 7000) * 100);
  }
  if (gameMode === "world-walk") {
    return total > 0 ? Math.round(Math.min(total / Math.max(score, 1), 1) * 100) : 50;
  }
  return total > 0 ? Math.round((score / total) * 100) : 25;
}

export async function initDb() {
  const SQL = await initSqlJs();

  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL,
      picture TEXT,
      google_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS game_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_mode TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      time_seconds INTEGER NOT NULL,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_records_user_mode ON game_records(user_id, game_mode)');

  // Migration: add xp columns
  try { db.run('ALTER TABLE game_records ADD COLUMN xp_earned INTEGER DEFAULT 0'); } catch { /* already exists */ }
  try { db.run('ALTER TABLE users ADD COLUMN total_xp INTEGER DEFAULT 0'); } catch { /* already exists */ }

  // Backfill XP on old records that have xp_earned = 0
  const needsBackfill = db.exec('SELECT COUNT(*) as c FROM game_records WHERE xp_earned = 0');
  if (needsBackfill.length > 0 && needsBackfill[0].values[0][0] > 0) {
    const rows = db.exec('SELECT id, game_mode, score, total, time_seconds FROM game_records WHERE xp_earned = 0');
    if (rows.length > 0) {
      for (const row of rows[0].values) {
        const [id, mode, score, total, time] = row;
        const xp = calculateXP(mode, score, total, time);
        db.run('UPDATE game_records SET xp_earned = ? WHERE id = ?', [xp, id]);
      }
    }
    // Recalculate total_xp per user
    const userXps = db.exec('SELECT user_id, SUM(xp_earned) as total FROM game_records GROUP BY user_id');
    if (userXps.length > 0) {
      for (const row of userXps[0].values) {
        db.run('UPDATE users SET total_xp = ? WHERE id = ?', [row[1], row[0]]);
      }
    }
  }

  saveDb();
  return db;
}

export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
}

export function getDb() {
  return db;
}

// Wrapper compatível com a API do better-sqlite3
export const dbHelper = {
  prepare(sql) {
    return {
      get(...params) {
        const results = db.exec(sql, params);
        if (results.length === 0 || results[0].values.length === 0) return undefined;
        const cols = results[0].columns;
        const vals = results[0].values[0];
        const row = {};
        for (let i = 0; i < cols.length; i++) row[cols[i]] = vals[i];
        return row;
      },
      all(...params) {
        const results = db.exec(sql, params);
        if (results.length === 0) return [];
        const cols = results[0].columns;
        return results[0].values.map(vals => {
          const row = {};
          for (let i = 0; i < cols.length; i++) row[cols[i]] = vals[i];
          return row;
        });
      },
      run(...params) {
        db.run(sql, params);
        const changes = db.getRowsModified();
        const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
        const lastInsertRowid = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : 0;
        saveDb();
        return { lastInsertRowid, changes };
      },
    };
  },
};
