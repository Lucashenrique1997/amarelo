const SESSION_COOKIE = "amarelo_session";

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

export async function authenticatedUserId(request, env) {
  if (!env.DB) return null;
  const sessionId = readCookie(request, SESSION_COOKIE);
  if (!sessionId) return null;

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
