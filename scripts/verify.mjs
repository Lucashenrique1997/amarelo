import { readFileSync, statSync } from "node:fs";

const read = path => readFileSync(path, "utf8");

const html = read("public/index.html");
const rootHtml = read("index.html");
const css = read("public/assets/app.css");
const catalog = read("public/assets/catalog.js");
const financeCore = read("public/assets/finance-core.js");
const decisionConfig = read("public/assets/decision-config.js");
const scenarioSystem = read("public/assets/scenario-system.js");
const decisionEngines = read("public/assets/decision-engines.js");
const dataStore = read("public/assets/data-store.js");
const runtimeCapabilities = read("public/assets/runtime-capabilities.js");
const apiClient = read("public/assets/api-client.js");
const syncService = read("public/assets/sync-service.js");
const decisionHistory = read("public/assets/decision-history.js");
const goals = read("public/assets/goals.js");
const dashboard = read("public/assets/dashboard.js");
const app = read("public/assets/app.js");
const wrangler = read("wrangler.toml");
const worker = read("src/worker.js");
const apiRouter = read("src/api/router.js");
const apiHealth = read("src/api/health.js");
const productConfig = read("src/config/product.js");
const decisionsRepo = read("src/db/decisions.js");
const profilesRepo = read("src/db/profiles.js");
const workspacesRepo = read("src/db/workspaces.js");
const goalsRepo = read("src/db/goals.js");
const subscriptionsRepo = read("src/db/subscriptions.js");
const authSession = read("src/auth/session.js");
const privateApi = read("src/api/private.js");
const security = read("src/http/security.js");
const migration1 = read("migrations/0001_initial.sql");
const migration2 = read("migrations/0002_commercial_readiness.sql");
const migration3 = read("migrations/0003_sync_safety.sql");
const migration4 = read("migrations/0004_goals_sync.sql");

const frontend = [html, css, catalog, financeCore, decisionConfig, scenarioSystem, decisionEngines, dataStore, runtimeCapabilities, apiClient, syncService, decisionHistory, goals, dashboard, app].join("\n");
const backend = [worker, apiRouter, apiHealth, privateApi, productConfig, decisionsRepo, profilesRepo, workspacesRepo, goalsRepo, subscriptionsRepo, authSession, security, wrangler, migration1, migration2, migration3, migration4].join("\n");
const runtimeSurface = [frontend, worker, apiRouter, apiHealth, productConfig, decisionsRepo, profilesRepo, workspacesRepo, wrangler].join("\n").toLowerCase();

if (html !== rootHtml) throw new Error("Root preview and public application shell are out of sync.");
if (/<style[\s>]/i.test(html)) throw new Error("Application shell must not contain inline CSS.");
if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(html)) throw new Error("Application shell must not contain inline JavaScript.");

