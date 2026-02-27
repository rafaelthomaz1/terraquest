CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  picture TEXT,
  google_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_xp INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  game_mode TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  xp_earned INTEGER DEFAULT 0,
  difficulty TEXT,
  extra_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_records_user_mode ON game_records(user_id, game_mode);

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  ip_address TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_country ON page_views(country);

CREATE TABLE IF NOT EXISTS login_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  method TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_created ON login_events(created_at);

CREATE TABLE IF NOT EXISTS screen_time (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  screen_name TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_screen_time_created ON screen_time(created_at);
CREATE INDEX IF NOT EXISTS idx_screen_time_screen ON screen_time(screen_name);
