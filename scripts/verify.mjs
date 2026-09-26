import { readFileSync } from "node:fs";

const html = readFileSync("public/index.html", "utf8");
const app = readFileSync("public/assets/app.js", "utf8");
const styles = readFileSync("public/assets/styles.css", "utf8");
const wrangler = readFileSync("wrangler.toml", "utf8");
const worker = readFileSync("src/worker.js", "utf8");
const api = readFileSync("src/api.js", "utf8");
const security = readFileSync("src/lib/security.js", "utf8");
const cloud = readFileSync("public/assets/cloud.js", "utf8");
const catalog = readFileSync("public/assets/catalog.js", "utf8");
const intentCore = readFileSync("public/assets/intent-core.js", "utf8");
const financeCore = readFileSync("public/assets/finance-core.js", "utf8");
const telemetry = readFileSync("public/assets/telemetry.js", "utf8");
const accessibility = readFileSync("public/assets/accessibility.css", "utf8");
const accountStyles = readFileSync("public/assets/account.css", "utf8");
const productStyles = readFileSync("public/assets/product.css", "utf8");
const commercialMigration = readFileSync("migrations/0002_commercial_readiness.sql", "utf8");
const cloudMigration = readFileSync("migrations/0003_cloud_core.sql", "utf8");
const observabilityMigration = readFileSync("migrations/0004_observability.sql", "utf8");
const surface = [html, app, styles, accountStyles, productStyles, accessibility, cloud, catalog, intentCore, financeCore, telemetry].join("\n");

const required = [
  "<title>AMARELO",
  "Antes de decidir",
  "AMARELO PRO",
  "Pergunte ao AMARELO",
  "AMARELO V9",
  "Premissas usadas nesta conta",
  "function openSavedDecision",
  "function calculateTool()",
  "function loanFlow",
  "finSystem",
  "loanSystem",
  "propertyTax",
  "acumulação + fase de renda",
  "AMARELO V11",
  "decisionCockpit",
  "dashboardSignal",
  "toolWorkspaceMeta",
  "productSignature",
  "scenarioLab",
  "function compareScenarios",
  "function duplicateScenario",
  "function renderScenarioCompare",
  "function decisionDrivers",
  "function interpretAsk",
  "function openVersionCompare",
  "LABORATÓRIO DE CENÁRIOS",
  "portabilidade-divida",
  "trocar-carro",
  "debtPortability",
  "carDecision",
  "Portabilidade de Dívida",
  "Trocar de Carro x Manter o Atual",
  "decisionNameInput",
  "RELATÓRIO AMARELO",
  "function openDecisionReport",
  "function groupSavedDecisions",
  "function currentDecisionName",
  "reportContent",
  "decisionIdentity",
  "imovel-na-planta",
  "bonus-decidir",
  "independencia-financeira",
  "offPlan",
  "windfallDecision",
  "financialIndependence",
  "Correção anual estimada da obra",
  "13º / Bônus: Dívida x Investir x Reserva",
  "Mapa de Independência Financeira",
  "windDebtSystem",
  "não sustenta preservação",
  "useExtra?lump:0",
  "comparar-financiamentos",
  "loanCompare",
  "fixedIncomeProduct",
  "fiAType",
  "decisionPulse",
  "reviewQueue",
  "reportSensitivity",
  "Desde a última versão",
  "SEM COBRANÇA NESTA FASE",
  "PRO PREVIEW",
  "Preço-alvo no lançamento",
  "EM DESENVOLVIMENTO",
  "function showFuturePlan",
  "pricingToolCount",
  "route-account",
  "cloudDashboardBanner",
  "accountSyncButton",
  "Conta e sincronização",
  "decisionLaunchpad",
  "Você não precisa saber o nome da calculadora."
];

for (const marker of required) {
  if (!surface.includes(marker)) throw new Error(`Missing required marker: ${marker}`);
}

