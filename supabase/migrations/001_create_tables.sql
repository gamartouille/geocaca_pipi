-- Table pour les messages (associés aux étages/ailes)
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  floor_number INTEGER NOT NULL,
  wing_name TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(code, floor_number, wing_name)
);

-- Table pour les sessions des joueurs et leurs notes
CREATE TABLE IF NOT EXISTS player_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL,
  toilet_rating INTEGER,
  toilet_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche rapide par code
CREATE INDEX IF NOT EXISTS idx_player_sessions_code ON player_sessions(code);

-- Index pour recherche rapide par session
CREATE INDEX IF NOT EXISTS idx_player_sessions_session_id ON player_sessions(session_id);
