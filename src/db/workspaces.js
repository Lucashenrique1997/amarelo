export async function listWorkspaces(db, userId) {
  return db.prepare(
    `SELECT w.id, w.name, w.type, wm.role, w.created_at, w.updated_at
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = ?
      ORDER BY w.updated_at DESC`
  ).bind(userId).all();
}

export async function createPersonalWorkspace(db, userId, name = "Meu AMARELO") {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.batch([
    db.prepare(
      `INSERT INTO workspaces (id, owner_user_id, type, name, created_at, updated_at)
       VALUES (?, ?, 'personal', ?, ?, ?)`
    ).bind(id, userId, name, now, now),
    db.prepare(
      `INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
       VALUES (?, ?, 'owner', ?)`
    ).bind(id, userId, now)
  ]);

  return { id, ownerUserId: userId, type: "personal", name };
}
