-- Ajouter colonne toilet_type à la table messages
ALTER TABLE messages ADD COLUMN toilet_type TEXT DEFAULT 'normal';

-- Ajouter colonne toilet_type à la table player_sessions pour l'historique global
ALTER TABLE player_sessions ADD COLUMN toilet_type TEXT DEFAULT 'normal';

-- Créer une table dédiée aux notes par type de toilettes
CREATE TABLE IF NOT EXISTS toilet_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES player_sessions(id),
  wing_name TEXT NOT NULL,
  wing_number INTEGER NOT NULL,
  floor_number INTEGER NOT NULL,
  toilet_type TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, wing_name, wing_number, floor_number, toilet_type)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_toilet_ratings_player ON toilet_ratings(player_id);
CREATE INDEX IF NOT EXISTS idx_toilet_ratings_floor ON toilet_ratings(wing_name, wing_number, floor_number);
CREATE INDEX IF NOT EXISTS idx_toilet_ratings_type ON toilet_ratings(toilet_type);
