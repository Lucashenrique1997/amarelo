import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
migration_dir = root / "migrations"
migrations = sorted(migration_dir.glob("*.sql"))

assert migrations, "No migrations found"

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")

for migration in migrations:
    sql = migration.read_text(encoding="utf-8")
    try:
        db.executescript(sql)
    except Exception as exc:
        raise AssertionError(f"Migration failed: {migration.name}: {exc}") from exc

def columns(table):
    return {row[1] for row in db.execute(f"PRAGMA table_info({table})")}

required_tables = {
    "users",
    "sessions",
    "profiles",
    "favorites",
    "decisions",
    "decision_versions",
    "goals",
    "subscriptions",
    "workspaces",
    "workspace_members",
    "financial_profiles",
    "clients",
    "decision_clients",
    "user_preferences",
}
actual_tables = {
    row[0]
    for row in db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
}
missing = required_tables - actual_tables
assert not missing, f"Missing tables after migrations: {sorted(missing)}"

assert "decision_key" in columns("decisions")
assert "review_due_at" in columns("decisions")
assert "client_version_id" in columns("decision_versions")
assert "client_goal_id" in columns("goals")

indexes = {
    row[0]
    for row in db.execute(
        "SELECT name FROM sqlite_master WHERE type='index'"
    )
}
assert "idx_decision_versions_client_version" in indexes
assert "idx_goals_user_client_goal" in indexes

# Minimal relational smoke test.
db.execute(
    "INSERT INTO users (id, email) VALUES (?, ?)",
    ("user-1", "teste@amarelo.local"),
)
db.execute(
    "INSERT INTO decisions (id, user_id, tool_id, title, decision_key) VALUES (?, ?, ?, ?, ?)",
    ("decision-1", "user-1", "comprar-alugar", "Comprar x Alugar", "comprar-alugar::casa"),
)
db.execute(
    """INSERT INTO decision_versions
       (id, decision_id, version_number, client_version_id)
       VALUES (?, ?, ?, ?)""",
    ("version-1", "decision-1", 1, "local-1"),
)
db.execute(
    """INSERT INTO goals
       (id, user_id, name, client_goal_id)
       VALUES (?, ?, ?, ?)""",
    ("goal-1", "user-1", "Entrada", "goal-local-1"),
)
db.commit()

# Idempotency keys must reject duplicates inside the same owner/decision.
try:
    db.execute(
        """INSERT INTO decision_versions
           (id, decision_id, version_number, client_version_id)
           VALUES (?, ?, ?, ?)""",
        ("version-2", "decision-1", 2, "local-1"),
    )
    raise AssertionError("Duplicate client_version_id should have failed")
except sqlite3.IntegrityError:
    pass

try:
    db.execute(
        """INSERT INTO goals
           (id, user_id, name, client_goal_id)
           VALUES (?, ?, ?, ?)""",
        ("goal-2", "user-1", "Outra meta", "goal-local-1"),
    )
    raise AssertionError("Duplicate client_goal_id should have failed")
except sqlite3.IntegrityError:
    pass

print(f"AMARELO D1/SQLite migration tests passed ({len(migrations)} migrations).")
