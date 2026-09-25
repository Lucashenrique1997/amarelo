import assert from "node:assert/strict";
import worker from "../src/worker.js";

const assetEnv = {
  ASSETS: {
    async fetch(request) {
      return new Response("asset:" + new URL(request.url).pathname, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
};

async function call(path, init = {}) {
  return worker.fetch(new Request("https://amarelo.test" + path, init), assetEnv);
}

const capabilities = await call("/api/capabilities");
assert.equal(capabilities.status, 200);
const cap = await capabilities.json();
assert.equal(cap.app, "amarelo");
assert.equal(cap.phase, "beta");
assert.equal(cap.database, "not-bound-yet");
assert.equal(cap.persistence, false);
assert.equal(cap.authentication, false);
assert.equal(capabilities.headers.get("X-Content-Type-Options"), "nosniff");
assert.equal(capabilities.headers.get("Cache-Control"), "no-store");
assert.ok(capabilities.headers.get("X-Request-ID"));

const health = await call("/api/health");
assert.equal(health.status, 200);
assert.equal((await health.json()).database, "not-bound-yet");

const privateWithoutDb = await call("/api/v1/profile");
assert.equal(privateWithoutDb.status, 503);
assert.equal((await privateWithoutDb.json()).error, "database_not_configured");

const missingApi = await call("/api/not-real");
assert.equal(missingApi.status, 404);

const asset = await call("/some-route");
assert.equal(asset.status, 200);
assert.equal(await asset.text(), "asset:/some-route");
assert.equal(asset.headers.get("X-Frame-Options"), "DENY");
assert.equal(asset.headers.get("Cross-Origin-Opener-Policy"), "same-origin");

console.log("AMARELO Worker/API contract tests passed.");

const failingEnv = {
  ASSETS: {
    async fetch() {
      throw new Error("synthetic asset failure");
    }
  }
};
const safeFailure = await worker.fetch(new Request("https://amarelo.test/failure"), failingEnv);
assert.equal(safeFailure.status, 500);
const failureBody = await safeFailure.json();
assert.equal(failureBody.error, "internal_error");
assert.ok(failureBody.requestId);
assert.equal(safeFailure.headers.get("X-Request-ID"), failureBody.requestId);
