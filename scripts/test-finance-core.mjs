import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = readFileSync("public/assets/finance-core.js", "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(source + "\n;globalThis.__AMARELO_CORE__={BRL,PCT,monthly,irDays,loanPay,loanBalance,loanFlow,pvFlows,fv,taxLots,fixedIncomeProduct,fixedIncomeTypeLabel,solveRate};", context);

const {
  monthly, irDays, loanPay, loanFlow, pvFlows, fv, fixedIncomeProduct
} = context.__AMARELO_CORE__;

const approx = (actual, expected, tolerance = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} ≈ ${expected}`);
};

approx(loanPay(120000, 0, 12), 10000);
approx(fv(100000, 1000, 0, 12), 112000);
approx(pvFlows([1000, 1000, 1000], 0), 3000);

assert.equal(irDays(180), 0.225);
assert.equal(irDays(181), 0.20);
assert.equal(irDays(360), 0.20);
assert.equal(irDays(361), 0.175);
assert.equal(irDays(720), 0.175);
assert.equal(irDays(721), 0.15);

const price = loanFlow(300000, 0.01, 120, "price", 0);
assert.equal(price.flows.length, 120);
approx(price.first, price.last, 0.01);
assert.ok(price.total > 300000);
assert.ok(price.interest > 0);

const sac = loanFlow(300000, 0.01, 120, "sac", 0);
assert.equal(sac.flows.length, 120);
assert.ok(sac.first > sac.last);
assert.ok(sac.total > 300000);

const exempt = fixedIncomeProduct(
  "LCI teste", "cdi-exempt", 90, 0, 0, 100000, 0, 24, 0.12, 0.045
);
assert.equal(exempt.tax, 0);
assert.ok(exempt.net > exempt.invested);

const taxed = fixedIncomeProduct(
  "CDB teste", "cdi-taxed", 110, 0, 0, 100000, 0, 24, 0.12, 0.045
);
assert.ok(taxed.tax > 0);
assert.ok(taxed.net < taxed.gross);
assert.ok(taxed.net > taxed.invested);

const m = monthly(0.12);
assert.ok(m > 0 && m < 0.12);

console.log("AMARELO finance-core tests passed.");
