export async function listGoals(db, userId) {
  return db.prepare(
    `SELECT id, name, target_amount, current_amount, target_date, metadata_json,
            client_goal_id, created_at, updated_at
       FROM goals
      WHERE user_id = ?
      ORDER BY updated_at DESC`
  ).bind(userId).all();
}

export async function upsertGoal(db, userId, goal) {
  const now = new Date().toISOString();
  let id = goal.id || null;

  if (!id && goal.clientGoalId) {
    const existing = await db.prepare(
      "SELECT id FROM goals WHERE user_id = ? AND client_goal_id = ?"
    ).bind(userId, String(goal.clientGoalId)).first();
    if (existing?.id) id = existing.id;
  }

  if (!id) id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO goals (
      id, user_id, name, target_amount, current_amount, target_date,
      metadata_json, created_at, updated_at, client_goal_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      target_amount = excluded.target_amount,
      current_amount = excluded.current_amount,
      target_date = excluded.target_date,
      metadata_json = excluded.metadata_json,
      client_goal_id = COALESCE(excluded.client_goal_id, goals.client_goal_id),
      updated_at = excluded.updated_at
    WHERE goals.user_id = ?`
  ).bind(
    id, userId, goal.name, goal.targetAmount ?? null, goal.currentAmount ?? null,
    goal.targetDate || null, JSON.stringify(goal.metadata || {}), now, now,
    goal.clientGoalId ? String(goal.clientGoalId) : null, userId
  ).run();

  return { id };
}

export async function deleteGoal(db, userId, goalId) {
  return db.prepare(
    "DELETE FROM goals WHERE id = ? AND user_id = ?"
  ).bind(goalId, userId).run();
}
