export async function listDecisions(db, userId, limit = 100) {
  return db.prepare(
    `SELECT id, tool_id, decision_key, decision_name, title, status, primary_result,
            summary, review_due_at, created_at, updated_at
       FROM decisions
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT ?`
  ).bind(userId, limit).all();
}

export async function getDecision(db, userId, decisionId) {
  return db.prepare(
    `SELECT *
       FROM decisions
      WHERE id = ? AND user_id = ?`
  ).bind(decisionId, userId).first();
}

export async function listDecisionVersions(db, userId, decisionId) {
  return db.prepare(
    `SELECT v.*
       FROM decision_versions v
       JOIN decisions d ON d.id = v.decision_id
      WHERE v.decision_id = ? AND d.user_id = ?
      ORDER BY v.version_number DESC`
  ).bind(decisionId, userId).all();
}

export async function upsertDecisionWithVersion(db, userId, input) {
  const now = new Date().toISOString();
  const decisionKey = input.decisionKey || `${input.toolId}::${input.decisionName || input.title}`;
  const reviewDueAt = input.reviewDueAt || null;

  let decisionId = input.decisionId || null;
  let existing = null;

  if (decisionId) {
    existing = await db.prepare(
      "SELECT id FROM decisions WHERE id = ? AND user_id = ?"
    ).bind(decisionId, userId).first();
    if (!existing) decisionId = null;
  }

  if (!existing && decisionKey) {
    existing = await db.prepare(
      "SELECT id FROM decisions WHERE user_id = ? AND decision_key = ?"
    ).bind(userId, decisionKey).first();
    if (existing?.id) decisionId = existing.id;
  }

  if (!decisionId) decisionId = crypto.randomUUID();

  const decisionStatement = existing
    ? db.prepare(
        `UPDATE decisions
            SET tool_id = ?, decision_key = ?, decision_name = ?, title = ?, status = ?,
                inputs_json = ?, outputs_json = ?, assumptions_json = ?, primary_result = ?,
                summary = ?, workspace_id = ?, review_due_at = ?, updated_at = ?
          WHERE id = ? AND user_id = ?`
      ).bind(
        input.toolId, decisionKey, input.decisionName || input.title, input.title,
        input.status || "active", JSON.stringify(input.inputs || {}),
        JSON.stringify(input.outputs || {}), JSON.stringify(input.assumptions || {}),
        input.primaryResult || null, input.summary || null, input.workspaceId || null,
        reviewDueAt, now, decisionId, userId
      )
    : db.prepare(
        `INSERT INTO decisions (
          id, user_id, tool_id, decision_key, decision_name, title, status,
          inputs_json, outputs_json, assumptions_json, primary_result, summary,
          workspace_id, review_due_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        decisionId, userId, input.toolId, decisionKey, input.decisionName || input.title,
        input.title, input.status || "active", JSON.stringify(input.inputs || {}),
        JSON.stringify(input.outputs || {}), JSON.stringify(input.assumptions || {}),
        input.primaryResult || null, input.summary || null, input.workspaceId || null,
        reviewDueAt, now, now
      );

  if (input.clientVersionId) {
    const synced = await db.prepare(
      `SELECT version_number
         FROM decision_versions
        WHERE decision_id = ? AND client_version_id = ?`
    ).bind(decisionId, String(input.clientVersionId)).first();

    if (synced) {
      await decisionStatement.run();
      return { decisionId, versionId: synced.id, versionNumber: Number(synced.version_number), decisionKey, deduplicated: true };
    }
  }

  const current = await db.prepare(
    "SELECT COALESCE(MAX(version_number), 0) AS version FROM decision_versions WHERE decision_id = ?"
  ).bind(decisionId).first();
  const versionNumber = Number(current?.version || 0) + 1;

  const versionId = crypto.randomUUID();
  const versionCreatedAt = input.clientCreatedAt || now;
  const versionStatement = db.prepare(
    `INSERT INTO decision_versions (
      id, decision_id, version_number, scenario_label, inputs_json, outputs_json,
      assumptions_json, sensitivity_json, primary_result, summary, created_at, client_version_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    versionId, decisionId, versionNumber, input.scenarioLabel || null,
    JSON.stringify(input.inputs || {}), JSON.stringify(input.outputs || {}),
    JSON.stringify(input.assumptions || {}), JSON.stringify(input.sensitivity || []),
    input.primaryResult || null, input.summary || null, versionCreatedAt,
    input.clientVersionId ? String(input.clientVersionId) : null
  );

  await db.batch([decisionStatement, versionStatement]);
  return { decisionId, versionId, versionNumber, decisionKey, deduplicated: false };
}

export async function deleteDecisionVersion(db, userId, decisionId, versionId) {
  const owned = await db.prepare(
    `SELECT v.id
       FROM decision_versions v
       JOIN decisions d ON d.id = v.decision_id
      WHERE v.id = ? AND v.decision_id = ? AND d.user_id = ?`
  ).bind(versionId, decisionId, userId).first();

  if (!owned) return { deleted: false, decisionDeleted: false };

  await db.prepare(
    "DELETE FROM decision_versions WHERE id = ? AND decision_id = ?"
  ).bind(versionId, decisionId).run();

  const latest = await db.prepare(
    `SELECT inputs_json, outputs_json, assumptions_json, primary_result, summary
       FROM decision_versions
      WHERE decision_id = ?
      ORDER BY version_number DESC
      LIMIT 1`
  ).bind(decisionId).first();

  if (!latest) {
    await db.prepare(
      "DELETE FROM decisions WHERE id = ? AND user_id = ?"
    ).bind(decisionId, userId).run();
    return { deleted: true, decisionDeleted: true };
  }

  await db.prepare(
    `UPDATE decisions
        SET inputs_json = ?, outputs_json = ?, assumptions_json = ?,
            primary_result = ?, summary = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?`
  ).bind(
    latest.inputs_json, latest.outputs_json, latest.assumptions_json,
    latest.primary_result, latest.summary, decisionId, userId
  ).run();

  return { deleted: true, decisionDeleted: false };
}
