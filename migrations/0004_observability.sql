-- AMARELO / privacy-conscious product observability
-- Eventos agregados de produto. Não armazenar valores financeiros, perguntas ou premissas.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_events (
  id TEXT PRIMARY KEY,
  anonymous_id TEXT,
  user_id TEXT,
  event_name TEXT NOT NULL,
  route TEXT,
  tool_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_product_events_created ON product_events(created_at);
CREATE INDEX IF NOT EXISTS idx_product_events_name_created ON product_events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_product_events_user_created ON product_events(user_id, created_at);
