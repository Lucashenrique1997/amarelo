import { readFileSync, existsSync } from "node:fs";

const html = readFileSync("public/index.html", "utf8");\nconst app = readFileSync("public/assets/app.js", "utf8");\nconst styles = readFileSync("public/assets/styles.css", "utf8");\nconst surface = [html, app, styles].join("\\n");
const wrangler = readFileSync("wrangler.toml", "utf8");
const worker = readFileSync("src/worker.js", "utf8");
const commercialMigration = readFileSync("migrations/0002_commercial_readiness.sql", "utf8");

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
  "pricingToolCount"
];

for (const marker of required) {
  if (!surface.includes(marker)) throw new Error(`Missing required marker: ${marker}`);
}

const toolsBlock = app.match(/const tools=\[([\s\S]*?)\];\s*const deepIds/);
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

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) throw new Error("No inline application script found.");
for (const code of scripts) new Function(code);

if (!/name\s*=\s*"amarelo"/.test(wrangler)) throw new Error("Cloudflare Worker must remain named amarelo.");
if (!/main\s*=\s*"src\/worker\.js"/.test(wrangler)) throw new Error("Unexpected Worker entrypoint.");
if (!worker.includes("/api/health")) throw new Error("Health endpoint is missing.");
if (!worker.includes("/api/capabilities")) throw new Error("Capabilities endpoint is missing.");
for (const marker of ["decision_versions","workspaces","workspace_members","financial_profiles","clients"]) {
  if (!commercialMigration.includes(marker)) throw new Error(`Commercial D1 migration missing: ${marker}`);
}
if (html.includes("setDemoPlan('family')") || html.includes("setDemoPlan('professional')")) {
  throw new Error("Unbuilt paid tiers must not be activatable.");
}

const productionSurface = [html, app, styles, wrangler, worker].join("\n").toLowerCase();
for (const forbidden of ["azul-planejamento", "verde-market", "dourado"]) {
  if (productionSurface.includes(forbidden)) throw new Error(`Cross-project reference detected: ${forbidden}`);
}

console.log(`AMARELO verification passed: ${ids.length} tools, modular public shell, 1.0 legibility baseline, beta gates and isolated Worker.`);
