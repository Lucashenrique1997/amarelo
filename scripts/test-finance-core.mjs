import assert from "node:assert/strict";
import "../public/assets/finance-core.js";

const F = globalThis.AmareloFinance;
const near = (actual, expected, tolerance = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} ≈ ${expected}`);
};

near(F.monthly(Math.pow(1.01,12)-1), 0.01, 1e-12);
assert.equal(F.irDays(180), 0.225);
assert.equal(F.irDays(181), 0.20);
assert.equal(F.irDays(361), 0.175);
assert.equal(F.irDays(721), 0.15);

near(F.loanPay(100000, 0, 10), 10000);
near(F.loanPay(100000, 0.01, 12), 8884.87886783416, 1e-8);

const price = F.loanFlow(100000, 0.01, 12, "price");
near(price.first, 8884.87886783416, 1e-8);
near(price.last, 8884.87886783416, 1e-8);
near(price.total, 106618.54641400992, 1e-6);
assert.ok(price.endingBalance < 1e-7);

const sac = F.loanFlow(100000, 0.01, 12, "sac");
near(sac.first, 9333.333333333334, 1e-8);
near(sac.last, 8416.666666666666, 1e-8);
near(sac.interest, 6500, 1e-8);

near(F.fv(10000, 0, 0.10, 12), 11000, 1e-8);
near(F.fv(0, 1000, Math.pow(1.01,12)-1, 12), 12682.503013196972, 1e-8);

const pv = F.pvFlows([1000,1000,1000], Math.pow(1.01,12)-1);
near(pv, 1000/1.01 + 1000/Math.pow(1.01,2) + 1000/Math.pow(1.01,3), 1e-8);

const exempt = F.fixedIncomeProduct("LCI","cdi-exempt",100,0,0,10000,0,12,0.10,0.04);
assert.equal(exempt.tax, 0);
assert.equal(exempt.eligible, true);
assert.ok(exempt.net > exempt.invested);

const taxed = F.fixedIncomeProduct("CDB","cdi-taxed",100,0,0,10000,0,12,0.10,0.04);
assert.ok(taxed.tax > 0);
assert.ok(taxed.net < taxed.gross);

near(F.solveRate(r => 100 * (1+r), 110, -0.5, 1), 0.10, 1e-10);

console.log("Finance core vectors passed.");
