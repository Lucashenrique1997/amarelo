import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");

const required = [
  "<title>AMARELO",
  "Antes de decidir",
  "AMARELO PRO",
  "Pergunte ao AMARELO"
];

for (const marker of required) {
  if (!html.includes(marker)) {
    throw new Error(`Missing required marker: ${marker}`);
  }
}

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) throw new Error("No inline application script found.");

for (const code of scripts) {
  new Function(code);
}

console.log("AMARELO static verification passed.");
