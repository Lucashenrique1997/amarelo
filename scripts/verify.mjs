import { readFileSync, statSync } from "node:fs";

const read = path => readFileSync(path, "utf8");

const html = read("public/index.html");
const rootHtml = read("index.html");
const css = read("public/assets/app.css");
const catalog = read("public/assets/catalog.js");
const financeCore = read("public/assets/finance-core.js");
const decisionConfig = read("public/assets/decision-config.js");
const decisionEngines = read("public/assets/decision-engines.js");
const app = read("public/assets/app.js");
const wrangler = read("wrangler.toml");
const worker = read("src/worker.js");
const apiRouter = read("src/api/router.js");
const apiHealth = read("src/api/health.js");
const productConfig = read("src/config/product.js");
const migration1 = read("migrations/0001_initial.sql");
const migration2 = read("migrations/0002_commercial_readiness.sql");

const frontend = [html, css, catalog, financeCore, decisionConfig, decisionEngines, app].join("\n");
const backend = [worker, apiRouter, apiHealth, productConfig, wrangler, migration1, migration2].join("\n");
const productionSurface = (frontend + "\n" + backend).toLowerCase();

if (html !== rootHtml) throw new Error("Root preview and public application shell are out of sync.");
if (/<style[\s>]/i.test(html)) throw new Error("Application shell must not contain inline CSS.");
if (/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i.test(html)) throw new Error("Application shell must not contain inline JavaScript.");

const requiredAssets = [
  "/assets/app.css",
  "/assets/catalog.js",
  "/assets/finance-core.js",
  "/assets/decision-config.js",
  "/assets/decision-engines.js",
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
  ["decision-engines.js", decisionEngines],
  ["app.js", app]
]) {
  try {
    new Function(code);
  } catch (error) {
    throw new Error(`${name} does not parse: ${error.message}`);
  }
}

if (app.length > 90000) throw new Error(`app.js grew too large (${app.length} bytes). Split responsibilities before merging.`);
if (html.length > 40000) throw new Error(`index.html grew too large (${html.length} bytes). Keep it as an application shell.`);
if (app.includes("const tools=[")) throw new Error("Tools catalog leaked back into app.js.");
if (app.includes("function loanFlow(")) throw new Error("Financial core leaked back into app.js.");
if (app.includes("function buildForm(")) throw new Error("Decision config leaked back into app.js.");
if (app.includes("function calculateTool(")) throw new Error("Decision engine execution leaked back into app.js.");

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
if (!productConfig.includes('phase: "beta"')) throw new Error("Product capability phase must remain explicit.");

for (const marker of ["users", "sessions", "decisions", "subscriptions"]) {
  if (!migration1.includes(marker)) throw new Error(`Initial D1 schema missing: ${marker}`);
}
for (const marker of ["decision_versions", "workspaces", "workspace_members", "financial_profiles", "clients"]) {
  if (!migration2.includes(marker)) throw new Error(`Commercial D1 schema missing: ${marker}`);
}

if (frontend.includes("setDemoPlan('family')") || frontend.includes("setDemoPlan('professional')")) {
  throw new Error("Unbuilt paid tiers must not be activatable.");
}

for (const forbidden of ["azul-planejamento", "verde-market", "dourado"]) {
  if (productionSurface.includes(forbidden)) throw new Error(`Cross-project reference detected: ${forbidden}`);
}

console.log(`AMARELO 1.0 architecture verification passed: ${ids.length} tools, modular frontend, modular Worker, isolated project.`);
