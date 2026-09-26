const encoder = new TextEncoder();

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 10) return "A senha precisa ter pelo menos 10 caracteres.";
  if (value.length > 128) return "A senha é longa demais.";
  return null;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  const binary = atob(normalized + pad);
  return Uint8Array.from(binary, ch => ch.charCodeAt(0));
}

export function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(String(value)));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function deterministicId(prefix, value) {
  const digest = await sha256(value);
  return prefix + digest.slice(0, 32);
}

export async function hashPassword(password) {
  const iterations = 210000;
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(String(password)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256
  );
  return ["pbkdf2_sha256", iterations, bytesToBase64Url(salt), bytesToBase64Url(new Uint8Array(bits))].join("$");
}

export async function verifyPassword(password, encoded) {
  try {
    const [scheme, iterationText, saltText, expectedText] = String(encoded || "").split("$");
    if (scheme !== "pbkdf2_sha256") return false;
    const iterations = Number(iterationText);
    if (!Number.isInteger(iterations) || iterations < 100000) return false;
    const salt = base64UrlToBytes(saltText);
    const expected = base64UrlToBytes(expectedText);
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(String(password)),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      expected.length * 8
    );
    const actual = new Uint8Array(bits);
    if (actual.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < actual.length; i++) mismatch |= actual[i] ^ expected[i];
    return mismatch === 0;
  } catch {
    return false;
  }
}

export function sqlTimestamp(date = new Date()) {
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

export function sessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 30) {
  return [
    "amarelo_session=" + token,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=" + maxAgeSeconds
  ].join("; ");
}

export function clearSessionCookie() {
  return "amarelo_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export function getCookie(request, name) {
  const source = request.headers.get("cookie") || "";
  for (const part of source.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export function isMutation(request) {
  return !["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase());
}

export function sameOriginOrNoOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
