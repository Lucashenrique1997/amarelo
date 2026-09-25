/* AMARELO 1.0 — saved decisions, versions and reports */
function captureAssumptions(){return [...document.querySelectorAll('#toolForm input,#toolForm select')].reduce((a,el)=>{a[el.id]=el.value;return a},{})}
function currentDecisionName(){let v=$('decisionNameInput')?.value?.trim();return v||state.current?.title||'Decisão'}
function normalizeDecisionPart(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function makeDecisionKey(toolId,name){return String(toolId||'')+'::'+normalizeDecisionPart(name)}
function savedDecisionKey(item){return item.decisionKey||makeDecisionKey(item.toolId,item.decisionName||item.title||item.toolId)}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]))}
function reportAssumptionRows(){return [...document.querySelectorAll('#toolForm .field')].map(w=>{let el=w.querySelector('input,select'),label=w.querySelector('label');if(!el||!label)return null;let name=[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim()||el.id;let value=el.tagName==='SELECT'?(el.options[el.selectedIndex]?.text||el.value):el.value;return[name,value]}).filter(Boolean)}
function groupSavedDecisions(items){let map=new Map();for(const item of items){let key=savedDecisionKey(item);if(!map.has(key))map.set(key,[]);map.get(key).push(item)}return [...map.entries()].map(([key,versions])=>({key,versions:versions.sort((a,b)=>new Date(b.date)-new Date(a.date))})).sort((a,b)=>new Date(b.versions[0].date)-new Date(a.versions[0].date))}
function saveDecision(){
  if(!state.last)return toast('Calcule primeiro.');
  let d=saved(),limit=state.plan==='free'?3:100;
  if(state.plan==='free'&&d.length>=limit)return toast('No Free você pode salvar até 3 decisões.');
  let decisionName=currentDecisionName(),decisionKey=makeDecisionKey(state.current.id,decisionName);
  let previous=d.filter(x=>savedDecisionKey(x)===decisionKey),version=(previous.reduce((m,x)=>Math.max(m,x.version||1),0)||0)+1;
  let scenarioState=exportScenarioState(),scenarioId=scenarioState?.active||null,scenarioLabel=scenarioId?getScenarioLabel(scenarioId):null;
  d.unshift({id:Date.now(),toolId:state.current.id,title:state.current.title,decisionName,decisionKey,version,scenarioLabel,primary:state.last.primary,subtitle:state.last.subtitle,metrics:state.last.metrics||[],sensitivity:state.last.sens||[],assumptions:captureAssumptions(),scenarioState,mode:state.mode,date:new Date().toISOString()});
  storage.set('amarelo_decisions',d.slice(0,100));
  toast((scenarioEnabled()?`Versão ${version} salva`:'Decisão salva')+' · '+decisionName);
  renderDashboard();
}
function openSavedDecision(id){
  let d=saved().find(x=>x.id===id);if(!d)return toast('Decisão não encontrada.');
  openTool(d.toolId);
  $('decisionNameInput').value=d.decisionName||d.title||'';
  let restored=false;
  if(d.scenarioState&&state.scenario)restored=restoreScenarioState(d.scenarioState);
  if(!restored&&d.assumptions){setAssumptions(d.assumptions);calculateTool()}
  if(d.mode==='advanced')setMode('advanced');
  toast(`Versão ${d.version||1} restaurada.`);
}
function deleteDecision(id){storage.set('amarelo_decisions',saved().filter(x=>x.id!==id));renderDashboard();toast('Versão removida deste navegador.')}

function decisionDocumentId(decisionKey){
  let hash=2166136261;
  for(const ch of String(decisionKey||'')){
    hash^=ch.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return 'AM-'+(hash>>>0).toString(36).toUpperCase().padStart(7,'0').slice(0,7);
}
function assumptionChangeCount(previous,current){
  const keys=new Set([...Object.keys(previous||{}),...Object.keys(current||{})]);
  let count=0;
  for(const key of keys)if(String(previous?.[key]??'')!==String(current?.[key]??''))count++;
  return count;
}
function closeVersionCompare(){$('versionModal').classList.add('hidden')}
function openVersionCompare(decisionKey){
  let versions=saved().filter(x=>savedDecisionKey(x)===decisionKey).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,12);
  if(versions.length<2)return toast('Salve pelo menos duas versões desta decisão.');
  $('versionModalTitle').textContent=(versions[0]?.decisionName||versions[0]?.title||'Decisão')+' — linha do tempo';
  const chronological=[...versions].reverse();
  const timeline=chronological.map((v,i)=>{
    const prev=chronological[i-1],changes=prev?assumptionChangeCount(prev.assumptions,v.assumptions):0;
    return `<button class="timelineNode ${i===chronological.length-1?'current':''}" onclick="closeVersionCompare();openSavedDecision(${v.id})"><i></i><span>V${v.version||i+1}</span><b>${new Date(v.date).toLocaleDateString('pt-BR')}</b><small>${i===0?'Ponto inicial':changes+' premissa'+(changes===1?'':'s')+' alterada'+(changes===1?'':'s')}</small></button>`;
  }).join('');
  const cards=versions.map((v,i)=>{
    const older=versions[i+1],changes=older?assumptionChangeCount(older.assumptions,v.assumptions):0;
    return `<article class="versionCard ${i===0?'latest':''}"><div class="versionCardTop"><span>VERSÃO ${v.version||versions.length-i}</span><b>${new Date(v.date).toLocaleDateString('pt-BR')}</b></div><h3>${escapeHtml(v.scenarioLabel||'Cenário salvo')}</h3><div class="versionPrimary">${escapeHtml(v.primary)}</div><p>${escapeHtml(v.subtitle||'')}</p>${older?`<div class="versionDelta"><span>DESDE V${older.version||''}</span><b>${changes} premissa${changes===1?'':'s'} alterada${changes===1?'':'s'}</b></div>`:''}<div class="versionMetrics">${(v.metrics||[]).slice(0,4).map(m=>`<div><span>${escapeHtml(m[0])}</span><b>${escapeHtml(m[1])}</b></div>`).join('')}</div><button onclick="closeVersionCompare();openSavedDecision(${v.id})">Reabrir esta versão →</button></article>`;
  }).join('');
  $('versionCompareGrid').innerHTML=`<div class="versionTimeline"><div class="timelineTrack"></div>${timeline}</div><div class="versionCardsGrid">${cards}</div>`;
  $('versionModal').classList.remove('hidden');
}
function copyResult(){
  if(!state.last)return;
  navigator.clipboard?.writeText(`${currentDecisionName()}\n${state.current.title}\n${state.scenario?getScenarioLabel(state.scenario.active)+'\n':''}${state.last.primary}\n${state.last.subtitle}\n${state.last.metrics.map(x=>x[0]+': '+x[1]).join('\n')}`);
  toast('Resumo copiado.');
}
function ensureScenarioSnapshotsForReport(){
  if(!state.scenario)return;
  let missing=Object.keys(state.scenario.sets).some(id=>!state.scenario.snapshots[id]);
  if(missing){compareScenarios();$('scenarioCompare').classList.add('hidden')}
}
function closeDecisionReport(){$('reportModal').classList.add('hidden')}
function openDecisionReport(){
  if(!state.last)return toast('Calcule primeiro.');
  if(state.plan==='free')return toast('O relatório completo está liberado no PRO Beta.');
  ensureScenarioSnapshotsForReport();
  const name=currentDecisionName(),scenarioLabel=state.scenario?getScenarioLabel(state.scenario.active):'Cenário atual';
  const decisionKey=makeDecisionKey(state.current.id,name),documentId=decisionDocumentId(decisionKey);
  const allVersions=saved().filter(x=>savedDecisionKey(x)===decisionKey).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const reportVersion=allVersions.length?Math.max(...allVersions.map(x=>Number(x.version)||1)):null;
  const metrics=(state.last.metrics||[]).map(m=>`<div class="reportMetric"><small>${escapeHtml(m[0])}</small><b>${escapeHtml(m[1])}</b></div>`).join('');
  const sensitivity=(state.last.sens||[]).map(s=>`<div class="reportSensitivityItem"><small>${escapeHtml(s[0])}</small><b>${escapeHtml(s[1])}</b></div>`).join('');
  const savedVersions=allVersions,previous=savedVersions[0]||null;
  let evolutionSection='';
  if(previous){
    const currentMetrics=state.last.metrics||[],prevMetrics=previous.metrics||[],labels=[...new Set([...currentMetrics.map(m=>m[0]),...prevMetrics.map(m=>m[0])])].slice(0,6);
    evolutionSection=`<section class="reportSection"><div class="reportSectionHead"><h3>Desde a última versão</h3><span>EVOLUÇÃO</span></div><div class="reportEvolution"><div class="reportEvolutionHero"><small>ÚLTIMA VERSÃO SALVA · ${escapeHtml(new Date(previous.date).toLocaleDateString('pt-BR'))}</small><b>${escapeHtml(previous.primary)}</b><p>${escapeHtml(previous.subtitle||'')}</p></div><div class="reportEvolutionTableWrap"><table class="reportScenarioTable"><thead><tr><th>Métrica</th><th>Agora</th><th>Última versão</th></tr></thead><tbody>${labels.map(label=>{let cur=currentMetrics.find(m=>m[0]===label),old=prevMetrics.find(m=>m[0]===label);return`<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(cur?cur[1]:'—')}</td><td>${escapeHtml(old?old[1]:'—')}</td></tr>`}).join('')}</tbody></table></div></div></section>`;
  }
  const drivers=decisionDrivers().map(d=>`<div class="reportDriver"><small>${escapeHtml(d[0])}</small><b>${escapeHtml(d[1])}</b><p>${escapeHtml(d[2])}</p></div>`).join('');
  const assumptions=reportAssumptionRows().map(a=>`<div class="reportAssumption"><span>${escapeHtml(a[0])}</span><b>${escapeHtml(a[1])}</b></div>`).join('');
  let scenarioSection='';
  if(state.scenario){
    const ids=Object.keys(state.scenario.sets).slice(0,5),snaps=ids.map(id=>({id,s:state.scenario.snapshots[id]})).filter(x=>x.s);
    const labels=[...new Set(snaps.flatMap(x=>(x.s.metrics||[]).slice(0,5).map(m=>m[0])))].slice(0,6);
    if(snaps.length){
      scenarioSection=`<section class="reportSection"><div class="reportSectionHead"><h3>Cenários</h3><span>COMPARAÇÃO</span></div><table class="reportScenarioTable"><thead><tr><th>Métrica</th>${snaps.map(x=>`<th>${escapeHtml(getScenarioLabel(x.id))}</th>`).join('')}</tr></thead><tbody>${labels.map(label=>`<tr><td>${escapeHtml(label)}</td>${snaps.map(x=>{let m=(x.s.metrics||[]).find(v=>v[0]===label);return`<td>${escapeHtml(m?m[1]:'—')}</td>`}).join('')}</tr>`).join('')}</tbody></table></section>`;
    }
  }
  const insight=state.last.insight?`<section class="reportSection"><div class="reportSectionHead"><h3>Leitura do resultado</h3><span>CONTEXTO</span></div><div class="reportText">${state.last.insight}</div></section>`:'';
  const breakEven=state.last.be?`<section class="reportSection"><div class="reportSectionHead"><h3>Ponto de equilíbrio</h3><span>BREAK-EVEN</span></div><div class="reportText">${state.last.be}</div></section>`:'';
  $('reportContent').innerHTML=`<header class="reportHeader"><div><div class="reportBrand"><i></i>AMARELO</div><div class="reportDocId">${escapeHtml(documentId)}${reportVersion?' · V'+reportVersion:''}</div></div><div class="reportMeta">Gerado em ${new Date().toLocaleString('pt-BR')}<br>Simulação educacional · premissas editáveis</div></header><div class="reportKicker">${escapeHtml(state.current.cat.toUpperCase())} / RELATÓRIO DE DECISÃO</div><h1 class="reportTitle">${escapeHtml(name)}</h1><p class="reportSubtitle">${escapeHtml(state.current.title)} · ${escapeHtml(state.current.desc)}</p><div class="reportScenario">${escapeHtml(scenarioLabel)}</div><section class="reportHero"><small>RESPOSTA DA SIMULAÇÃO</small><h2>${escapeHtml(state.last.primary)}</h2><p>${escapeHtml(state.last.subtitle||'')}</p></section><section class="reportSection"><div class="reportSectionHead"><h3>Métricas principais</h3><span>RESULTADO</span></div><div class="reportMetricGrid">${metrics}</div></section>${drivers?`<section class="reportSection"><div class="reportSectionHead"><h3>O que move a decisão</h3><span>DRIVERS</span></div><div class="reportDriverGrid">${drivers}</div></section>`:''}<section class="reportSection"><div class="reportSectionHead"><h3>Premissas</h3><span>TRANSPARÊNCIA</span></div><div class="reportAssumptions">${assumptions}</div></section>${insight}${breakEven}${sensitivity?`<section class="reportSection"><div class="reportSectionHead"><h3>Sensibilidade</h3><span>E SE?</span></div><div class="reportSensitivity">${sensitivity}</div></section>`:''}${scenarioSection}${evolutionSection}<div class="reportMethod"><b>Metodologia.</b> ${escapeHtml(method(state.current.engine))}</div><footer class="reportFooter"><span><b>AMARELO</b> · Antes de decidir, coloque na conta.<br>${escapeHtml(documentId)} · ${escapeHtml(state.current.title)}</span><span>Simulação educacional baseada nas premissas apresentadas. Não constitui promessa de resultado nem substitui análise individual de riscos, contratos, tributos ou condições específicas.</span></footer>`;
  $('reportModal').classList.remove('hidden');
}
