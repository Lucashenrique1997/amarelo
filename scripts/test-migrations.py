#!/usr/bin/env python3
import glob
import sqlite3
import sys

paths = sorted(glob.glob("migrations/*.sql"))
if not paths:
    raise SystemExit("No migrations found")

conn = sqlite3.connect(":memory:")
conn.execute("PRAGMA foreign_keys = ON")

for path in paths:
    sql = open(path, "r", encoding="utf-8").read()
    try:
        conn.executescript(sql)
    except Exception as exc:
        raise SystemExit(f"Migration failed: {path}: {exc}")

tables = {
    row[0]
    for row in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()
}

required_tables = {
    "users",
    "sessions",
    "profiles",
    "decisions",
    "decision_versions",
    "goals",
    "subscriptions",
    "workspaces",
    "workspace_members",
    "financial_profiles",
    "clients",
    "api_rate_limits",
    "auth_identities",
    "billing_events",
}

missing = required_tables - tables
if missing:
    raise SystemExit(f"Missing tables after migrations: {sorted(missing)}")

def columns(table):
    return {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}

required_columns = {
    "decisions": {"decision_key", "decision_name", "workspace_id", "review_due_at"},
    "decision_versions": {"client_version_id", "version_number", "sensitivity_json"},
    "goals": {"client_goal_id", "target_amount", "current_amount"},
    "subscriptions": {"provider", "provider_customer_id", "provider_subscription_id", "metadata_json"},
    "auth_identities": {"provider", "provider_subject", "email_verified"},
}

for table, expected in required_columns.items():
    actual = columns(table)
    absent = expected - actual
    if absent:
        raise SystemExit(f"Missing columns in {table}: {sorted(absent)}")

# Basic foreign-key integrity on an empty database.
violations = conn.execute("PRAGMA foreign_key_check").fetchall()
if violations:
    raise SystemExit(f"Foreign-key violations: {violations}")

print(f"AMARELO migration test passed: {len(paths)} migrations applied in order.")