const requiredAssets = [
  "/assets/app.css",
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
let previous = -1;
for (const asset of requiredAssets) {
  const index = html.indexOf(asset);
  if (index < 0) throw new Error(`Missing frontend asset: ${asset}`);
  if (index <= previous) throw new Error(`Frontend asset order is invalid near ${asset}`);
  previous = index;
}

for (const [name, code] of [
  ["catalog.js", catalog],
  ["finance-core.js", financeCore],
  ["decision-config.js", decisionConfig],
  ["scenario-system.js", scenarioSystem],
  ["decision-engines.js", decisionEngines],
  ["data-store.js", dataStore],
  ["runtime-capabilities.js", runtimeCapabilities],
  ["api-client.js", apiClient],
  ["sync-service.js", syncService],
  ["decision-history.js", decisionHistory],
  ["goals.js", goals],
  ["dashboard.js", dashboard],
  ["app.js", app]
]) {
  try {
    new Function(code);
  } catch (error) {
    throw new Error(`${name} does not parse: ${error.message}`);
  }
}

if (app.length > 40000) throw new Error(`app.js grew too large (${app.length} bytes). Split responsibilities before merging.`);
if (html.length > 40000) throw new Error(`index.html grew too large (${html.length} bytes). Keep it as an application shell.`);
if (app.includes("const tools=[")) throw new Error("Tools catalog leaked back into app.js.");
if (app.includes("function loanFlow(")) throw new Error("Financial core leaked back into app.js.");
if (app.includes("function buildForm(")) throw new Error("Decision config leaked back into app.js.");
if (app.includes("function calculateTool(")) throw new Error("Decision engine execution leaked back into app.js.");
if (app.includes("const storage={")) throw new Error("Data adapter leaked back into app.js.");
if (app.includes("const scenarioDecisionIds=")) throw new Error("Scenario system leaked back into app.js.");
if (app.includes("function saveDecision(")) throw new Error("Decision history leaked back into app.js.");
if (app.includes("function renderDashboard(")) throw new Error("Dashboard leaked back into app.js.");
if (!dataStore.includes("const storage=")) throw new Error("Client data adapter contract is missing.");
if (!runtimeCapabilities.includes("refreshRuntimeCapabilities")) throw new Error("Runtime capability layer is missing.");
if (!apiClient.includes("const amareloApi=")) throw new Error("Authenticated API client is missing.");
if (!syncService.includes("syncAccountIfAvailable") || !syncService.includes("clientVersionId")) throw new Error("Account synchronization layer is incomplete.");
if (!scenarioSystem.includes("function compareScenarios(")) throw new Error("Scenario system is missing.");
if (!decisionHistory.includes("function openDecisionReport(")) throw new Error("Decision history/report layer is missing.");
if (!goals.includes("function renderGoals(") || !goals.includes("function saveGoal(")) throw new Error("Tracked goals module is incomplete.");
if (!dashboard.includes("function renderDashboard(")) throw new Error("Dashboard layer is missing.");

const requiredProductMarkers = [
  "<title>AMARELO",
  "Antes de decidir",
  "Pergunte ao AMARELO",
  "Premissas usadas nesta conta",
  "decisionCockpit",
  "scenarioLab",
  "LABORATÓRIO DE CENÁRIOS",
  "RELATÓRIO AMARELO",
  "SEM COBRANÇA NESTA FASE",
  "PRO PREVIEW",
  "Preço-alvo no lançamento",
  "EM DESENVOLVIMENTO",
  "comparar-financiamentos",
  "imovel-na-planta",
  "bonus-decidir",
  "independencia-financeira",
  "portabilidade-divida",
  "trocar-carro"
];
for (const marker of requiredProductMarkers) {
  if (!frontend.includes(marker)) throw new Error(`Missing product marker: ${marker}`);
}

const catalogMatch = catalog.match(/window\.AMARELO_TOOLS=(\[[\s\S]*\]);\s*$/);
if (!catalogMatch) throw new Error("Could not isolate AMARELO tools catalog.");
const ids = [...catalogMatch[1].matchAll(/\{id:'([^']+)'/g)].map(m => m[1]);
if (ids.length < 40) throw new Error(`Expected at least 40 financial tools, found ${ids.length}.`);
if (new Set(ids).size !== ids.length) throw new Error("Duplicate tool ids found.");

for (const id of [
  "financiamento-consorcio",
  "comprar-alugar",
  "comparar-financiamentos",
  "amortizar-investir",
  "renda-fixa",
  "gross-up",
  "aposentadoria",
  "portabilidade-divida",
  "trocar-carro",
  "imovel-na-planta",
  "bonus-decidir",
  "independencia-financeira"
]) {
  if (!ids.includes(id)) throw new Error(`Missing priority decision engine: ${id}`);
}

for (const marker of ["function loanFlow(", "function taxLots(", "function fixedIncomeProduct(", "function solveRate("]) {
  if (!financeCore.includes(marker)) throw new Error(`Financial core missing: ${marker}`);
}
for (const marker of ["function buildForm(", "function method("]) {
  if (!decisionConfig.includes(marker)) throw new Error(`Decision config missing: ${marker}`);
}
if (!decisionEngines.includes("function calculateTool(")) throw new Error("Decision engine layer is missing calculateTool().");

if (!/name\s*=\s*"amarelo"/.test(wrangler)) throw new Error("Cloudflare Worker must remain named amarelo.");
if (!/main\s*=\s*"src\/worker\.js"/.test(wrangler)) throw new Error("Unexpected Worker entrypoint.");
if (!worker.includes('import { handleApi }')) throw new Error("Worker entrypoint must delegate API routing.");
if (!apiRouter.includes("/api/health") || !apiRouter.includes("/api/capabilities")) throw new Error("API router is missing core endpoints.");
if (!productConfig.includes('defaultPhase: "beta"') || !productConfig.includes("AUTH_ENABLED") || !productConfig.includes("BILLING_ENABLED")) throw new Error("Product capability flags are incomplete.");
if (!decisionsRepo.includes("upsertDecisionWithVersion")) throw new Error("Decision repository is missing version persistence.");
if (!decisionsRepo.includes("deleteDecisionVersion")) throw new Error("Decision version deletion contract is missing.");
if (!decisionsRepo.includes("if (!existing) decisionId = null")) throw new Error("Decision upsert must reject foreign client IDs.");
if (!profilesRepo.includes("upsertProfile")) throw new Error("Profile repository is missing.");
if (!workspacesRepo.includes("createPersonalWorkspace")) throw new Error("Workspace repository is missing.");
if (!goalsRepo.includes("upsertGoal")) throw new Error("Goals repository is missing.");
if (!goalsRepo.includes("if (!owned) id = null")) throw new Error("Goal upsert must reject foreign client IDs.");
if (!subscriptionsRepo.includes("getEntitlements") || !subscriptionsRepo.includes("proBeta")) throw new Error("Entitlement repository is missing beta/commercial gating.");
if (!authSession.includes("authenticatedUserId")) throw new Error("Session guard is missing.");
if (!privateApi.includes("/api/v1/decisions") || !privateApi.includes("/api/v1/entitlements")) throw new Error("Private API contract is incomplete.");
if (!security.includes("X-Content-Type-Options")) throw new Error("Security header middleware is missing.");

for (const marker of ["users", "sessions", "decisions", "subscriptions"]) {
  if (!migration1.includes(marker)) throw new Error(`Initial D1 schema missing: ${marker}`);
}
for (const marker of ["decision_versions", "workspaces", "workspace_members", "financial_profiles", "clients"]) {
  if (!migration2.includes(marker)) throw new Error(`Commercial D1 schema missing: ${marker}`);
}
if (!migration3.includes("client_version_id")) throw new Error("Sync safety migration is missing client_version_id.");
if (!migration4.includes("client_goal_id")) throw new Error("Goal sync migration is missing client_goal_id.");
if (!decisionHistory.includes("decisionDocumentId") || !decisionHistory.includes("versionTimeline")) throw new Error("Decision timeline/report identity is incomplete.");

if (frontend.includes("setDemoPlan('family')") || frontend.includes("setDemoPlan('professional')")) {
  throw new Error("Unbuilt paid tiers must not be activatable.");
}

for (const forbidden of ["azul-planejamento", "verde-market", "dourado"]) {
  if (runtimeSurface.includes(forbidden)) throw new Error(`Cross-project runtime reference detected: ${forbidden}`);
}

console.log(`AMARELO 1.0 architecture verification passed: ${ids.length} tools, modular frontend, modular Worker, isolated project.`);
