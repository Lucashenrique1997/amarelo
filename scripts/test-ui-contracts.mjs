import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync("public/index.html", "utf8");
const app = readFileSync("public/assets/app.js", "utf8");
const dashboard = readFileSync("public/assets/dashboard.js", "utf8");
const history = readFileSync("public/assets/decision-history.js", "utf8");
const goals = readFileSync("public/assets/goals.js", "utf8");

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

for (const id of [
  "app",
  "route-home",
  "route-tools",
  "route-dashboard",
  "route-pricing",
  "route-ask",
  "route-tool",
  "heroAsk",
  "toolSearch",
  "toolLibrary",
  "calculator",
  "result",
  "profileModal",
  "goalModal",
  "versionModal",
  "reportModal",
  "reportContent",
  "savedDecisions",
  "reviewQueue",
  "decisionPulse",
  "favoriteTools",
  "nextDecision",
  "goalList",
  "toast"
]) {
  assert.ok(ids.has(id), `critical DOM id is missing: ${id}`);
}

for (const fn of ["navigate","openTool","renderTools","renderHome"]) {
  assert.ok(app.includes(`function ${fn}`), `app runtime missing ${fn}()`);
}

for (const fn of ["renderDashboard","openProfile","closeProfile","exportBackup"]) {
  assert.ok(dashboard.includes(`function ${fn}`), `dashboard layer missing ${fn}()`);
}

for (const fn of [
  "saveDecision","openSavedDecision","openVersionCompare","closeVersionCompare",
  "openDecisionReport","printDecisionReport","closeDecisionReport"
]) {
  assert.ok(history.includes(`function ${fn}`), `decision-history layer missing ${fn}()`);
}

for (const fn of ["renderGoals","openGoalModal","closeGoalModal","saveGoal"]) {
  assert.ok(goals.includes(`function ${fn}`), `goals layer missing ${fn}()`);
}

const scriptOrder = [
  "/assets/catalog.js",
  "/assets/finance-core.js",
  "/assets/decision-config.js",
  "/assets/scenario-system.js",
  "/assets/decision-engines.js",
  "/assets/data-store.js",
  "/assets/runtime-capabilities.js",
  "/assets/api-client.js",
  "/assets/sync-service.js",
  "/assets/decision-history.js",
  "/assets/goals.js",
  "/assets/dashboard.js",
  "/assets/app.js"
];
let last = -1;
for (const src of scriptOrder) {
  const index = html.indexOf(src);
  assert.ok(index > last, `script order invalid at ${src}`);
  last = index;
}

assert.ok(app.includes("event.key!=='Escape'"), "Escape dialog behavior is missing.");

console.log("AMARELO UI contract tests passed.");
