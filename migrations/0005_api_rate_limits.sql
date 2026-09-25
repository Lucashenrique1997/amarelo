-- AMARELO 1.0 / API rate-limit counters
-- Append-only migration. Designed for authenticated write APIs and future auth endpoints.

CREATE TABLE IF NOT EXISTS api_rate_limits (
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated
  ON api_rate_limits(updated_at);
