-- AMARELO / Commercial readiness
-- Expande o modelo para decisões versionadas, workspaces pessoais/familiares/profissionais
-- e acompanhamento persistente. Não ativa autenticação ou cobrança por conta própria.

PRAGMA foreign_keys = ON;

ALTER TABLE decisions ADD COLUMN decision_key TEXT;
ALTER TABLE decisions ADD COLUMN decision_name TEXT;
ALTER TABLE decisions ADD COLUMN workspace_id TEXT;
ALTER TABLE decisions ADD COLUMN review_due_at TEXT;

CREATE INDEX IF NOT EXISTS idx_decisions_user_key ON decisions(user_id, decision_key);
CREATE INDEX IF NOT EXISTS idx_decisions_review_due ON decisions(user_id, review_due_at);

CREATE TABLE IF NOT EXISTS decision_versions (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  scenario_label TEXT,
  inputs_json TEXT NOT NULL DEFAULT '{}',
  outputs_json TEXT NOT NULL DEFAULT '{}',
  assumptions_json TEXT NOT NULL DEFAULT '{}',
  sensitivity_json TEXT NOT NULL DEFAULT '[]',
  primary_result TEXT,
  summary TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
  UNIQUE(decision_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_decision_versions_decision ON decision_versions(decision_id, version_number DESC);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal'
    CHECK(type IN ('personal','family','professional')),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_user_id);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK(role IN ('owner','admin','member','viewer')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS financial_profiles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT,
  display_name TEXT NOT NULL,
  monthly_income REAL,
  financial_wealth REAL,
  essential_expenses REAL,
  emergency_reserve REAL,
  monthly_investment REAL,
  birth_date TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_financial_profiles_workspace ON financial_profiles(workspace_id);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  external_reference TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_clients_workspace ON clients(workspace_id);

CREATE TABLE IF NOT EXISTS decision_clients (
  decision_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  PRIMARY KEY (decision_id, client_id),
  FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  review_interval_days INTEGER NOT NULL DEFAULT 45,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  preferences_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
