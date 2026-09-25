const SESSION_COOKIE = "amarelo_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const parts = header.split(";").map(v => v.trim());
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index);
    if (key === name) return decodeURIComponent(part.slice(index + 1));
  }
  return null;
}

function toHex(bytes) {
  return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, "0")).join("");
}

export async function sessionTokenHash(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(digest);
}

export function createOpaqueSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map(v => v.toString(16).padStart(2, "0")).join("");
}

export function sessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`
  ].join("; ");
}

export function clearSessionCookie() {
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0"
  ].join("; ");
}

export async function createSession(db, userId, ttlSeconds = SESSION_TTL_SECONDS) {
  const token = createOpaqueSessionToken();
  const id = await sessionTokenHash(token);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  await db.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, created_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
  ).bind(id, userId, expiresAt).run();

  return { token, expiresAt, cookie: sessionCookie(token, ttlSeconds) };
}

export async function revokeSession(db, token) {
  if (!token) return;
  const id = await sessionTokenHash(token);
  await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
}

export async function authenticatedUserId(request, env) {
  if (!env.DB) return null;
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const sessionId = await sessionTokenHash(token);
  const row = await env.DB.prepare(
    `SELECT user_id
       FROM sessions
      WHERE id = ?
        AND expires_at > CURRENT_TIMESTAMP`
  ).bind(sessionId).first();

  return row?.user_id || null;
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}
