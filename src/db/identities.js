export async function findIdentity(db, provider, subject) {
  return db.prepare(
    `SELECT id, user_id, provider, provider_subject, email, email_verified
       FROM auth_identities
      WHERE provider = ? AND provider_subject = ?`
  ).bind(provider, subject).first();
}

export async function upsertIdentity(db, userId, identity) {
  const id = identity.id || crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO auth_identities (
      id, user_id, provider, provider_subject, email, email_verified,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider, provider_subject) DO UPDATE SET
      user_id = excluded.user_id,
      email = excluded.email,
      email_verified = excluded.email_verified,
      updated_at = excluded.updated_at`
  ).bind(
    id,
    userId,
    identity.provider,
    identity.subject,
    identity.email || null,
    identity.emailVerified ? 1 : 0,
    now,
    now
  ).run();

  return { id, userId, provider: identity.provider, subject: identity.subject };
}