const toolsBlock = catalog.match(/const tools=\[([\s\S]*?)\];/);
if (!toolsBlock) throw new Error("Could not isolate the financial tools catalog.");
const ids = [...toolsBlock[1].matchAll(/\{id:'([^']+)'/g)].map(m => m[1]);
if (ids.length < 30) throw new Error(`Expected at least 30 financial tools, found ${ids.length}.`);
if (new Set(ids).size !== ids.length) throw new Error("Duplicate tool ids found inside the tools catalog.");

for (const id of [
  "financiamento-consorcio",
  "comprar-alugar",
  "amortizar-investir",
  "renda-fixa",
  "gross-up",
  "aposentadoria",
  "salario-liquido",
  "portabilidade-divida",
  "trocar-carro",
  "imovel-na-planta",
  "bonus-decidir",
  "independencia-financeira",
  "comparar-financiamentos"
]) {
  if (!ids.includes(id)) throw new Error(`Missing priority decision engine: ${id}`);
}

new Function(catalog);
new Function(intentCore);
new Function(financeCore);
new Function(app);
new Function(cloud);
new Function(telemetry);

if (/<style>[\s\S]*<\/style>/.test(html)) {
  throw new Error("Public shell must not contain the application stylesheet inline.");
}
if (/<script>[\s\S]*<\/script>/.test(html)) {
  throw new Error("Public shell must not contain the application runtime inline.");
}
if (!html.includes("/assets/styles.css") || !html.includes("/assets/app.js") || !html.includes("/assets/cloud.js") || !html.includes("/assets/account.css") || !html.includes("/assets/product.css") || !html.includes("/assets/accessibility.css") || !html.includes("/assets/catalog.js") || !html.includes("/assets/intent-core.js") || !html.includes("/assets/finance-core.js") || !html.includes("/assets/telemetry.js")) {
  throw new Error("Modular public assets are not wired.");
}
if (!intentCore.includes("detectAskTool") || !intentCore.includes("parseMoneyBR") || !app.includes("AmareloIntent")) {
  throw new Error("Tested intent core is not wired.");
}
if (!accessibility.includes("prefers-reduced-motion") || !html.includes("skipLink") || !html.includes('aria-live="polite"')) {
  throw new Error("Accessibility baseline is incomplete.");
}
if (!financeCore.includes("loanFlow") || !financeCore.includes("fixedIncomeProduct") || !app.includes("AmareloFinance")) {
  throw new Error("Production finance core is not wired.");
}
if (!styles.includes("AMARELO 1.0 — legibility + visual hierarchy baseline")) {
  throw new Error("AMARELO 1.0 legibility baseline is missing.");
}

if (!/name\s*=\s*"amarelo"/.test(wrangler)) throw new Error("Cloudflare Worker must remain named amarelo.");
if (!/main\s*=\s*"src\/worker\.js"/.test(wrangler)) throw new Error("Unexpected Worker entrypoint.");
if (!worker.includes("handleApi")) throw new Error("Worker API router is missing.");
for (const marker of ["/api/health","/api/capabilities","/api/version","/api/auth/register","/api/auth/login","/api/auth/logout","/api/me","/api/sync","/api/telemetry"]) {
  if (!api.includes(marker)) throw new Error(`Cloud API missing: ${marker}`);
}
for (const marker of ["PBKDF2","210000","HttpOnly","SameSite=Lax"]) {
  if (!security.includes(marker)) throw new Error(`Security primitive missing: ${marker}`);
}

for (const marker of ["decision_versions","workspaces","workspace_members","financial_profiles","clients"]) {
  if (!commercialMigration.includes(marker)) throw new Error(`Commercial D1 migration missing: ${marker}`);
}
if (!cloudMigration.includes("auth_rate_limits")) throw new Error("Cloud core migration is missing auth rate limiting.");
if (!observabilityMigration.includes("product_events")) throw new Error("Observability migration is missing product events.");
if (!telemetry.includes("ALLOWED") || telemetry.includes("askText") || telemetry.includes("assumptions")) {
  throw new Error("Telemetry must remain whitelisted and free of sensitive financial inputs.");
}
if (app.includes("setDemoPlan('family')") || app.includes("setDemoPlan('professional')")) {
  throw new Error("Unbuilt paid tiers must not be activatable.");
}

const productionSurface = [html, app, styles, accountStyles, productStyles, accessibility, cloud, catalog, intentCore, financeCore, telemetry, wrangler, worker, api, security].join("\n").toLowerCase();
for (const forbidden of ["azul-planejamento", "verde-market", "dourado"]) {
  if (productionSurface.includes(forbidden)) throw new Error(`Cross-project reference detected: ${forbidden}`);
}

console.log(`AMARELO verification passed: ${ids.length} catalog tools, tested finance + intent cores, cloud account, privacy-safe telemetry and accessibility baseline.`);
