export function reduceSubscriptionState(current = {}, event = {}) {
  const base = {
    plan: current.plan || "free",
    status: current.status || "active",
    currentPeriodEnd: current.currentPeriodEnd || null
  };

  switch (event.type) {
    case "activated":
    case "renewed":
      return {
        plan: "pro",
        status: "active",
        currentPeriodEnd: event.currentPeriodEnd || base.currentPeriodEnd || null
      };
    case "past_due":
      return {
        plan: "pro",
        status: "past_due",
        currentPeriodEnd: event.currentPeriodEnd || base.currentPeriodEnd || null
      };
    case "canceled":
      return {
        plan: "pro",
        status: "canceled",
        currentPeriodEnd: event.currentPeriodEnd || base.currentPeriodEnd || null
      };
    case "free":
      return {
        plan: "free",
        status: "active",
        currentPeriodEnd: null
      };
    default:
      throw new Error("unsupported_billing_event");
  }
}

export async function persistSubscriptionState(db, userId, provider, state, {
  providerCustomerId = null,
  providerSubscriptionId = null,
  metadata = {}
} = {}) {
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO subscriptions (
      user_id, plan, status, provider, provider_customer_id,
      provider_subscription_id, current_period_end, metadata_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      plan = excluded.plan,
      status = excluded.status,
      provider = excluded.provider,
      provider_customer_id = COALESCE(excluded.provider_customer_id, subscriptions.provider_customer_id),
      provider_subscription_id = COALESCE(excluded.provider_subscription_id, subscriptions.provider_subscription_id),
      current_period_end = excluded.current_period_end,
      metadata_json = excluded.metadata_json,
      updated_at = excluded.updated_at`
  ).bind(
    userId,
    state.plan,
    state.status,
    provider,
    providerCustomerId,
    providerSubscriptionId,
    state.currentPeriodEnd,
    JSON.stringify(metadata || {}),
    now,
    now
  ).run();

  return state;
}
