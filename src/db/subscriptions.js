export async function getSubscription(db, userId) {
  const row = await db.prepare(
    `SELECT plan, status, current_period_end
       FROM subscriptions
      WHERE user_id = ?`
  ).bind(userId).first();

  return row || { plan: "free", status: "active", current_period_end: null };
}

export async function getEntitlements(db, userId, { proBeta = false } = {}) {
  const subscription = await getSubscription(db, userId);
  const paid = subscription.status === "active" && subscription.plan === "pro";
  const pro = proBeta || paid;

  return {
    plan: pro ? "pro" : "free",
    pro,
    source: paid ? "subscription" : proBeta ? "beta" : "free",
    unlimitedDecisions: pro,
    reports: pro,
    scenarios: pro,
    versionHistory: pro,
    currentPeriodEnd: subscription.current_period_end || null
  };
}
