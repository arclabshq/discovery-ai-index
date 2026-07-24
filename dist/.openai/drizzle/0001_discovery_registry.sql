CREATE TABLE IF NOT EXISTS discoveries (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  field TEXT NOT NULL,
  ai_system TEXT NOT NULL,
  status TEXT NOT NULL,
  announced_at TEXT NOT NULL,
  verified_at TEXT,
  source_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS discoveries_status_idx ON discoveries(status);
CREATE INDEX IF NOT EXISTS discoveries_announced_at_idx ON discoveries(announced_at DESC);
