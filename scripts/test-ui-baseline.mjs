import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css=readFileSync("public/assets/ui-system.css","utf8");
const html=readFileSync("public/index.html","utf8");
const app=readFileSync("public/assets/app.js","utf8");

assert.ok(css.includes("visual organization v2"));
assert.match(css,/\.topbar \.navitem\{[\s\S]*font-size:var\(--ui-nav\)/);
assert.match(css,/--ui-nav:16px/);
assert.match(css,/--ui-tab:14px/);
assert.match(css,/\.modeToggle button\{[\s\S]*font-size:14px!important/);
assert.match(css,/\.scenarioTab small\{font-size:11px!important/);
assert.match(css,/\.scenarioTab b\{font-size:15px!important/);
assert.match(css,/\.mobileNav button b\{font-size:12px!important/);
assert.match(css,/\.toolCard h3\{font-size:19px!important/);
assert.match(css,/\.toolCard p\{font-size:14px!important/);

const baseIndex=html.indexOf("/assets/styles.css");
const uiIndex=html.indexOf("/assets/ui-system.css");
assert.ok(baseIndex >= 0 && uiIndex > baseIndex, "ui-system.css must load after the base stylesheet");

for(const marker of ["categoryOrder","categoryDescriptions","libraryGroup","sortedTools"]){
  assert.ok(app.includes(marker),`Missing organized-library marker: ${marker}`);
}

assert.equal(html.includes('class="shell homeManifesto"'),false,"Duplicated manifesto should not remain on the home page");
assert.equal(html.includes('id="featured"'),false,"Duplicated featured grid should not remain on the home page");

console.log("UI readability and organization baseline passed.");
