import assert from "node:assert/strict";
import { reduceSubscriptionState } from "../src/billing/lifecycle.js";

const active = reduceSubscriptionState(
  { plan: "free", status: "active", currentPeriodEnd: null },
  { type: "activated", currentPeriodEnd: "2026-10-25T00:00:00.000Z" }
);
assert.deepEqual(active, {
  plan: "pro",
  status: "active",
  currentPeriodEnd: "2026-10-25T00:00:00.000Z"
});

const pastDue = reduceSubscriptionState(active, { type: "past_due" });
assert.equal(pastDue.plan, "pro");
assert.equal(pastDue.status, "past_due");
assert.equal(pastDue.currentPeriodEnd, active.currentPeriodEnd);

const canceled = reduceSubscriptionState(pastDue, { type: "canceled" });
assert.equal(canceled.plan, "pro");
assert.equal(canceled.status, "canceled");

const renewed = reduceSubscriptionState(canceled, {
  type: "renewed",
  currentPeriodEnd: "2026-11-25T00:00:00.000Z"
});
assert.equal(renewed.status, "active");
assert.equal(renewed.currentPeriodEnd, "2026-11-25T00:00:00.000Z");

const free = reduceSubscriptionState(renewed, { type: "free" });
assert.deepEqual(free, { plan: "free", status: "active", currentPeriodEnd: null });

assert.throws(
  () => reduceSubscriptionState(active, { type: "unknown" }),
  /unsupported_billing_event/
);

console.log("AMARELO billing lifecycle tests passed.");
