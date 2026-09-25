/* AMARELO 1.0 — local cache <-> authenticated account sync
 *
 * This service remains dormant while /api/capabilities reports persistence/authentication=false.
 * Versions are append-only and clientVersionId makes migration idempotent.
 */
function parseStoredJson(value,fallback){
  if(value===null||value===undefined)return fallback;
  if(typeof value!=='string')return value;
  try{return JSON.parse(value)}catch{return fallback}
}
function stableLocalNumericId(value){
  let hash=2166136261;
  for(const ch of String(value||'')){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}
  return (hash>>>0)||1;
}
function localProfileToApi(p){
  return {
    displayName:p?.displayName||p?.name||null,
    birthDate:p?.birthDate||null,
    monthlyIncome:Number(p?.income||0)||null,
    financialWealth:Number(p?.wealth||0)||null,
    essentialExpenses:Number(p?.essentials||0)||null,
    emergencyReserve:Number(p?.reserve||0)||null,
    monthlyInvestment:Number(p?.monthly||0)||null
  };
}
function apiProfileToLocal(p){
  if(!p)return null;
  const age=p.birth_date?Math.max(0,new Date().getFullYear()-new Date(p.birth_date).getFullYear()):0;
  return {
    income:Number(p.monthly_income||0),
    wealth:Number(p.financial_wealth||0),
    essentials:Number(p.essential_expenses||0),
    reserve:Number(p.emergency_reserve||0),
    monthly:Number(p.monthly_investment||0),
    age,
    displayName:p.display_name||'',
    birthDate:p.birth_date||''
  };
}
function localVersionPayload(v){
  const date=new Date(v.date||Date.now());
  const review=new Date(date.getTime()+45*86400000).toISOString();
  return {
    toolId:v.toolId,
    decisionKey:savedDecisionKey(v),
    decisionName:v.decisionName||v.title,
    title:v.title,
    status:'active',
    scenarioLabel:v.scenarioLabel||null,
    clientVersionId:String(v.id),
    clientCreatedAt:v.date||new Date().toISOString(),
    inputs:v.assumptions||{},
    outputs:{
      primary:v.primary||'',
      subtitle:v.subtitle||'',
      metrics:v.metrics||[],
      mode:v.mode||'simple',
      scenarioState:v.scenarioState||null
    },
    assumptions:v.assumptions||{},
    sensitivity:v.sensitivity||[],
    primaryResult:v.primary||null,
    summary:v.subtitle||null,
    reviewDueAt:review
  };
}
function remoteVersionToLocal(decision,version){
  const outputs=parseStoredJson(version.outputs_json,{});
  return {
    id:stableLocalNumericId(version.id),
    remoteVersionId:version.id,
    remoteDecisionId:decision.id,
    clientVersionId:version.client_version_id||null,
    toolId:decision.tool_id,
    title:decision.title,
    decisionName:decision.decision_name||decision.title,
    decisionKey:decision.decision_key||makeDecisionKey(decision.tool_id,decision.decision_name||decision.title),
    version:Number(version.version_number)||1,
    scenarioLabel:version.scenario_label||null,
    primary:version.primary_result||outputs.primary||decision.primary_result||'',
    subtitle:version.summary||outputs.subtitle||decision.summary||'',
    metrics:Array.isArray(outputs.metrics)?outputs.metrics:[],
    sensitivity:parseStoredJson(version.sensitivity_json,[]),
    assumptions:parseStoredJson(version.assumptions_json,{}),
    scenarioState:outputs.scenarioState||null,
    mode:outputs.mode||'simple',
    date:version.created_at||decision.updated_at||new Date().toISOString()
  };
}
async function pushLocalProfile(){
  const local=storage.get('amarelo_profile',null);
  if(!local)return;
  await amareloApi.updateProfile(localProfileToApi(local));
}
async function pushLocalDecisions(){
  const local=saved();
  const groups=groupSavedDecisions(local);
  const remote=await amareloApi.decisions();
  const remoteByKey=new Map((remote.decisions||[]).map(x=>[x.decision_key,x]));

  for(const group of groups){
    const versions=[...group.versions].sort((a,b)=>new Date(a.date)-new Date(b.date));
    let remoteDecision=remoteByKey.get(group.key)||null;
    let remoteId=remoteDecision?.id||null;

    for(const version of versions){
      const payload={...localVersionPayload(version),...(remoteId?{decisionId:remoteId}:{})};
      const response=await amareloApi.saveDecision(payload);
      remoteId=response.decisionId;
      const map=storage.get('amarelo_remote_decisions',{});
      map[group.key]=remoteId;
      storage.set('amarelo_remote_decisions',map);
    }
  }
}
async function hydrateRemoteDecisions(){
  const response=await amareloApi.decisions();
  const remoteDecisions=response.decisions||[];
  const remoteVersions=[];

  for(const decision of remoteDecisions){
    const responseVersions=await amareloApi.decisionVersions(decision.id);
    for(const version of responseVersions.versions||[]){
      remoteVersions.push(remoteVersionToLocal(decision,version));
    }
  }

  const local=saved();
  const merged=new Map();
  for(const item of local){
    const key='client:'+String(item.clientVersionId||item.id);
    merged.set(key,item);
  }
  for(const item of remoteVersions){
    const key=item.clientVersionId?'client:'+String(item.clientVersionId):'remote:'+String(item.remoteVersionId);
    merged.set(key,item);
  }
  const values=[...merged.values()].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,500);
  storage.set('amarelo_decisions',values);
}
async function hydrateRemoteProfile(){
  const response=await amareloApi.profile();
  const remote=apiProfileToLocal(response.profile);
  if(remote)storage.set('amarelo_profile',remote);
}
async function hydrateEntitlements(){
  const response=await amareloApi.entitlements();
  const plan=response.entitlements?.plan==='pro'?'pro':'free';
  state.plan=plan;
  storage.set('amarelo_plan',plan);
  return response.entitlements;
}
async function syncAccountIfAvailable(){
  if(!(runtimeCapabilities.persistence&&runtimeCapabilities.authentication))return {active:false};

  const migrated=storage.get('amarelo_cloud_migration_v1',false);
  try{
    if(!migrated){
      await pushLocalProfile();
      await pushLocalDecisions();
      storage.set('amarelo_cloud_migration_v1',true);
    }
    await Promise.all([hydrateRemoteProfile(),hydrateRemoteDecisions(),hydrateEntitlements()]);
    window.dispatchEvent(new CustomEvent('amarelo:sync-complete'));
    return {active:true,ok:true};
  }catch(error){
    if(error?.status===401){
      storage.set('amarelo_cloud_migration_v1',false);
      return {active:true,ok:false,authenticationRequired:true};
    }
    console.warn('AMARELO sync unavailable',String(error?.message||error));
    return {active:true,ok:false};
  }
}

async function syncDecisionVersionIfAvailable(version){
  if(!(runtimeCapabilities.persistence&&runtimeCapabilities.authentication))return null;
  try{
    const key=savedDecisionKey(version);
    const map=storage.get('amarelo_remote_decisions',{});
    const payload={...localVersionPayload(version),...(map[key]?{decisionId:map[key]}:{})};
    const response=await amareloApi.saveDecision(payload);
    map[key]=response.decisionId;
    storage.set('amarelo_remote_decisions',map);
    return response;
  }catch(error){
    console.warn('AMARELO decision sync failed',String(error?.message||error));
    return null;
  }
}
async function syncProfileIfAvailable(profile){
  if(!(runtimeCapabilities.persistence&&runtimeCapabilities.authentication))return null;
  try{return await amareloApi.updateProfile(localProfileToApi(profile))}
  catch(error){console.warn('AMARELO profile sync failed',String(error?.message||error));return null}
}
