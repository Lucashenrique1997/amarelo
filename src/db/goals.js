export async function listGoals(db, userId) {
  return db.prepare(
    `SELECT id, name, target_amount, current_amount, target_date, metadata_json,
            created_at, updated_at
       FROM goals
      WHERE user_id = ?
      ORDER BY updated_at DESC`
  ).bind(userId).all();
}

export async function upsertGoal(db, userId, goal) {
  const id = goal.id || crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO goals (
      id, user_id, name, target_amount, current_amount, target_date,
      metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      target_amount = excluded.target_amount,
      current_amount = excluded.current_amount,
      target_date = excluded.target_date,
      metadata_json = excluded.metadata_json,
      updated_at = excluded.updated_at
    WHERE goals.user_id = ?`
  ).bind(
    id, userId, goal.name, goal.targetAmount ?? null, goal.currentAmount ?? null,
    goal.targetDate || null, JSON.stringify(goal.metadata || {}), now, now, userId
  ).run();

  return { id };
}

export async function deleteGoal(db, userId, goalId) {
  return db.prepare(
    "DELETE FROM goals WHERE id = ? AND user_id = ?"
  ).bind(goalId, userId).run();
}
