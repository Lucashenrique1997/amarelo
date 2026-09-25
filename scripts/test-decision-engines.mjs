import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const core = readFileSync("public/assets/finance-core.js", "utf8");
const engines = readFileSync("public/assets/decision-engines.js", "utf8");

const context = { console };
vm.createContext(context);

context.__inputs = {};
context.__result = null;
context.state = { current: { engine: "" }, scenario: null, scenarioBusy: false };
context.persistActiveScenario = () => {};
context.toast = message => { throw new Error(String(message)); };
context.$ = id => ({ value: String(context.__inputs[id] ?? 0) });
context.num = id => Number.parseFloat(context.__inputs[id] ?? 0) || 0;
context.setResult = (primary, subtitle, metrics = [], insight = "", be = null, sens = null, series = null, label = "") => {
  context.__result = { primary, subtitle, metrics, insight, be, sens, series, label };
};

vm.runInContext(core, context);
vm.runInContext(engines + "\n;globalThis.__calculateTool=calculateTool;", context);

function run(engine, inputs) {
  context.state.current = { engine };
  context.state.scenario = null;
  context.state.scenarioBusy = false;
  context.__inputs = inputs;
  context.__result = null;
  context.__calculateTool();
  assert.ok(context.__result, `${engine} did not produce a result`);
  const serialized = JSON.stringify(context.__result);
  assert.ok(!/NaN|Infinity|undefined/.test(serialized), `${engine} produced invalid numeric output: ${serialized}`);
  assert.ok(String(context.__result.primary).length > 0, `${engine} primary result is empty`);
  return context.__result;
}

const buyPaths = run("buyPaths", {
  asset:600000,cash:150000,finSystem:"price",finM:.85,finN:360,cetAdd:2,finExtra:0,
  adm:18,consN:180,cont:24,bid:0,reserveFee:2,reaj:4,rent:2500,inv:8,assetApp:4,monthlySave:3000
});
assert.match(buyPaths.primary,/Compare custo/);
assert.ok(buyPaths.metrics.length >= 6);

const buyRent = run("buyRent", {
  asset:700000,down:200000,closing:5,maintenance:1,propertyTax:.6,saleCost:5,app:5,
  buySystem:"price",finM:.8,finN:360,ownerExtra:0,rent:3500,rentGrow:4,inv:8,years:10
});
assert.ok(buyRent.metrics.some(m=>m[0]==="Comprar"));
assert.ok(buyRent.metrics.some(m=>m[0]==="Alugar + investir"));

const loanCompare = run("loanCompare", {
  cmpPrice:700000,cmpDown:200000,cmpHorizon:60,cmpDiscount:8,
  cmpASystem:"sac",cmpARate:.8,cmpAN:360,cmpAUpfront:12000,cmpAMonthly:250,
  cmpBSystem:"price",cmpBRate:.74,cmpBN:420,cmpBUpfront:20000,cmpBMonthly:350
});
assert.match(loanCompare.primary,/Proposta [AB]/);
assert.ok(loanCompare.metrics.some(m=>m[0]==="A · valor presente"));

const offPlan = run("offPlan", {
  offPrice:650000,offEntry:100000,offMonths:36,offMonthly:3500,offBalloon:50000,offIndex:5,
  offSystem:"price",offFinanceRate:.85,offFinanceN:360,offRent:3500,offRentGrow:4,offInv:8,offApp:5
});
assert.ok(offPlan.metrics.some(m=>m[0]==="Preço corrigido estimado"));
assert.ok(offPlan.series?.length >= 2);

const amortInvest = run("amortInvest", {
  balance:450000,loanSystem:"price",debtA:10,months:240,amortMode:"term",
  cash:100000,invGross:11,tax:15,fee:0
});
assert.match(amortInvest.primary,/Investir ganha espaço|Amortizar ganha espaço/);
assert.ok(amortInvest.metrics.some(m=>m[0]==="Juros evitados"));

const fixedIncome = run("fixedIncome", {
  p:100000,pmt:1000,months:24,cdi:13.65,fiInflation:4.5,
  fiAType:"cdi-taxed",fiARate:110,fiAFee:0,fiALock:0,
  fiBType:"cdi-exempt",fiBRate:92,fiBFee:0,fiBLock:90,
  fiCType:"prefix-taxed",fiCRate:12,fiCFee:.2,fiCLock:0
});
assert.match(fixedIncome.primary,/Produto [ABC]/);
assert.ok(fixedIncome.metrics.some(m=>String(m[0]).includes("líquido")));

const retirement = run("retirement", {
  age:35,ret:60,current:80000,pmt:1500,extra:0,real:4,fee:0,inflation:4.5,income:10000,endAge:85
});
assert.ok(retirement.metrics.some(m=>m[0]==="Patrimônio necessário"));
assert.ok(retirement.series?.length === 1);

const liveIncome = run("liveIncome", {
  capital:1000000,income:10000,real:4,liveFee:0,incomeMode:"consume",years:30,legacy:0,liveInflation:4.5
});
assert.ok(String(liveIncome.primary).includes("/mês"));
assert.ok(liveIncome.metrics.some(m=>m[0]==="Patrimônio necessário"));

const financialIndependence = run("financialIndependence", {
  fiExpenses:10000,fiCoverage:100,fiCurrent:300000,fiPmt:4000,fiReal:4,fiYears:15,fiExtra:0
});
assert.ok(String(financialIndependence.primary).includes("%"));
assert.ok(financialIndependence.metrics.some(m=>m[0]==="Capital-alvo"));

const debtPlan = run("debtPlan", {
  aBal:4000,aRate:12,aMin:300,bBal:10000,bRate:3,bMin:500,cBal:6000,cRate:5,cMin:300,
  extra:1000,debtLump:0,debtExtraGrow:0
});
assert.match(debtPlan.primary,/Avalanche|Bola de neve/);
assert.ok(debtPlan.metrics.some(m=>m[0]==="Só mínimos"));

const portability = run("debtPortability", {
  portBalance:120000,portCurrentSystem:"price",portCurrentRate:1.45,portCurrentN:48,portCurrentExtra:0,
  portNewSystem:"price",portNewRate:1.05,portNewN:48,portFee:1500,portNewExtra:0,portDiscount:8
});
assert.ok(portability.metrics.length >= 4);
assert.ok(portability.series?.length >= 2);

const cashInstallment = run("cashInstallment", {
  cashPrice:9000,install:800,n:12,returnM:.8,timing:"month",cashback:0
});
assert.ok(cashInstallment.metrics.length >= 2);
assert.ok(cashInstallment.be);

console.log("AMARELO priority decision-engine reference tests passed (12 engines).");
