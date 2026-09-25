export async function getProfile(db, userId) {
  return db.prepare(
    `SELECT user_id, display_name, birth_date, monthly_income, financial_wealth,
            essential_expenses, emergency_reserve, monthly_investment, updated_at
       FROM profiles
      WHERE user_id = ?`
  ).bind(userId).first();
}

export async function upsertProfile(db, userId, profile) {
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO profiles (
      user_id, display_name, birth_date, monthly_income, financial_wealth,
      essential_expenses, emergency_reserve, monthly_investment, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      display_name = excluded.display_name,
      birth_date = excluded.birth_date,
      monthly_income = excluded.monthly_income,
      financial_wealth = excluded.financial_wealth,
      essential_expenses = excluded.essential_expenses,
      emergency_reserve = excluded.emergency_reserve,
      monthly_investment = excluded.monthly_investment,
      updated_at = excluded.updated_at`
  ).bind(
    userId, profile.displayName || null, profile.birthDate || null,
    profile.monthlyIncome ?? null, profile.financialWealth ?? null,
    profile.essentialExpenses ?? null, profile.emergencyReserve ?? null,
    profile.monthlyInvestment ?? null, now, now
  ).run();

  return getProfile(db, userId);
}
