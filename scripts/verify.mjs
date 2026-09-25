import { readFileSync, existsSync } from "node:fs";

const html = readFileSync("public/index.html", "utf8");
const wrangler = readFileSync("wrangler.toml", "utf8");
const worker = readFileSync("src/worker.js", "utf8");

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
  "acumulação + fase de renda"
];

for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Missing required marker: ${marker}`);
}

const ids = [...html.matchAll(/\{id:'([^']+)'/g)].map(m => m[1]);
if (ids.length < 30) throw new Error(`Expected at least 30 financial tools, found ${ids.length}.`);
if (new Set(ids).size !== ids.length) throw new Error("Duplicate tool ids found.");

for (const id of [
  "financiamento-consorcio",
  "comprar-alugar",
  "amortizar-investir",
  "renda-fixa",
  "gross-up",
  "aposentadoria",
  "salario-liquido"
]) {
  if (!ids.includes(id)) throw new Error(`Missing priority decision engine: ${id}`);
}

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) throw new Error("No inline application script found.");
for (const code of scripts) new Function(code);

if (!/name\s*=\s*"amarelo"/.test(wrangler)) throw new Error("Cloudflare Worker must remain named amarelo.");
if (!/main\s*=\s*"src\/worker\.js"/.test(wrangler)) throw new Error("Unexpected Worker entrypoint.");
if (!worker.includes("/api/health")) throw new Error("Health endpoint is missing.");

const productionSurface = [html, wrangler, worker].join("\n").toLowerCase();
for (const forbidden of ["azul-planejamento", "verde-market", "dourado"]) {
  if (productionSurface.includes(forbidden)) throw new Error(`Cross-project reference detected: ${forbidden}`);
}

console.log(`AMARELO verification passed: ${ids.length} tools, V9 UI, isolated Worker.`);
