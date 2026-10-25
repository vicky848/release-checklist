
CREATE TABLE IF NOT EXISTS releases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  release_date TIMESTAMPTZ NOT NULL,
  additional_info TEXT DEFAULT '',
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
