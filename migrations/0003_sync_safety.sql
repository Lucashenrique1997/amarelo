-- AMARELO 1.0 / Sync safety
-- Torna a migração navegador -> conta idempotente.

PRAGMA foreign_keys = ON;

ALTER TABLE decision_versions ADD COLUMN client_version_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_decision_versions_client_version
  ON decision_versions(decision_id, client_version_id)
  WHERE client_version_id IS NOT NULL;
