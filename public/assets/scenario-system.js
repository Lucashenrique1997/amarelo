/* AMARELO 1.0 — scenario, sensitivity and driver system
 * Base/Conservador/Otimista, custom scenarios, what-if and decision drivers.
 */
const scenarioDecisionIds=new Set(['financiamento-consorcio','comprar-alugar','imovel-na-planta','amortizar-investir','bonus-decidir','aposentadoria','portabilidade-divida','trocar-carro','comparar-financiamentos','renda-fixa','meta-financeira','independencia-financeira','viver-renda']);
const scenarioNames={base:'Base',conservative:'Conservador',optimistic:'Otimista'};
const scenarioNotes={
 base:'Suas premissas atuais. Este é o ponto de partida da comparação.',
 conservative:'Premissas mais prudentes para testar a resistência da decisão. Não é previsão.',
 optimistic:'Premissas mais favoráveis para testar a folga do plano. Não é previsão.'
};
const cloneData=x=>JSON.parse(JSON.stringify(x));
function scenarioEnabled(){return !!state.current&&scenarioDecisionIds.has(state.current.id)}
function setAssumptions(values){Object.entries(values||{}).forEach(([id,v])=>{let el=$(id);if(el)el.value=v})}
function scenarioNumber(obj,id){let v=parseFloat(obj[id]);return Number.isFinite(v)?v:0}
function setScenarioNumber(obj,id,value,min=-Infinity,max=Infinity){obj[id]=String(Math.min(max,Math.max(min,value)))}
function buildScenarioPreset(base,type){
 let a=cloneData(base),stress=type==='conservative',opti=type==='optimistic';
 if(!stress&&!opti)return a;
 const e=state.current.engine;
 const delta=(bad,good)=>stress?bad:good;
 if(e==='buyPaths'){
   setScenarioNumber(a,'finM',scenarioNumber(a,'finM')+delta(.15,-.15),0);
   setScenarioNumber(a,'cont',Math.round(scenarioNumber(a,'cont')*delta(1.45,.75)),1,scenarioNumber(a,'consN')||1200);
   setScenarioNumber(a,'reaj',scenarioNumber(a,'reaj')+delta(1.5,-1),0);
   setScenarioNumber(a,'inv',scenarioNumber(a,'inv')+delta(-2,2),0);
   setScenarioNumber(a,'rent',scenarioNumber(a,'rent')*delta(1.1,.95),0);
 }else if(e==='buyRent'){
   setScenarioNumber(a,'app',scenarioNumber(a,'app')+delta(-2,2),-20,30);
   setScenarioNumber(a,'inv',scenarioNumber(a,'inv')+delta(-2,2),0);
   setScenarioNumber(a,'rentGrow',scenarioNumber(a,'rentGrow')+delta(1,-1),0);
   setScenarioNumber(a,'finM',scenarioNumber(a,'finM')+delta(.1,-.1),0);
   setScenarioNumber(a,'maintenance',scenarioNumber(a,'maintenance')+delta(.25,-.2),0);
 }else if(e==='offPlan'){
   setScenarioNumber(a,'offIndex',scenarioNumber(a,'offIndex')+delta(2,-1.5),-20,50);
   setScenarioNumber(a,'offApp',scenarioNumber(a,'offApp')+delta(-2,2),-20,30);
   setScenarioNumber(a,'offInv',scenarioNumber(a,'offInv')+delta(-2,2),-20,30);
   setScenarioNumber(a,'offFinanceRate',scenarioNumber(a,'offFinanceRate')+delta(.15,-.15),0);
   setScenarioNumber(a,'offMonths',Math.round(scenarioNumber(a,'offMonths')+delta(6,-3)),1,120);
 }else if(e==='amortInvest'){
   setScenarioNumber(a,'invGross',scenarioNumber(a,'invGross')+delta(-2,2),0);
   setScenarioNumber(a,'fee',scenarioNumber(a,'fee')+delta(.25,-.25),0);
   setScenarioNumber(a,'debtA',scenarioNumber(a,'debtA')+delta(1,-1),0);
 }else if(e==='windfallDecision'){
   setScenarioNumber(a,'windDebtRate',scenarioNumber(a,'windDebtRate')+delta(2,-2),0);
   setScenarioNumber(a,'windInv',scenarioNumber(a,'windInv')+delta(-2,2),0);
   setScenarioNumber(a,'windFee',scenarioNumber(a,'windFee')+delta(.25,-.25),0);
 }else if(e==='retirement'){
   setScenarioNumber(a,'real',scenarioNumber(a,'real')+delta(-1,1),-10,30);
   setScenarioNumber(a,'fee',scenarioNumber(a,'fee')+delta(.25,-.25),0);
   setScenarioNumber(a,'inflation',scenarioNumber(a,'inflation')+delta(1,-.5),0);
   setScenarioNumber(a,'income',scenarioNumber(a,'income')*delta(1.1,.95),0);
 }else if(e==='liveIncome'){
   setScenarioNumber(a,'real',scenarioNumber(a,'real')+delta(-1,1),-10,30);
   setScenarioNumber(a,'liveFee',scenarioNumber(a,'liveFee')+delta(.25,-.25),0);
   setScenarioNumber(a,'income',scenarioNumber(a,'income')*delta(1.1,.95),0);
 }else if(e==='financialIndependence'){
   setScenarioNumber(a,'fiReal',scenarioNumber(a,'fiReal')+delta(-1,1),-10,30);
   setScenarioNumber(a,'fiExpenses',scenarioNumber(a,'fiExpenses')*delta(1.1,.95),0);
   setScenarioNumber(a,'fiPmt',scenarioNumber(a,'fiPmt')*delta(.9,1.1),0);
 }else if(e==='fixedIncome'){
   setScenarioNumber(a,'cdi',scenarioNumber(a,'cdi')+delta(-2,2),0);
   setScenarioNumber(a,'fiARate',scenarioNumber(a,'fiARate')+delta(-5,5),0);
   setScenarioNumber(a,'fiBRate',scenarioNumber(a,'fiBRate')+delta(-5,5),0);
   setScenarioNumber(a,'fiCRate',scenarioNumber(a,'fiCRate')+delta(-1,1),0);
 }else if(e==='goal'){
   setScenarioNumber(a,'rate',scenarioNumber(a,'rate')+delta(-2,2),0);
   setScenarioNumber(a,'years',Math.max(1,scenarioNumber(a,'years')+delta(-1,1)),1);
   setScenarioNumber(a,'pmt',scenarioNumber(a,'pmt')*delta(.9,1.1),0);
 }else if(e==='loanCompare'){
   setScenarioNumber(a,'cmpARate',scenarioNumber(a,'cmpARate')+delta(.12,-.12),0);
   setScenarioNumber(a,'cmpBRate',scenarioNumber(a,'cmpBRate')+delta(.12,-.12),0);
   setScenarioNumber(a,'cmpAUpfront',scenarioNumber(a,'cmpAUpfront')*delta(1.15,.9),0);
   setScenarioNumber(a,'cmpBUpfront',scenarioNumber(a,'cmpBUpfront')*delta(1.15,.9),0);
 }else if(e==='debtPortability'){
   setScenarioNumber(a,'portNewRate',scenarioNumber(a,'portNewRate')+delta(.2,-.2),0);
   setScenarioNumber(a,'portFee',scenarioNumber(a,'portFee')*delta(1.25,.75),0);
   setScenarioNumber(a,'portNewN',Math.max(1,Math.round(scenarioNumber(a,'portNewN')+delta(6,-6))),1);
 }else if(e==='carDecision'){
   setScenarioNumber(a,'carNewPrice',scenarioNumber(a,'carNewPrice')*delta(1.05,.95),0);
   setScenarioNumber(a,'carNewDep',scenarioNumber(a,'carNewDep')+delta(3,-3),0,90);
   setScenarioNumber(a,'carRate',scenarioNumber(a,'carRate')+delta(.15,-.15),0);
   setScenarioNumber(a,'carCurrentMaint',scenarioNumber(a,'carCurrentMaint')*delta(1.1,.9),0);
   setScenarioNumber(a,'carInv',scenarioNumber(a,'carInv')+delta(-2,2),0);
 }
 return a;
}
function scenarioWhatIfConfig(){
 const e=state.current?.engine;
 const map={
  buyPaths:[
   {id:'finM',label:'Taxa do crédito',step:.1,suffix:'% a.m.',min:0},
   {id:'cont',label:'Contemplação',step:6,suffix:' meses',min:1},
   {id:'inv',label:'Retorno alternativo',step:1,suffix:'% a.a.',min:0}
  ],
  buyRent:[
   {id:'app',label:'Valorização do imóvel',step:1,suffix:'% a.a.',min:-20},
   {id:'inv',label:'Retorno investido',step:1,suffix:'% a.a.',min:0},
   {id:'rent',label:'Aluguel mensal',step:250,prefix:'R$ ',min:0}
  ],
  offPlan:[
   {id:'offIndex',label:'Correção da obra',step:.5,suffix:'% a.a.',min:-20},
   {id:'offApp',label:'Valorização do imóvel',step:1,suffix:'% a.a.',min:-20},
   {id:'offFinanceRate',label:'Taxa na entrega',step:.1,suffix:'% a.m.',min:0}
  ],
  amortInvest:[
   {id:'invGross',label:'Retorno do investimento',step:1,suffix:'% a.a.',min:0},
   {id:'cash',label:'Capital disponível',step:10000,prefix:'R$ ',min:0},
   {id:'debtA',label:'Custo da dívida',step:1,suffix:'% a.a.',min:0}
  ],
  windfallDecision:[
   {id:'windAmount',label:'Valor recebido',step:5000,prefix:'R$ ',min:0},
   {id:'windDebtRate',label:'Custo da dívida',step:1,suffix:'% a.a.',min:0},
   {id:'windInv',label:'Retorno do investimento',step:1,suffix:'% a.a.',min:0}
  ],
  retirement:[
   {id:'real',label:'Retorno real',step:.5,suffix:'% a.a.',min:-10},
   {id:'pmt',label:'Aporte mensal',step:250,prefix:'R$ ',min:0},
   {id:'ret',label:'Idade de aposentadoria',step:1,suffix:' anos',min:18}
  ],
  liveIncome:[
   {id:'real',label:'Retorno real',step:.5,suffix:'% a.a.',min:-10},
   {id:'income',label:'Renda desejada',step:500,prefix:'R$ ',min:0},
   {id:'legacy',label:'Legado final',step:10,suffix:'%',min:0,max:100}
  ],
  financialIndependence:[
   {id:'fiReal',label:'Retorno real',step:.5,suffix:'% a.a.',min:-10},
   {id:'fiPmt',label:'Aporte mensal',step:500,prefix:'R$ ',min:0},
   {id:'fiExpenses',label:'Custo de vida',step:500,prefix:'R$ ',min:0}
  ],
  fixedIncome:[
   {id:'cdi',label:'CDI anual',step:1,suffix:'% a.a.',min:0},
   {id:'fiARate',label:'Taxa Produto A',step:2,suffix:'',min:0},
   {id:'fiBRate',label:'Taxa Produto B',step:2,suffix:'',min:0}
  ],
  goal:[
   {id:'rate',label:'Retorno anual',step:1,suffix:'% a.a.',min:0},
   {id:'pmt',label:'Aporte mensal',step:250,prefix:'R$ ',min:0},
   {id:'years',label:'Prazo',step:1,suffix:' anos',min:1}
  ],
  loanCompare:[
   {id:'cmpARate',label:'Taxa proposta A',step:.05,suffix:'% a.m.',min:0},
   {id:'cmpBRate',label:'Taxa proposta B',step:.05,suffix:'% a.m.',min:0},
   {id:'cmpHorizon',label:'Horizonte de saldo',step:12,suffix:' meses',min:1}
  ],
  debtPortability:[
   {id:'portNewRate',label:'Nova taxa',step:.1,suffix:'% a.m.',min:0},
   {id:'portFee',label:'Custos da troca',step:500,prefix:'R$ ',min:0},
   {id:'portNewN',label:'Novo prazo',step:6,suffix:' meses',min:1}
  ],
  carDecision:[
   {id:'carNewPrice',label:'Preço do novo carro',step:5000,prefix:'R$ ',min:0},
   {id:'carCurrentMaint',label:'Manutenção atual',step:1000,prefix:'R$ ',min:0},
   {id:'carRate',label:'Taxa do financiamento',step:.1,suffix:'% a.m.',min:0}
  ]
 };
 return map[e]||[];
}
function formatScenarioValue(cfg,value){
 let n=parseFloat(value)||0;
 if(cfg.prefix==='R$ ')return BRL(n);
 let decimals=Math.abs(cfg.step)<1?2:0;
 return n.toLocaleString('pt-BR',{maximumFractionDigits:decimals,minimumFractionDigits:decimals})+(cfg.suffix||'');
}
function getScenarioLabel(id){
 if(scenarioNames[id])return scenarioNames[id];
 return state.scenario?.labels?.[id]||'Cenário';
}
function initScenarioLab(){
 state.scenario=null;
 const lab=$('scenarioLab');
 if(!scenarioEnabled()){lab.classList.add('hidden');$('saveDecisionBtn').textContent='Salvar decisão';$('scenarioActiveBadge').classList.add('hidden');return}
 const base=captureAssumptions();
 state.scenario={
   active:'base',
   sets:{base:cloneData(base),conservative:buildScenarioPreset(base,'conservative'),optimistic:buildScenarioPreset(base,'optimistic')},
   labels:{},
   dirty:{base:false,conservative:false,optimistic:false},
   snapshots:{base:state.last?cloneData(state.last):null},
   customCount:0
 };
 lab.classList.remove('hidden');
 $('saveDecisionBtn').textContent='Salvar versão';
 renderScenarioLab();
 recordScenarioSnapshot();
}
function persistActiveScenario(){
 if(!state.scenario||state.scenarioBusy)return;
 const id=state.scenario.active,vals=captureAssumptions();
 state.scenario.sets[id]=cloneData(vals);
 if(id==='base'){
   if(!state.scenario.dirty.conservative)state.scenario.sets.conservative=buildScenarioPreset(vals,'conservative');
   if(!state.scenario.dirty.optimistic)state.scenario.sets.optimistic=buildScenarioPreset(vals,'optimistic');
 }else{
   state.scenario.dirty[id]=true;
 }
}
function renderScenarioLab(){
 if(!state.scenario)return;
 const ids=Object.keys(state.scenario.sets);
 $('scenarioActiveBadge').textContent=getScenarioLabel(state.scenario.active);
 $('scenarioActiveBadge').classList.remove('hidden');
 $('scenarioTabs').innerHTML=ids.map(id=>`<button class="scenarioTab ${state.scenario.active===id?'active':''}" onclick="switchScenario('${id}')"><small>${id.startsWith('custom')?'CENÁRIO LIVRE':'CENÁRIO'}</small><b>${getScenarioLabel(id)}</b><span>${id==='base'?'premissas atuais':id==='conservative'?'mais prudente':id==='optimistic'?'mais favorável':'editável'}</span></button>`).join('');
 $('scenarioDescription').textContent=scenarioNotes[state.scenario.active]||'Cópia independente para testar outra hipótese.';
 renderWhatIfQuick();
}
function renderWhatIfQuick(){
 if(!state.scenario)return;
 const cfgs=scenarioWhatIfConfig();
 $('whatIfQuick').innerHTML=cfgs.map(cfg=>{let el=$(cfg.id),v=el?.value??0;return`<div class="whatIfControl"><button aria-label="Reduzir ${cfg.label}" onclick="adjustWhatIf('${cfg.id}',${-cfg.step},${Number.isFinite(cfg.min)?cfg.min:'null'},${Number.isFinite(cfg.max)?cfg.max:'null'})">−</button><div class="whatIfValue"><small>${cfg.label}</small><b>${formatScenarioValue(cfg,v)}</b></div><button aria-label="Aumentar ${cfg.label}" onclick="adjustWhatIf('${cfg.id}',${cfg.step},${Number.isFinite(cfg.min)?cfg.min:'null'},${Number.isFinite(cfg.max)?cfg.max:'null'})">+</button></div>`}).join('');
}
function adjustWhatIf(id,delta,min=null,max=null){
 let el=$(id);if(!el)return;
 let v=(parseFloat(el.value)||0)+delta;
 if(min!==null)v=Math.max(min,v);if(max!==null)v=Math.min(max,v);
 el.value=String(Math.round(v*10000)/10000);
 calculateTool();
 renderScenarioLab();
}
function switchScenario(id){
 if(!state.scenario||!state.scenario.sets[id])return;
 persistActiveScenario();
 state.scenario.active=id;
 state.scenarioBusy=true;
 setAssumptions(state.scenario.sets[id]);
 calculateTool();
 state.scenarioBusy=false;
 renderScenarioLab();
}
function duplicateScenario(){
 if(!state.scenario)return;
 persistActiveScenario();
 const id='custom'+(++state.scenario.customCount);
 state.scenario.labels[id]='Cópia '+state.scenario.customCount;
 state.scenario.sets[id]=cloneData(state.scenario.sets[state.scenario.active]);
 state.scenario.dirty[id]=true;
 state.scenario.active=id;
 state.scenarioBusy=true;
 setAssumptions(state.scenario.sets[id]);
 calculateTool();
 state.scenarioBusy=false;
 renderScenarioLab();
 toast('Cenário duplicado. Ajuste as premissas livremente.');
}
function recordScenarioSnapshot(){
 if(!state.scenario||!state.last)return;
 state.scenario.snapshots[state.scenario.active]={...cloneData(state.last),assumptions:captureAssumptions()};
}
function renderScenarioCompare(){
 if(!state.scenario)return;
 const ids=Object.keys(state.scenario.sets),snaps=ids.map(id=>({id,s:state.scenario.snapshots[id]})).filter(x=>x.s);
 const metricLabels=[...new Set(snaps.flatMap(x=>(x.s.metrics||[]).slice(0,5).map(m=>m[0])))].slice(0,6);
 const matrix=`<div class="scenarioMatrixWrap"><table class="scenarioMatrix"><thead><tr><th>Métrica</th>${snaps.map(x=>`<th>${getScenarioLabel(x.id)}</th>`).join('')}</tr></thead><tbody>${metricLabels.map(label=>`<tr><td>${label}</td>${snaps.map(x=>{let m=(x.s.metrics||[]).find(v=>v[0]===label);return`<td>${m?m[1]:'—'}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`;
 $('scenarioCompare').innerHTML=`<div class="scenarioCompareHead"><div><span>LEITURA LADO A LADO</span><h4>Comparação de cenários</h4></div><button onclick="document.getElementById('scenarioCompare').classList.add('hidden')">Fechar ×</button></div><div class="scenarioCompareGrid">${snaps.map(({id,s})=>{let metrics=(s.metrics||[]).slice(0,3);return`<article class="scenarioSnapshot ${state.scenario.active===id?'active':''}"><span>${getScenarioLabel(id)}</span><h5>${state.current.title}</h5><div class="snapshotPrimary">${s.primary}</div><div class="snapshotSubtitle">${s.subtitle||''}</div><div class="snapshotMetrics">${metrics.map(m=>`<div><span>${m[0]}</span><b>${m[1]}</b></div>`).join('')}</div></article>`}).join('')}</div>${matrix}`;
 $('scenarioCompare').classList.remove('hidden');
}
function compareScenarios(){
 if(!state.scenario)return;
 persistActiveScenario();
 const original=state.scenario.active,originalValues=cloneData(state.scenario.sets[original]);
 state.scenarioBusy=true;
 for(const id of Object.keys(state.scenario.sets)){
   state.scenario.active=id;
   setAssumptions(state.scenario.sets[id]);
   calculateTool();
 }
 state.scenario.active=original;
 setAssumptions(originalValues);
 calculateTool();
 state.scenarioBusy=false;
 renderScenarioLab();
 renderScenarioCompare();
}
function decisionDrivers(){
 if(!scenarioEnabled())return[];
 const e=state.current.engine;
 const map={
  buyPaths:()=>[
   ['Taxa do financiamento',PCT(num('finM'))+' a.m.','mexe no custo do crédito'],
   ['Contemplação simulada',Math.round(num('cont'))+' meses','mexe no tempo de espera'],
   ['Retorno alternativo',PCT(num('inv'))+' a.a.','mexe no custo de oportunidade'],
   ['Reajuste da carta',PCT(num('reaj'))+' a.a.','mexe no fluxo do consórcio']
  ],
  buyRent:()=>[
   ['Valorização do imóvel',PCT(num('app'))+' a.a.','mexe no patrimônio do proprietário'],
   ['Retorno investido',PCT(num('inv'))+' a.a.','mexe no patrimônio do inquilino'],
   ['Aluguel inicial',BRL(num('rent')),'mexe no caixa mensal'],
   ['Taxa do financiamento',PCT(num('finM'))+' a.m.','mexe no custo de comprar']
  ],
  offPlan:()=>[
   ['Correção da obra',PCT(num('offIndex'))+' a.a.','mexe no saldo que chega à entrega'],
   ['Prazo até entrega',Math.round(num('offMonths'))+' meses','mexe no tempo de correção e aluguel'],
   ['Taxa na entrega',PCT(num('offFinanceRate'))+' a.m.','mexe no custo do saldo financiado'],
   ['Valorização de mercado',PCT(num('offApp'))+' a.a.','mexe no preço de esperar']
  ],
  amortInvest:()=>[
   ['Custo da dívida',PCT(num('debtA'))+' a.a.','define a economia potencial'],
   ['Retorno do investimento',PCT(num('invGross'))+' a.a.','define o ganho alternativo'],
   ['Capital disponível',BRL(num('cash')),'define o tamanho da decisão'],
   ['Prazo restante',Math.round(num('months'))+' meses','define por quanto tempo o efeito se acumula']
  ],
  windfallDecision:()=>[
   ['Valor recebido',BRL(num('windAmount')),'define o tamanho da decisão'],
   ['Custo da dívida',PCT(num('windDebtRate'))+' a.a.','define o custo evitável'],
   ['Retorno do investimento',PCT(num('windInv'))+' a.a.','define o ganho alternativo'],
   ['Gap de reserva',BRL(Math.max(0,num('windExpense')*num('windReserveMonths')-num('windReserve'))),'define o contexto de liquidez']
  ],
  retirement:()=>[
   ['Retorno real líquido',PCT(num('real')-num('fee'))+' a.a.','mexe na acumulação e renda'],
   ['Aporte mensal',BRL(num('pmt')),'mexe na velocidade de formação'],
   ['Tempo até aposentar',Math.max(0,num('ret')-num('age')).toFixed(1).replace('.',',')+' anos','mexe no tempo de capitalização'],
   ['Renda desejada',BRL(num('income'))+'/mês','mexe no capital necessário']
  ],
  liveIncome:()=>[
   ['Retorno real líquido',PCT(num('real')-num('liveFee'))+' a.a.','mexe na renda sustentável'],
   ['Renda desejada',BRL(num('income'))+'/mês','mexe na velocidade de consumo'],
   ['Horizonte',Math.round(num('years'))+' anos','mexe na duração necessária'],
   ['Legado final',PCT(num('legacy')),'mexe no capital que precisa permanecer']
  ],
  financialIndependence:()=>[
   ['Custo de vida',BRL(num('fiExpenses'))+'/mês','define a renda a cobrir'],
   ['Cobertura desejada',PCT(num('fiCoverage')),'define o objetivo'],
   ['Retorno real',PCT(num('fiReal'))+' a.a.','mexe no capital-alvo'],
   ['Aporte mensal',BRL(num('fiPmt')),'mexe no tempo até a meta']
  ],
  loanCompare:()=>[
   ['Taxa proposta A',PCT(num('cmpARate'))+' a.m.','mexe no custo e na amortização'],
   ['Taxa proposta B',PCT(num('cmpBRate'))+' a.m.','mexe no custo e na amortização'],
   ['Custos iniciais',BRL(num('cmpAUpfront'))+' / '+BRL(num('cmpBUpfront')),'mexe no custo econômico'],
   ['Horizonte de saldo',Math.round(num('cmpHorizon'))+' meses','mostra quanto da dívida ainda permanece']
  ],
  debtPortability:()=>[
   ['Taxa atual',PCT(num('portCurrentRate'))+' a.m.','define o fluxo existente'],
   ['Nova taxa',PCT(num('portNewRate'))+' a.m.','mexe no custo da proposta'],
   ['Custos iniciais',BRL(num('portFee')),'podem consumir a economia'],
   ['Prazo novo',Math.round(num('portNewN'))+' meses','mexe na parcela e total']
  ],
  carDecision:()=>[
   ['Diferença de preço',BRL(Math.max(0,num('carNewPrice')-num('carCurrentValue'))),'define quanto capital precisa migrar'],
   ['Taxa do financiamento',PCT(num('carRate'))+' a.m.','mexe no custo de trocar'],
   ['Manutenção do atual',BRL(num('carCurrentMaint'))+'/ano','mexe no custo de manter'],
   ['Retorno do capital',PCT(num('carInv'))+' a.a.','mexe no valor de esperar']
  ],
  fixedIncome:()=>[
   ['CDI informado',PCT(num('cdi'))+' a.a.','mexe nos produtos pós-fixados'],
   ['Produto A',num('fiARate').toLocaleString('pt-BR')+' · '+fixedIncomeTypeLabel($('fiAType').value),'taxa e tributação do primeiro produto'],
   ['Produto B',num('fiBRate').toLocaleString('pt-BR')+' · '+fixedIncomeTypeLabel($('fiBType').value),'taxa e tributação do segundo produto'],
   ['Prazo',Math.round(num('months'))+' meses','mexe em imposto, carência e capitalização']
  ],
  goal:()=>[
   ['Meta',BRL(num('target')),'define o patrimônio desejado'],
   ['Aporte mensal',BRL(num('pmt')),'mexe na velocidade de formação'],
   ['Retorno',PCT(num('rate'))+' a.a.','mexe na capitalização'],
   ['Prazo',num('years').toFixed(1).replace('.',',')+' anos','mexe no tempo disponível']
  ]
 };
 return map[e]?map[e]():[];
}
function renderDecisionDrivers(){
 const drivers=decisionDrivers();
 if(!drivers.length){$('driverBox').classList.add('hidden');return}
 $('decisionDrivers').innerHTML=drivers.map(d=>`<div class="driverChip"><small>${d[0]}</small><b>${d[1]}</b><span>${d[2]}</span></div>`).join('');
 $('driverBox').classList.remove('hidden');
}
function exportScenarioState(){
 if(!state.scenario)return null;
 persistActiveScenario();
 return cloneData({active:state.scenario.active,sets:state.scenario.sets,labels:state.scenario.labels,dirty:state.scenario.dirty,customCount:state.scenario.customCount});
}
function restoreScenarioState(savedState){
 if(!state.scenario||!savedState?.sets)return false;
 state.scenario.sets=cloneData(savedState.sets);
 state.scenario.labels=cloneData(savedState.labels||{});
 state.scenario.dirty=cloneData(savedState.dirty||{});
 state.scenario.customCount=savedState.customCount||0;
 state.scenario.active=savedState.active&&state.scenario.sets[savedState.active]?savedState.active:'base';
 state.scenario.snapshots={};
 state.scenarioBusy=true;
 setAssumptions(state.scenario.sets[state.scenario.active]);
 calculateTool();
 state.scenarioBusy=false;
 renderScenarioLab();
 return true;
}
