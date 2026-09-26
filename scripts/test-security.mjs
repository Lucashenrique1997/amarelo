import assert from "node:assert/strict";
import {
  hashPassword,
  normalizeEmail,
  randomToken,
  sha256,
  validatePassword,
  verifyPassword
} from "../src/lib/security.js";

assert.equal(normalizeEmail("  Lucas@Example.COM "), "lucas@example.com");
assert.equal(validatePassword("123"), "A senha precisa ter pelo menos 10 caracteres.");
assert.equal(validatePassword("uma-senha-bem-melhor"), null);

const encoded = await hashPassword("uma-senha-bem-melhor");
assert.match(encoded, /^pbkdf2_sha256\$210000\$/);
assert.equal(await verifyPassword("uma-senha-bem-melhor", encoded), true);
assert.equal(await verifyPassword("senha-errada-123", encoded), false);

const token = randomToken(32);
assert.ok(token.length >= 40);
assert.notEqual(await sha256("a"), await sha256("b"));

console.log("Security primitives passed.");
