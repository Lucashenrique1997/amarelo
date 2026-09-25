export async function consumeRateLimit(db, key, {
  limit = 120,
  windowSeconds = 60
} = {}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(nowSeconds / windowSeconds) * windowSeconds;

  const row = await db.prepare(
    `INSERT INTO api_rate_limits (key, window_start, count, updated_at)
     VALUES (?, ?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(key, window_start) DO UPDATE SET
       count = api_rate_limits.count + 1,
       updated_at = CURRENT_TIMESTAMP
     RETURNING count`
  ).bind(key, windowStart).first();

  const count = Number(row?.count || 1);
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt: (windowStart + windowSeconds) * 1000
  };
}
