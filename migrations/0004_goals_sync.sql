-- AMARELO 1.0 / Goal sync safety

PRAGMA foreign_keys = ON;

ALTER TABLE goals ADD COLUMN client_goal_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_user_client_goal
  ON goals(user_id, client_goal_id)
  WHERE client_goal_id IS NOT NULL;
