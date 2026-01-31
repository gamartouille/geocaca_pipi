-- Ajouter colonne password à player_sessions
ALTER TABLE player_sessions ADD COLUMN password TEXT;
ALTER TABLE player_sessions ADD COLUMN created_session_at TIMESTAMP DEFAULT NOW();

-- Créer une table d'historique détaillée des cacas
CREATE TABLE IF NOT EXISTS poop_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES player_sessions(id) ON DELETE CASCADE,
  wing_name TEXT NOT NULL,
  wing_number INTEGER NOT NULL,
  floor_number INTEGER NOT NULL,
  toilet_type TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche rapide par joueur
CREATE INDEX IF NOT EXISTS idx_poop_history_player ON poop_history(player_id);
CREATE INDEX IF NOT EXISTS idx_poop_history_floor ON poop_history(wing_name, wing_number, floor_number);
CREATE INDEX IF NOT EXISTS idx_poop_history_created ON poop_history(created_at);


