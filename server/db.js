import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'terraquest.db');

let db;

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
