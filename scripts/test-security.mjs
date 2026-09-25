import assert from "node:assert/strict";
import { sameOriginAllowed } from "../src/security/request.js";
import { consumeRateLimit } from "../src/security/rate-limit.js";
import { readCookie, sessionCookieName, createOpaqueSessionToken, sessionTokenHash, sessionCookie, clearSessionCookie } from "../src/auth/session.js";

assert.equal(
  sameOriginAllowed(new Request("https://amarelo.test/api/v1/profile", {
    method: "PUT",
    headers: { Origin: "https://amarelo.test" }
  })),
  true
);

assert.equal(
  sameOriginAllowed(new Request("https://amarelo.test/api/v1/profile", {
    method: "PUT",
    headers: { Origin: "https://evil.example" }
  })),
  false
);

assert.equal(
  sameOriginAllowed(new Request("https://amarelo.test/api/v1/profile", { method: "GET" })),
  true
);

const cookieRequest = new Request("https://amarelo.test", {
  headers: { Cookie: "other=x; amarelo_session=session-123; theme=light" }
});
assert.equal(readCookie(cookieRequest, sessionCookieName()), "session-123");

let counter = 0;
const fakeDb = {
  prepare() {
    return {
      bind() {
        return {
          async first() {
            counter += 1;
            return { count: counter };
          }
        };
      }
    };
  }
};

const first = await consumeRateLimit(fakeDb, "test", { limit: 2, windowSeconds: 60 });
assert.equal(first.allowed, true);
assert.equal(first.remaining, 1);

const second = await consumeRateLimit(fakeDb, "test", { limit: 2, windowSeconds: 60 });
assert.equal(second.allowed, true);
assert.equal(second.remaining, 0);

const third = await consumeRateLimit(fakeDb, "test", { limit: 2, windowSeconds: 60 });
assert.equal(third.allowed, false);
assert.equal(third.remaining, 0);
assert.ok(third.resetAt > Date.now());

console.log("AMARELO security contract tests passed.");

const opaque = createOpaqueSessionToken();
assert.equal(opaque.length, 64);
assert.match(opaque, /^[a-f0-9]{64}$/);
const hashed = await sessionTokenHash(opaque);
assert.equal(hashed.length, 64);
assert.notEqual(hashed, opaque);

const cookie = sessionCookie(opaque, 3600);
assert.match(cookie, /HttpOnly/);
assert.match(cookie, /Secure/);
assert.match(cookie, /SameSite=Lax/);
assert.match(cookie, /Max-Age=3600/);

const cleared = clearSessionCookie();
assert.match(cleared, /Max-Age=0/);

console.log("AMARELO session hardening tests passed.");
