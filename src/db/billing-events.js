export async function billingEventAlreadyProcessed(db, provider, providerEventId) {
  const row = await db.prepare(
    `SELECT processed_at
       FROM billing_events
      WHERE provider = ? AND provider_event_id = ?`
  ).bind(provider, providerEventId).first();

  return Boolean(row?.processed_at);
}

export async function beginBillingEvent(db, {
  provider,
  providerEventId,
  eventType,
  payloadHash = null
}) {
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT OR IGNORE INTO billing_events (
      id, provider, provider_event_id, event_type, payload_hash, created_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).bind(id, provider, providerEventId, eventType, payloadHash).run();

  return { id };
}

export async function markBillingEventProcessed(db, provider, providerEventId) {
  await db.prepare(
    `UPDATE billing_events
        SET processed_at = CURRENT_TIMESTAMP
      WHERE provider = ? AND provider_event_id = ?`
  ).bind(provider, providerEventId).run();
}
