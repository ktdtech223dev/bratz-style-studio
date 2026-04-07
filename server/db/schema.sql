CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(64) UNIQUE NOT NULL,
  coins INTEGER DEFAULT 500,
  gems INTEGER DEFAULT 10,
  style_shards INTEGER DEFAULT 0,
  login_streak INTEGER DEFAULT 0,
  last_login DATE,
  total_pulls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_collection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id),
  item_id VARCHAR(32) NOT NULL,
  item_type VARCHAR(16) NOT NULL,
  rarity VARCHAR(16) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, item_id)
);

CREATE TABLE IF NOT EXISTS player_pity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id),
  banner_id VARCHAR(32) NOT NULL,
  pull_count INTEGER DEFAULT 0,
  guaranteed_rare_count INTEGER DEFAULT 0,
  UNIQUE(player_id, banner_id)
);

CREATE TABLE IF NOT EXISTS saved_looks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id),
  look_name VARCHAR(64) DEFAULT 'My Look',
  character VARCHAR(16) NOT NULL,
  skin_tone INTEGER NOT NULL,
  hair_id VARCHAR(32),
  hair_color_primary VARCHAR(32),
  hair_color_secondary VARCHAR(32),
  hair_dye_mode VARCHAR(16),
  equipped_items JSONB NOT NULL,
  makeup_config JSONB,
  thumbnail TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id),
  challenge_id VARCHAR(64) NOT NULL,
  challenge_type VARCHAR(16) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  claimed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  reset_date DATE,
  UNIQUE(player_id, challenge_id, reset_date)
);

CREATE TABLE IF NOT EXISTS pull_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id),
  banner_id VARCHAR(32) NOT NULL,
  item_id VARCHAR(32) NOT NULL,
  rarity VARCHAR(16) NOT NULL,
  pulled_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_player ON player_collection(player_id);
CREATE INDEX IF NOT EXISTS idx_looks_player ON saved_looks(player_id);
CREATE INDEX IF NOT EXISTS idx_challenges_player ON challenge_progress(player_id);
