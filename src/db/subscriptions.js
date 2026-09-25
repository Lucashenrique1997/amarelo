export async function getSubscription(db, userId) {
  const row = await db.prepare(
    `SELECT plan, status, current_period_end
       FROM subscriptions
      WHERE user_id = ?`
  ).bind(userId).first();

  return row || { plan: "free", status: "active", current_period_end: null };
}

export async function getEntitlements(db, userId) {
  const subscription = await getSubscription(db, userId);
  const paid = subscription.status === "active" && subscription.plan === "pro";

  return {
    plan: paid ? "pro" : "free",
    pro: paid,
    unlimitedDecisions: paid,
    reports: paid,
    scenarios: paid,
    versionHistory: paid,
    currentPeriodEnd: subscription.current_period_end || null
  };
}
