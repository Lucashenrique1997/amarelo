import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = readFileSync("public/assets/sync-service.js", "utf8");

const context = {
  console,
  Date,
  runtimeCapabilities: { persistence:false, authentication:false },
  storage: {
    values:new Map(),
    get(key,fallback){return this.values.has(key)?this.values.get(key):fallback},
    set(key,value){this.values.set(key,value);return value}
  },
  saved:()=>[],
  groupSavedDecisions:()=>[],
  savedDecisionKey:item=>item.decisionKey || (item.toolId+"::"+item.decisionName),
  makeDecisionKey:(toolId,name)=>toolId+"::"+String(name).toLowerCase().replace(/\s+/g,"-"),
  amareloApi:{}
};
vm.createContext(context);
vm.runInContext(
  source+"\n;globalThis.__SYNC__={parseStoredJson,stableLocalNumericId,localProfileToApi,apiProfileToLocal,localVersionPayload,remoteVersionToLocal,syncAccountIfAvailable};",
  context
);

const s=context.__SYNC__;
assert.equal(s.stableLocalNumericId("abc"),s.stableLocalNumericId("abc"));
assert.notEqual(s.stableLocalNumericId("abc"),s.stableLocalNumericId("abd"));

const localVersion={
  id:123,
  toolId:"comprar-alugar",
  title:"Comprar x Alugar",
  decisionName:"Casa",
  decisionKey:"comprar-alugar::casa",
  date:"2026-09-01T12:00:00.000Z",
  assumptions:{asset:"700000"},
  primary:"Comprar",
  subtitle:"Resultado teste",
  metrics:[["Comprar","R$ 1"]],
  sensitivity:[["Taxa","R$ 2"]],
  mode:"advanced"
};
const payload=s.localVersionPayload(localVersion);
assert.equal(payload.clientVersionId,"123");
assert.equal(payload.clientCreatedAt,localVersion.date);
assert.equal(payload.decisionKey,localVersion.decisionKey);
assert.equal(payload.outputs.mode,"advanced");

const remote=s.remoteVersionToLocal(
  {
    id:"decision-1",
    tool_id:"comprar-alugar",
    title:"Comprar x Alugar",
    decision_name:"Casa",
    decision_key:"comprar-alugar::casa",
    primary_result:"Comprar",
    summary:"Resumo",
    updated_at:"2026-09-02T00:00:00Z"
  },
  {
    id:"version-1",
    client_version_id:"123",
    version_number:2,
    scenario_label:"Base",
    outputs_json:JSON.stringify({metrics:[["Comprar","R$ 10"]],mode:"advanced"}),
    sensitivity_json:JSON.stringify([["Taxa","R$ 9"]]),
    assumptions_json:JSON.stringify({asset:"700000"}),
    primary_result:"Comprar",
    summary:"Resumo remoto",
    created_at:"2026-09-01T12:00:00.000Z"
  }
);
assert.equal(remote.clientVersionId,"123");
assert.equal(remote.remoteDecisionId,"decision-1");
assert.equal(remote.remoteVersionId,"version-1");
assert.equal(remote.version,2);
assert.equal(remote.mode,"advanced");
assert.deepEqual(remote.metrics,[["Comprar","R$ 10"]]);

const profile=s.localProfileToApi({income:10000,wealth:250000,essentials:5000,reserve:30000,monthly:2000});
assert.equal(profile.monthlyIncome,10000);
assert.equal(profile.financialWealth,250000);

const inactive=await s.syncAccountIfAvailable();
assert.deepEqual(inactive,{active:false});

console.log("AMARELO synchronization contract tests passed.");
