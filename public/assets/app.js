const $=id=>document.getElementById(id), num=id=>parseFloat($(id)?.value)||0;
const BRL=x=>(Number.isFinite(x)?x:0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
const PCT=x=>(Number.isFinite(x)?x:0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
const monthly=a=>AmareloFinance.monthly(a), irDays=d=>AmareloFinance.irDays(d);
const storage={
 get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},
 set(k,v){
   localStorage.setItem(k,JSON.stringify(v));
   window.dispatchEvent(new CustomEvent('amarelo:local-change',{detail:{key:k}}));
 }
};
let state={route:'home',category:'Todas',current:null,mode:'simple',last:null,plan:storage.get('amarelo_plan','free'),scenario:null,scenarioBusy:false,pendingAsk:null,askContext:null};
if(!['free','pro'].includes(state.plan)){state.plan='pro';storage.set('amarelo_plan','pro')}

const {journeys,tools}=AmareloCatalog;

const deepIds=new Set(['renda-fixa','gross-up','financiamento-consorcio','comprar-alugar','avista-parcelado','amortizar-investir','plano-dividas','portabilidade-divida','trocar-carro','comparar-financiamentos','meta-financeira','viver-renda','aposentadoria','salario-liquido','quanto-rende']);
const categories=['Todas',...new Set(tools.map(t=>t.cat))];

function navigate(route){state.route=route;document.querySelectorAll('.route').forEach(x=>x.classList.add('hidden'));let target=$('route-'+route);target.classList.remove('hidden');target.classList.remove('routeEnter');void target.offsetWidth;target.classList.add('routeEnter');let activeRoute=route==='tool'?'tools':route;document.querySelectorAll('.mobileNav button,.topbar [data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===activeRoute));window.scrollTo({top:0,behavior:'smooth'});if(route==='home')renderHome();if(route==='tools')renderTools('');if(route==='dashboard')renderDashboard();if(route==='pricing')renderPricing();if(route==='ask')renderAskExamples()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b)navigate(b.dataset.route)});
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function favs(){return storage.get('amarelo_favs',[])}function saved(){return storage.get('amarelo_decisions',[])}
function isFav(id){return favs().includes(id)}
function toggleFav(id){let f=favs();f=f.includes(id)?f.filter(x=>x!==id):[...f,id];storage.set('amarelo_favs',f);renderHome();renderTools($('toolSearch')?.value||'');if(state.current?.id===id)updateFav()}
function toolCard(t){return `<article class="toolCard ${t.tier==='decision'?'decisionCard':''}" onclick="openTool('${t.id}')"><button class="favStar ${isFav(t.id)?'on':''}" onclick="event.stopPropagation();toggleFav('${t.id}')">${isFav(t.id)?'★':'☆'}</button>${t.new?'<span class="newToolTag">NOVO</span>':''}<div class="toolIcon">${t.icon}</div><div class="cat">${t.cat}</div><h3>${t.title}</h3><p>${t.desc}</p><div class="toolCardFoot"><span class="tierTag ${t.tier}">${t.tier==='decision'?'Decisão PRO':t.tier==='pro'?'PRO':'Grátis'}</span><b>Colocar na conta →</b></div></article>`}
function renderHome(){$('journeys').innerHTML=journeys.map(j=>`<div class="journey" onclick="state.category='${j[0]}';navigate('tools')"><div class="jicon">${j[1]}</div><h3>${j[2]}</h3><p>${j[3]}</p><small>Explorar ${j[0]} →</small></div>`).join('');$('featured').innerHTML=tools.filter(t=>t.featured).slice(0,8).map(toolCard).join('')}
function renderTools(q=''){let s=q.toLowerCase();$('filters').innerHTML=categories.map(c=>`<button class="${state.category===c?'active':''}" onclick="state.category='${c}';renderTools(document.getElementById('toolSearch').value)">${c}</button>`).join('');let arr=tools.filter(t=>(state.category==='Todas'||t.cat===state.category)&&(!s||(t.title+' '+t.desc+' '+t.cat).toLowerCase().includes(s)));if($('toolCount'))$('toolCount').textContent=arr.length;$('toolLibrary').innerHTML=arr.length?arr.map(toolCard).join(''):`<div class="emptyState"><span>0 resultados</span><h3>Nenhuma decisão encontrada.</h3><p>Tente outro termo ou volte para “Todas”.</p><button onclick="state.category='Todas';document.getElementById('toolSearch').value='';renderTools('')">Limpar filtros →</button></div>`}
function renderPricing(){let el=$('pricingToolCount');if(el)el.textContent=tools.length}
function renderAskExamples(){let ex=[['Tenho R$ 100 mil e um financiamento. Amortizo ou invisto?','amortizar-investir'],['LCI 92% do CDI ou CDB 110%?','gross-up'],['Comprar imóvel ou continuar alugando?','comprar-alugar'],['Quanto preciso para aposentar recebendo R$ 10 mil?','aposentadoria'],['Me ofereceram portabilidade com taxa menor. A troca reduz meu custo?','portabilidade-divida'],['Tenho duas propostas de financiamento. Qual tem menor custo econômico?','comparar-financiamentos'],['Troco meu carro agora ou continuo com o atual?','trocar-carro']];$('askSuggestions').innerHTML=ex.map(x=>`<div class="askSuggestion" onclick="document.getElementById('askText').value='${x[0]}';openTool('${x[1]}')"><b>${x[0]}</b><p>Abrir análise relacionada →</p></div>`).join('')}
function parseMoneyBR(raw){
  if(!raw)return null;
  let s=String(raw).toLowerCase().trim(),mult=1;
  if(/milh|milhão|milhões|\bmi\b/.test(s))mult=1e6;
  else if(/\bmil\b|\bk\b/.test(s))mult=1e3;
  s=s.replace(/[^\d,.\-]/g,'');
  if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
  else if((s.match(/\./g)||[]).length&&/\.\d{3}(?:\.|$)/.test(s))s=s.replace(/\./g,'');
  let n=parseFloat(s);
  return Number.isFinite(n)?n*mult:null;
}
function parseRateBR(raw){
  if(raw==null)return null;
  let n=parseFloat(String(raw).replace(',','.'));
  return Number.isFinite(n)?n:null;
}
function moneyPattern(){return '(?:R\\$\\s*)?([\\d.]+(?:,\\d+)?\\s*(?:milh(?:ão|ões|oes)|mil|mi|k)?)'}
function firstMoney(text,patterns){
  const token=moneyPattern();
  for(const source of patterns){
    let re=new RegExp(source.replace('MONEY',token),'i'),m=text.match(re);
    if(m){
      let raw=m.slice(1).find(v=>v&&/\d/.test(v)),n=parseMoneyBR(raw);
      if(n!==null)return n;
    }
  }
  return null;
}
function firstRate(text,patterns){
  for(const re of patterns){let m=text.match(re);if(m){let n=parseRateBR(m[1]);if(n!==null)return n}}
  return null;
}
function firstInt(text,patterns){
  for(const re of patterns){let m=text.match(re);if(m)return parseInt(m[1],10)}
  return null;
}
function detectAskTool(text){
  const rules=[
    ['comparar-financiamentos',['comparar financiamento','comparar financiamentos','duas propostas','proposta a','proposta b','qual financiamento']],['imovel-na-planta',['na planta','imóvel na planta','imovel na planta','incc','entrega do imóvel','entrega do imovel']],
    ['bonus-decidir',['13º','décimo terceiro','decimo terceiro','bônus','bonus','plr','dinheiro extra']],
    ['independencia-financeira',['independência financeira','independencia financeira','liberdade financeira','cobrir meu custo de vida','cobrir meus gastos']],
    ['financiamento-consorcio',['consórc','consorc','financiar ou','financiamento ou investir','dar entrada']],
    ['comprar-alugar',['comprar ou alugar','alugar ou comprar','aluguel','continuar alugando']],
    ['portabilidade-divida',['portabilidade','portar dívida','portar divida','refinanciar','trocar financiamento']],
    ['trocar-carro',['trocar de carro','manter o carro','manter carro','comprar outro carro']],
    ['amortizar-investir',['amort','quitar financiamento','abater financiamento','reduzir saldo']],
    ['aposentadoria',['aposent','parar de trabalhar','previdência','previdencia']],
    ['viver-renda',['viver de renda','renda mensal com patrimônio','renda mensal com patrimonio']],
    ['salario-liquido',['salário','salario','quanto cai']],
    ['gross-up',['lci','lca','gross','cdb']],
    ['plano-dividas',['dívida','divida','cartão','cartao']],
    ['avista-parcelado',['à vista','a vista','parcelado']],
    ['meta-financeira',['meta','chegar em']]
  ];
  let best=['quanto-rende',0];
  for(const [id,words] of rules){
    let score=words.reduce((s,w)=>s+(text.includes(w)?1:0),0);
    if(score>best[1])best=[id,score];
  }
  return best[0];
}
function interpretAsk(raw){
  let text=String(raw||'').toLowerCase(),toolId=detectAskTool(text),values={},understood=[],missing=[];
  const add=(id,value,label,display)=>{
    if(value===null||value===undefined||!Number.isFinite(value))return;
    values[id]=String(value);understood.push([label,display||BRL(value)]);
  };
  if(toolId==='aposentadoria'){
    let age=firstInt(text,[/tenho\s+(\d{1,2})\s+anos/]);
    let ret=firstInt(text,[/(?:aposentar|aposentadoria|parar de trabalhar).*?(?:aos|com)\s+(\d{1,2})\s+anos/,/(?:aos|com)\s+(\d{1,2})\s+anos.*?(?:aposent|parar)/]);
    let current=firstMoney(text,['MONEY\\s+(?:investid|aplicad|guardad)','(?:patrimônio|patrimonio|tenho investido|tenho aplicado)(?:\\s+de)?\\s+MONEY']);
    let pmt=firstMoney(text,['(?:guardo|guardar|aporto|aportar|invisto|investir)(?:\\s+por mês|\\s+por mes|\\s+mensalmente)?\\s+MONEY','MONEY\\s+(?:por mês|por mes|mensais).*?(?:guardar|aportar|investir)']);
    let income=firstMoney(text,['(?:receber|recebendo|renda desejada|renda de)(?:\\s+de)?\\s+MONEY','MONEY\\s+(?:por mês|por mes).*?(?:aposent|renda)']);
    add('age',age,'Idade atual',age?age+' anos':null);
    add('ret',ret,'Aposentadoria',ret?ret+' anos':null);
    add('current',current,'Patrimônio atual',current?BRL(current):null);
    add('pmt',pmt,'Aporte mensal',pmt?BRL(pmt)+'/mês':null);
    add('income',income,'Renda desejada',income?BRL(income)+'/mês':null);
    if(age===null)missing.push('idade atual');
    if(ret===null)missing.push('idade de aposentadoria');
    if(current===null)missing.push('patrimônio atual');
    if(pmt===null)missing.push('aporte mensal');
    if(income===null)missing.push('renda desejada');
  }else if(toolId==='amortizar-investir'){
    let bal=firstMoney(text,['(?:saldo devedor|financiamento|devo)(?:\\s+de)?\\s+MONEY']);
    let cash=firstMoney(text,['MONEY\\s+(?:disponível|disponivel|para amortizar)','(?:tenho|capital disponível|capital disponivel)(?:\\s+de)?\\s+MONEY']);
    let debt=firstRate(text,[/(?:taxa|custo|cet).*?(\d+(?:[.,]\d+)?)%\s*(?:ao ano|a\.a\.)/,/(\d+(?:[.,]\d+)?)%\s*(?:ao ano|a\.a\.).*?(?:financiamento|dívida|divida)/]);
    let inv=firstRate(text,[/(?:rende|rendimento|retorno).*?(\d+(?:[.,]\d+)?)%/]);
    let months=firstInt(text,[/(\d+)\s+meses?\s+(?:restantes?|de prazo)/,/(\d+)\s+parcelas?\s+(?:restantes?)/]);
    add('balance',bal,'Saldo devedor',bal?BRL(bal):null);
    add('cash',cash,'Capital disponível',cash?BRL(cash):null);
    add('debtA',debt,'Custo da dívida',debt!==null?PCT(debt)+' a.a.':null);
    add('invGross',inv,'Retorno esperado',inv!==null?PCT(inv)+' a.a.':null);
    add('months',months,'Prazo restante',months?months+' meses':null);
    if(bal===null)missing.push('saldo devedor');
    if(debt===null)missing.push('custo/taxa anual da dívida');
    if(months===null)missing.push('prazo restante');
    if(cash===null)missing.push('capital disponível');
    if(inv===null)missing.push('retorno esperado do investimento');
  }else if(toolId==='comprar-alugar'){
    let asset=firstMoney(text,['(?:imóvel|imovel|apartamento|casa)(?:\\s+(?:de|vale|custa))?\\s+MONEY','MONEY\\s+(?:de imóvel|de imovel|de apartamento|de casa)']);
    let down=firstMoney(text,['entrada(?:\\s+de)?\\s+MONEY']);
    let rent=firstMoney(text,['aluguel(?:\\s+de|\\s+por)?\\s+MONEY']);
    let fin=firstRate(text,[/(?:financiamento|crédito|credito).*?(\d+(?:[.,]\d+)?)%\s*(?:a\.m\.|ao mês|ao mes)/]);
    let inv=firstRate(text,[/(?:retorno|rende|investimento).*?(\d+(?:[.,]\d+)?)%\s*(?:a\.a\.|ao ano)?/]);
    let years=firstInt(text,[/(\d+)\s+anos?\s+(?:de horizonte|comparando|para comparar)/]);
    add('asset',asset,'Valor do imóvel',asset?BRL(asset):null);
    add('down',down,'Entrada',down?BRL(down):null);
    add('rent',rent,'Aluguel',rent?BRL(rent)+'/mês':null);
    add('finM',fin,'Taxa do financiamento',fin!==null?PCT(fin)+' a.m.':null);
    add('inv',inv,'Retorno investido',inv!==null?PCT(inv)+' a.a.':null);
    add('years',years,'Horizonte',years?years+' anos':null);
    if(asset===null)missing.push('valor do imóvel');
    if(rent===null)missing.push('aluguel mensal');
    if(inv===null)missing.push('retorno do investimento');
    if(years===null)missing.push('horizonte da comparação');
  }else if(toolId==='financiamento-consorcio'){
    let asset=firstMoney(text,['(?:imóvel|imovel|bem|carro)(?:\\s+(?:de|vale|custa))?\\s+MONEY','MONEY\\s+(?:de imóvel|de imovel|de bem|de carro)']);
    let cash=firstMoney(text,['(?:entrada|capital disponível|capital disponivel|tenho)(?:\\s+de)?\\s+MONEY']);
    let fin=firstRate(text,[/(?:financiamento|crédito|credito).*?(\d+(?:[.,]\d+)?)%\s*(?:a\.m\.|ao mês|ao mes)/]);
    let cont=firstInt(text,[/(?:contemplação|contemplacao|contemplado).*?(\d+)\s+mes/]);
    let inv=firstRate(text,[/(?:retorno|rende|investimento).*?(\d+(?:[.,]\d+)?)%\s*(?:a\.a\.|ao ano)?/]);
    add('asset',asset,'Valor do bem',asset?BRL(asset):null);
    add('cash',cash,'Capital/entrada',cash?BRL(cash):null);
    add('finM',fin,'Taxa do financiamento',fin!==null?PCT(fin)+' a.m.':null);
    add('cont',cont,'Contemplação simulada',cont?cont+' meses':null);
    add('inv',inv,'Retorno alternativo',inv!==null?PCT(inv)+' a.a.':null);
    if(asset===null)missing.push('valor do bem');
    if(cash===null)missing.push('capital disponível/entrada');
    if(fin===null)missing.push('taxa do financiamento');
    if(inv===null)missing.push('retorno alternativo');
  }else if(toolId==='portabilidade-divida'){
    let bal=firstMoney(text,['(?:saldo|saldo devedor|dívida|divida|financiamento)(?:\\s+(?:de|é|e))?\\s+MONEY']);
    let currentRate=firstRate(text,[/(?:taxa atual|hoje pago|juros atuais).*?(\d+(?:[.,]\d+)?)%/,/(\d+(?:[.,]\d+)?)%.*?(?:taxa atual|juros atuais)/]);
    let newRate=firstRate(text,[/(?:nova taxa|ofereceram|proposta|portabilidade).*?(\d+(?:[.,]\d+)?)%/,/(\d+(?:[.,]\d+)?)%.*?(?:nova taxa|proposta|portabilidade)/]);
    let currentN=firstInt(text,[/(?:restam|faltam)\s+(\d+)\s+(?:meses|parcelas)/]);
    let newN=firstInt(text,[/(?:novo prazo|em)\s+(\d+)\s+meses.*?(?:portabilidade|proposta)?/]);
    let fee=firstMoney(text,['(?:tarifa|custo|custos|taxa de contratação)(?:\\s+de)?\\s+MONEY']);
    add('portBalance',bal,'Saldo devedor',bal?BRL(bal):null);
    add('portCurrentRate',currentRate,'Taxa atual',currentRate!==null?PCT(currentRate)+' a.m.':null);
    add('portNewRate',newRate,'Nova taxa',newRate!==null?PCT(newRate)+' a.m.':null);
    add('portCurrentN',currentN,'Prazo atual',currentN?currentN+' meses':null);
    add('portNewN',newN,'Novo prazo',newN?newN+' meses':null);
    add('portFee',fee,'Custos iniciais',fee?BRL(fee):null);
    if(bal===null)missing.push('saldo devedor');
    if(currentRate===null)missing.push('taxa atual');
    if(newRate===null)missing.push('nova taxa');
    if(currentN===null)missing.push('prazo restante');
  }else if(toolId==='trocar-carro'){
    let currentValue=firstMoney(text,['(?:meu carro vale|carro atual vale|valor do carro atual)(?:\\s+)?MONEY']);
    let newPrice=firstMoney(text,['(?:novo carro|outro carro|carro que quero)(?:\\s+(?:custa|vale|de))?\\s+MONEY']);
    let cash=firstMoney(text,['(?:tenho|capital|dinheiro disponível|dinheiro disponivel)(?:\\s+de)?\\s+MONEY']);
    let rate=firstRate(text,[/(?:financiamento|taxa).*?(\d+(?:[.,]\d+)?)%\s*(?:a\.m\.|ao mês|ao mes)?/]);
    let maint=firstMoney(text,['(?:manutenção|manutencao)(?:\\s+anual|\\s+por ano|\\s+de)?\\s+MONEY']);
    let years=firstInt(text,[/(\d+)\s+anos?\s+(?:para comparar|de horizonte|comparando)/]);
    add('carCurrentValue',currentValue,'Valor do carro atual',currentValue?BRL(currentValue):null);
    add('carNewPrice',newPrice,'Preço do novo carro',newPrice?BRL(newPrice):null);
    add('carCash',cash,'Capital adicional',cash?BRL(cash):null);
    add('carRate',rate,'Taxa do financiamento',rate!==null?PCT(rate)+' a.m.':null);
    add('carCurrentMaint',maint,'Manutenção atual',maint?BRL(maint)+'/ano':null);
    add('carYears',years,'Horizonte',years?years+' anos':null);
    if(currentValue===null)missing.push('valor do carro atual');
    if(newPrice===null)missing.push('preço do carro desejado');
    if(rate===null)missing.push('taxa do financiamento');
    if(years===null)missing.push('horizonte da comparação');
  }else if(toolId==='comparar-financiamentos'){
    let price=firstMoney(text,['(?:imóvel|imovel|bem|casa|apartamento)(?:\s+(?:de|custa|valor))?\s+MONEY','(?:valor do bem|valor do imóvel|valor do imovel)(?:\s+de)?\s+MONEY']);
    let down=firstMoney(text,['entrada(?:\s+de)?\s+MONEY']);
    let rateA=firstRate(text,[/(?:proposta a|banco a).*?(\d+(?:[.,]\d+)?)%/]);
    let rateB=firstRate(text,[/(?:proposta b|banco b).*?(\d+(?:[.,]\d+)?)%/]);
    let nA=firstInt(text,[/(?:proposta a|banco a).*?(\d+)\s+meses/]);
    let nB=firstInt(text,[/(?:proposta b|banco b).*?(\d+)\s+meses/]);
    add('cmpPrice',price,'Valor do bem',price?BRL(price):null);
    add('cmpDown',down,'Entrada',down?BRL(down):null);
    add('cmpARate',rateA,'Taxa proposta A',rateA!==null?PCT(rateA)+' a.m.':null);
    add('cmpBRate',rateB,'Taxa proposta B',rateB!==null?PCT(rateB)+' a.m.':null);
    add('cmpAN',nA,'Prazo proposta A',nA?nA+' meses':null);
    add('cmpBN',nB,'Prazo proposta B',nB?nB+' meses':null);
    if(price===null)missing.push('valor do bem');
    if(rateA===null)missing.push('taxa da proposta A');
    if(rateB===null)missing.push('taxa da proposta B');
  }else if(toolId==='imovel-na-planta'){
    let price=firstMoney(text,['(?:imóvel|imovel|apartamento)(?:\s+na planta)?(?:\s+(?:de|custa|valor))?\s+MONEY']);
    let entry=firstMoney(text,['entrada(?:\s+de)?\s+MONEY']);
    let months=firstInt(text,[/(?:entrega|obra).*?(\d+)\s+meses/,/(\d+)\s+meses.*?(?:entrega|obra)/]);
    let rent=firstMoney(text,['aluguel(?:\s+de)?\s+MONEY']);
    add('offPrice',price,'Preço contratado',price?BRL(price):null);
    add('offEntry',entry,'Entrada',entry?BRL(entry):null);
    add('offMonths',months,'Prazo até entrega',months?months+' meses':null);
    add('offRent',rent,'Aluguel durante a obra',rent?BRL(rent)+'/mês':null);
    if(price===null)missing.push('preço contratado');
    if(months===null)missing.push('prazo até a entrega');
  }else if(toolId==='bonus-decidir'){
    let amount=firstMoney(text,['(?:13º|décimo terceiro|decimo terceiro|bônus|bonus|plr|dinheiro extra)(?:\s+de|\s+no valor de)?\s+MONEY','MONEY\s+(?:de bônus|de bonus|de plr|de 13º)']);
    let debt=firstMoney(text,['(?:dívida|divida|saldo devedor)(?:\s+de)?\s+MONEY']);
    let expense=firstMoney(text,['(?:gasto essencial|custo de vida)(?:\s+de)?\s+MONEY']);
    add('windAmount',amount,'Valor recebido',amount?BRL(amount):null);
    add('windDebt',debt,'Saldo devedor',debt?BRL(debt):null);
    add('windExpense',expense,'Gasto essencial',expense?BRL(expense)+'/mês':null);
    if(amount===null)missing.push('valor recebido');
  }else if(toolId==='independencia-financeira'){
    let expense=firstMoney(text,['(?:custo de vida|gasto mensal|gastos mensais)(?:\s+de)?\s+MONEY']);
    let current=firstMoney(text,['(?:patrimônio|patrimonio|tenho investido)(?:\s+de)?\s+MONEY']);
    let pmt=firstMoney(text,['(?:aporto|invisto|guardo)(?:\s+por mês|\s+por mes|\s+mensalmente)?\s+MONEY']);
    add('fiExpenses',expense,'Custo de vida',expense?BRL(expense)+'/mês':null);
    add('fiCurrent',current,'Patrimônio atual',current?BRL(current):null);
    add('fiPmt',pmt,'Aporte mensal',pmt?BRL(pmt)+'/mês':null);
    if(expense===null)missing.push('custo de vida mensal');
    if(current===null)missing.push('patrimônio atual');
  }
  return{raw:String(raw||''),toolId,values,understood,missing};
}
function renderAskContext(ctx){
  const box=$('askContextBanner');
  if(!ctx||ctx.toolId!==state.current?.id){box.classList.add('hidden');return}
  $('askContextTitle').textContent=ctx.understood.length?'Transformei parte da sua pergunta em premissas.':'Encontrei o motor mais adequado para sua pergunta.';
  $('askUnderstood').innerHTML=ctx.understood.length?ctx.understood.map(x=>'<span><small>'+x[0]+'</small><b>'+x[1]+'</b></span>').join(''):'<span><small>ROTEAMENTO</small><b>'+state.current.title+'</b></span>';
  $('askMissing').innerHTML=ctx.missing.length?'<b>Ainda falta:</b> '+ctx.missing.join(' · ')+'<br><em>Os campos não identificados continuam com valores de exemplo. Revise-os antes de considerar o resultado.</em>':'<b>Dados principais identificados.</b> Revise as premissas antes de considerar o resultado.';
  box.classList.remove('hidden');
}
function applyPendingAsk(){
  if(!state.pendingAsk||state.pendingAsk.toolId!==state.current?.id){state.askContext=null;renderAskContext(null);return}
  state.askContext=state.pendingAsk;state.pendingAsk=null;
  setAssumptions(state.askContext.values);
  renderAskContext(state.askContext);
}
function askAmarelo(q){
  let ctx=interpretAsk(q);
  state.pendingAsk=ctx;
  openTool(ctx.toolId);
}
function planAllows(t){return t.tier==='free'||state.plan==='pro'}
function setDemoPlan(p){
  if(!['free','pro'].includes(p))return showFuturePlan(p);
  state.plan=p;storage.set('amarelo_plan',p);
  toast(p==='pro'?'PRO Beta ativado neste navegador. Nenhuma cobrança foi realizada.':'Modo Free ativado.');
  if(state.current)openCurrentTool();renderDashboard();
}
function showFuturePlan(name){toast(name+' ainda está em desenvolvimento. Não existe cobrança nem contratação ativa.');}

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

function openTool(id){state.current=tools.find(t=>t.id===id);window.dispatchEvent(new CustomEvent('amarelo:tool-open',{detail:{toolId:id}}));navigate('tool');openCurrentTool()}
function openCurrentTool(){const t=state.current;state.scenario=null;state.scenarioBusy=false;$('decisionNameInput').value='';$('decisionNameInput').placeholder='Ex.: '+t.title+' — meu caso';$('scenarioLab').classList.add('hidden');$('scenarioCompare').classList.add('hidden');$('toolTitle').textContent=t.title;$('toolDescription').textContent=t.desc;$('toolCategory').textContent=t.cat.toUpperCase();$('toolTier').textContent=t.tier==='decision'?'DECISÃO PRO':t.tier==='pro'?'PRO':'GRÁTIS';$('toolTier').className='tier '+t.tier;$('toolForm').innerHTML=buildForm(t.engine);$('methodology').textContent=method(t.engine);applyPendingAsk();state.mode='simple';setMode('simple');updateFav();state.last=null;clearResult();let allowed=planAllows(t);$('paywall').classList.toggle('hidden',allowed);$('calculator').classList.toggle('hidden',!allowed);if(allowed){calculateTool();initScenarioLab()}}
function updateFav(){$('favoriteBtn').textContent=(isFav(state.current.id)?'★':'☆')+' Favoritar'}function toggleFavoriteCurrent(){toggleFav(state.current.id);updateFav()}
function setMode(m){state.mode=m;$('simpleMode').classList.toggle('active',m==='simple');$('advancedMode').classList.toggle('active',m==='advanced');$('toolForm').classList.toggle('advanced',m==='advanced')}
function clearResult(){$('resultPrimary').textContent='Calculando...';$('resultSubtitle').textContent='';$('resultMetrics').innerHTML='';['resultInsight','breakEvenBox','sensitivityBox','chartBox','assumptionBox','driverBox'].forEach(id=>$(id).classList.add('hidden'));$('nextTools').innerHTML=''}
function F(id,label,value,adv=false){return `<div class="field ${adv?'advancedField':''}"><label>${label}<input id="${id}" type="number" step="any" value="${value}"></label></div>`}
function S(id,label,opts,adv=false){return `<div class="field ${adv?'advancedField':''}"><label>${label}<select id="${id}">${opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label></div>`}
function G(title,html){return `<div class="groupTitle">${title}</div><div class="formGrid">${html}</div>`}
function buildForm(e){
 if(e==='compound')return G('Acumulação',F('p','Capital inicial',100000)+F('pmt','Aporte mensal',1000)+F('years','Prazo (anos)',10)+F('rate','Retorno nominal anual (%)',10)+F('inflation','Inflação anual (%)',4.5,true)+F('tax','IR sobre ganhos no fim (%)',0,true));
 if(e==='fixedIncome')return G('Simulação',F('p','Capital inicial',100000)+F('pmt','Aporte mensal',1000)+F('months','Prazo (meses)',24)+F('cdi','CDI anual (%)',13.65)+F('fiInflation','Inflação anual (%)',4.5,true))+G('Produto A',S('fiAType','Tipo',[['cdi-taxed','% CDI · tributado'],['cdi-exempt','% CDI · isento'],['prefix-taxed','Prefixado · tributado'],['prefix-exempt','Prefixado · isento']])+F('fiARate','Taxa / % do CDI',110)+F('fiAFee','Custo anual (%)',0,true)+F('fiALock','Carência mínima (dias)',0,true))+G('Produto B',S('fiBType','Tipo',[['cdi-exempt','% CDI · isento'],['cdi-taxed','% CDI · tributado'],['prefix-taxed','Prefixado · tributado'],['prefix-exempt','Prefixado · isento']])+F('fiBRate','Taxa / % do CDI',92)+F('fiBFee','Custo anual (%)',0,true)+F('fiBLock','Carência mínima (dias)',90,true))+G('Produto C',S('fiCType','Tipo',[['prefix-taxed','Prefixado · tributado'],['prefix-exempt','Prefixado · isento'],['cdi-taxed','% CDI · tributado'],['cdi-exempt','% CDI · isento']])+F('fiCRate','Taxa / % do CDI',12)+F('fiCFee','Custo anual (%)',0.2,true)+F('fiCLock','Carência mínima (dias)',0,true));
 if(e==='grossup')return G('Isento',F('p','Capital',100000)+F('days','Prazo em dias',365)+F('cdi','CDI anual (%)',13.65)+F('free','LCI/LCA (% CDI)',92))+G('Comparação',F('actualCdb','CDB disponível (% CDI)',110)+F('du','Dias úteis estimados',252,true));
 if(e==='realReturn')return G('Retorno',F('nom','Retorno nominal (%)',12)+F('inf','Inflação (%)',5)+F('p','Capital',100000));
 if(e==='rateConvert')return G('Conversão',F('rate','Taxa (%)',1)+S('direction','Conversão',[['ma','Mensal → anual'],['am','Anual → mensal']]));
 if(e==='cdiConvert')return G('CDI',F('cdi','CDI anual (%)',13.65)+F('pctcdi','Percentual do CDI (%)',110));
 if(e==='exposure')return G('Exposição',F('amount','Valor na instituição',280000)+F('limit','Limite de referência',250000));
 if(e==='buyPaths')return G('Bem e caixa',F('asset','Valor do bem',600000)+F('cash','Capital disponível / entrada',150000))+G('Financiamento',S('finSystem','Sistema',[['price','Price'],['sac','SAC']])+F('finM','Taxa mensal (%)',0.85)+F('finN','Prazo (meses)',360)+F('cetAdd','Custos iniciais sobre o crédito (%)',2,true)+F('finExtra','Seguro/tarifas mensais (R$)',0,true))+G('Consórcio',F('adm','Taxa de administração total (%)',18)+F('consN','Prazo (meses)',180)+F('cont','Contemplação simulada (mês)',24)+F('bid','Lance com recursos próprios (R$)',0,true)+F('reserveFee','Fundo/seguros total (%)',2,true)+F('reaj','Reajuste anual estimado da carta (%)',4,true))+G('Enquanto espera / alternativa',F('rent','Custo mensal enquanto espera',2500)+F('inv','Retorno líquido alternativo (% a.a.)',8)+F('assetApp','Valorização do bem (% a.a.)',4,true)+F('monthlySave','Aporte mensal se esperar',3000,true));
 if(e==='buyRent')return G('Imóvel',F('asset','Valor do imóvel',700000)+F('down','Entrada',200000)+F('closing','Custos de aquisição (%)',5,true)+F('maintenance','Manutenção anual (%)',1,true)+F('propertyTax','IPTU/seguros anuais (% do imóvel)',0.6,true)+F('saleCost','Custo de saída/venda (%)',5,true)+F('app','Valorização imóvel (% a.a.)',5))+G('Crédito e moradia',S('buySystem','Sistema do financiamento',[['price','Price'],['sac','SAC']])+F('finM','Financiamento (% a.m.)',0.8)+F('finN','Prazo financiamento (meses)',360)+F('ownerExtra','Custo mensal adicional do proprietário',0,true)+F('rent','Aluguel mensal',3500)+F('rentGrow','Reajuste aluguel (% a.a.)',4,true)+F('inv','Retorno líquido investimento (% a.a.)',8)+F('years','Horizonte (anos)',10));
 if(e==='offPlan')return G('Compra na planta',F('offPrice','Preço contratado hoje',650000)+F('offEntry','Entrada hoje',100000)+F('offMonths','Meses até a entrega',36)+F('offMonthly','Parcela mensal durante a obra',3500)+F('offBalloon','Parcela na entrega',50000)+F('offIndex','Correção anual estimada da obra (%)',5,true))+G('Entrega e financiamento',S('offSystem','Sistema',[['price','Price'],['sac','SAC']])+F('offFinanceRate','Taxa financiamento na entrega (% a.m.)',0.85)+F('offFinanceN','Prazo financiamento (meses)',360))+G('Alternativa de esperar',F('offRent','Aluguel mensal enquanto espera',3500)+F('offRentGrow','Reajuste aluguel (% a.a.)',4,true)+F('offInv','Retorno líquido do capital (% a.a.)',8)+F('offApp','Valorização do imóvel/mercado (% a.a.)',5,true));
 if(e==='cashInstallment')return G('Compra',F('cashPrice','Preço à vista',9000)+F('install','Valor de cada parcela',800)+F('n','Número de parcelas',12)+F('returnM','Retorno líquido (% a.m.)',0.8)+S('timing','Primeira parcela',[['now','Hoje'],['month','Em 30 dias']],true)+F('cashback','Cashback parcelado (%)',0,true));
 if(e==='loan')return G('Financiamento',F('price','Preço',500000)+F('down','Entrada',100000)+F('rate','Taxa mensal (%)',0.9)+F('n','Prazo (meses)',360));
 if(e==='loanCompare')return G('Compra',F('cmpPrice','Valor do bem',700000)+F('cmpDown','Entrada',200000)+F('cmpHorizon','Horizonte para olhar o saldo (meses)',60)+F('cmpDiscount','Taxa alternativa para valor presente (% a.a.)',8,true))+G('Proposta A',S('cmpASystem','Sistema',[['sac','SAC'],['price','Price']])+F('cmpARate','Taxa mensal (%)',0.80)+F('cmpAN','Prazo (meses)',360)+F('cmpAUpfront','Tarifas/custos iniciais',12000)+F('cmpAMonthly','Seguros/tarifas mensais',250,true))+G('Proposta B',S('cmpBSystem','Sistema',[['sac','SAC'],['price','Price']])+F('cmpBRate','Taxa mensal (%)',0.74)+F('cmpBN','Prazo (meses)',420)+F('cmpBUpfront','Tarifas/custos iniciais',20000)+F('cmpBMonthly','Seguros/tarifas mensais',350,true));
 if(e==='carCost')return G('Carro',F('price','Preço do carro',150000)+F('years','Anos com o carro',5)+F('dep','Depreciação total (%)',35)+F('insurance','Seguro anual',4500)+F('tax','IPVA/tributos anuais',6000)+F('fuel','Combustível mensal',900)+F('maint','Manutenção anual',3000));
 if(e==='carDecision')return G('Seu carro atual',F('carCurrentValue','Valor de venda hoje',80000)+F('carCurrentDep','Depreciação anual (%)',12)+F('carCurrentMaint','Manutenção anual',6000)+F('carCurrentInsurance','Seguro anual',3500)+F('carCurrentTax','IPVA/tributos anuais',3200)+F('carCurrentFuel','Combustível mensal',1000))+G('Carro que pretende comprar',F('carNewPrice','Preço do novo carro',150000)+F('carCash','Capital adicional disponível',20000)+F('carBuyFee','Custos de compra (% do preço)',2,true)+S('carSystem','Sistema do financiamento',[['price','Price'],['sac','SAC']])+F('carRate','Taxa do financiamento (% a.m.)',1.2)+F('carN','Prazo (meses)',48)+F('carNewDep','Depreciação anual (%)',18)+F('carNewMaint','Manutenção anual',2500)+F('carNewInsurance','Seguro anual',5500)+F('carNewTax','IPVA/tributos anuais',6000)+F('carNewFuel','Combustível mensal',850))+G('Horizonte',F('carYears','Anos para comparar',5)+F('carInv','Retorno líquido do capital (% a.a.)',8));
 if(e==='amortInvest')return G('Financiamento',F('balance','Saldo devedor',450000)+S('loanSystem','Sistema',[['price','Price'],['sac','SAC']])+F('debtA','Custo efetivo anual (%)',10)+F('months','Prazo restante (meses)',240)+S('amortMode','Ao amortizar',[['term','Reduzir prazo'],['payment','Reduzir parcela']]))+G('Capital alternativo',F('cash','Valor disponível',100000)+F('invGross','Retorno bruto investimento (% a.a.)',11)+F('tax','IR efetivo sobre ganhos (%)',15,true)+F('fee','Custos anuais do investimento (%)',0,true));
 if(e==='windfallDecision')return G('Dinheiro extra',F('windAmount','13º / bônus / valor recebido',30000)+F('windExpense','Gasto essencial mensal',6000)+F('windReserve','Reserva atual',12000)+F('windReserveMonths','Meta de reserva (meses)',6))+G('Dívida',F('windDebt','Saldo devedor',80000)+S('windDebtSystem','Sistema da dívida',[['price','Price'],['sac','SAC']])+F('windDebtRate','Custo da dívida (% a.a.)',14)+F('windDebtMonths','Prazo restante (meses)',48))+G('Investimento',F('windInv','Retorno bruto (% a.a.)',11)+F('windTax','IR efetivo sobre ganhos (%)',15,true)+F('windFee','Custos anuais (%)',0,true));
 if(e==='opportunity')return G('Cenários',F('p','Capital',100000)+F('a','Cenário A (% a.a.)',10)+F('b','Cenário B (% a.a.)',8)+F('years','Anos',5));
 if(e==='presentValue')return G('Valor presente',F('fv','Valor futuro',150000)+F('rate','Taxa anual (%)',10)+F('years','Anos',5));
 if(e==='futureValue')return G('Valor futuro',F('p','Valor atual',100000)+F('rate','Taxa anual (%)',10)+F('years','Anos',5));
 if(e==='debtPlan')return G('Dívida A',F('aBal','Saldo A',4000)+F('aRate','Juros A (% a.m.)',12)+F('aMin','Mínimo A',300))+G('Dívida B',F('bBal','Saldo B',10000)+F('bRate','Juros B (% a.m.)',3)+F('bMin','Mínimo B',500))+G('Dívida C',F('cBal','Saldo C',6000,true)+F('cRate','Juros C (% a.m.)',5,true)+F('cMin','Mínimo C',300,true))+G('Orçamento',F('extra','Valor extra mensal',1000)+F('debtLump','Valor extra hoje',0)+F('debtExtraGrow','Aumento anual do extra mensal (%)',0,true));
 if(e==='debtPortability')return G('Contrato atual',F('portBalance','Saldo devedor',120000)+S('portCurrentSystem','Sistema atual',[['price','Price'],['sac','SAC']])+F('portCurrentRate','Taxa atual (% a.m.)',1.45)+F('portCurrentN','Prazo restante (meses)',48)+F('portCurrentExtra','Seguros/tarifas mensais',0,true))+G('Nova proposta',S('portNewSystem','Novo sistema',[['price','Price'],['sac','SAC']])+F('portNewRate','Nova taxa (% a.m.)',1.05)+F('portNewN','Novo prazo (meses)',48)+F('portFee','Custos iniciais da troca',1500)+F('portNewExtra','Novos custos mensais',0,true))+G('Comparação',F('portDiscount','Taxa alternativa para valor presente (% a.a.)',8,true));
 if(e==='debtSwap')return G('Dívida',F('debt','Saldo',10000)+F('r1','Taxa atual (% a.m.)',8)+F('r2','Taxa alternativa (% a.m.)',3)+F('n','Prazo (meses)',12));
 if(e==='debtGrowth')return G('Dívida',F('debt','Saldo',5000)+F('rate','Taxa (% a.m.)',10)+F('n','Meses',12));
 if(e==='reserve')return G('Reserva',F('cost','Gasto essencial mensal',6000)+F('months','Meses de segurança',6)+F('now','Reserva atual',10000)+F('pmt','Aporte mensal',1500));
 if(e==='goal')return G('Meta',F('target','Valor da meta',1000000)+F('current','Patrimônio atual',100000)+F('pmt','Aporte mensal atual',3000)+F('years','Prazo desejado (anos)',10)+F('rate','Retorno anual (%)',8)+F('inflation','Inflação anual (%)',4.5,true));
 if(e==='liveIncome')return G('Objetivo',F('capital','Patrimônio disponível',1000000)+F('income','Renda desejada mensal',10000)+F('real','Retorno real anual antes de custos (%)',4)+F('liveFee','Custos anuais (%)',0,true)+S('incomeMode','Estratégia',[['preserve','Preservar principal'],['consume','Consumir patrimônio']])+F('years','Anos de renda',30,true)+F('legacy','Legado desejado ao fim (% do patrimônio inicial)',0,true)+F('liveInflation','Inflação anual para visão nominal (%)',4.5,true));
 if(e==='financialIndependence')return G('Vida financeira',F('fiExpenses','Custo de vida mensal',10000)+F('fiCoverage','Cobertura desejada (%)',100)+F('fiCurrent','Patrimônio atual',300000)+F('fiPmt','Aporte mensal',4000))+G('Premissas',F('fiReal','Retorno real anual (%)',4)+F('fiYears','Prazo desejado (anos)',15)+F('fiExtra','Aporte extra anual',0,true));
 if(e==='retirement')return G('Acumulação',F('age','Idade atual',35)+F('ret','Idade aposentadoria',60)+F('current','Patrimônio atual',80000)+F('pmt','Aporte mensal',1500)+F('extra','Aporte extra anual',0,true)+F('real','Retorno real anual antes de custos (%)',4)+F('fee','Custos anuais (%)',0,true)+F('inflation','Inflação anual para visão nominal (%)',4.5,true))+G('Renda',F('income','Renda desejada em dinheiro de hoje',10000)+F('endAge','Idade final do plano',85));
 if(e==='pgblVgbl')return G('Comparação',F('contrib','Contribuições acumuladas',24000)+F('return','Rendimentos acumulados',12000)+F('tax','Alíquota estimada no resgate (%)',15));
 if(e==='salary')return G('Remuneração',F('gross','Salário base / bruto',8000)+F('commission','Comissão/bônus tributável',0,true)+F('overtime','Horas extras tributáveis',0,true))+G('Deduções',F('deps','Dependentes',0)+F('pension','Pensão dedutível',0,true)+F('other','Outros descontos',0)+F('vt','Vale-transporte (%)',0,true));
 if(e==='thirteenth')return G('13º',F('salary','Salário mensal',6000)+F('months','Meses trabalhados',12));
 if(e==='vacation')return G('Férias',F('salary','Salário mensal',6000)+F('days','Dias de férias',30));
 if(e==='fgtsDeposit')return G('FGTS',F('salary','Remuneração mensal',5000)+F('rate','Alíquota do depósito (%)',8)+F('months','Meses',12));
 if(e==='correction')return G('Correção',F('p','Valor original',10000)+F('index','Índice acumulado (%)',20));
 if(e==='percentage')return G('Porcentagem',F('p','Valor',10000)+F('rate','Percentual (%)',15));
 if(e==='discount')return G('Desconto',F('p','Preço original',1000)+F('rate','Desconto (%)',10));
 if(e==='spending')return G('Orçamento',F('income','Renda líquida',12000)+F('fixed','Gastos essenciais/fixos',6000)+F('saving','Meta de poupança',2000));
 if(e==='saveRate')return G('Poupança',F('income','Renda líquida',10000)+F('rate','Percentual que deseja guardar (%)',20));
 if(e==='diagnostic')return G('Diagnóstico',F('income','Renda líquida',10000)+F('ess','Essenciais',5000)+F('debt','Dívidas mensais',1500)+F('saving','Investimentos mensais',1500)+F('reserve','Reserva atual',15000));
 return ''
}
function method(e){const m={buyPaths:'Compara fluxos mensais e valor presente. Financiamento aceita Price ou SAC; contemplação do consórcio é cenário, nunca previsão. Lance, reajuste, espera e retorno alternativo são premissas editáveis.',buyRent:'Compara patrimônio líquido mês a mês. Entrada e custos de aquisição ficam investidos no cenário de aluguel; a diferença mensal de custo de moradia é investida pelo lado mais barato. Inclui manutenção, IPTU/seguros, custo de saída e Price/SAC.',amortInvest:'Compara os dois usos do mesmo capital no horizonte original do financiamento. O caixa mensal liberado pela amortização é reinvestido no cenário de amortização; SAC/Price e redução de prazo/parcela são tratados separadamente.',debtPortability:'Compara fluxos do contrato atual e da nova proposta, em valores nominais e valor presente. Custos iniciais e mensais são premissas abertas. Não considera tarifas ou condições não informadas.',loanCompare:'Compara duas propostas para o mesmo valor financiado. SAC/Price, taxa, prazo, custos iniciais e custos mensais são tratados separadamente. O valor presente usa a taxa alternativa informada pelo usuário; não substitui o CET oficial da instituição.',carDecision:'Compara trocar o veículo hoje com manter o atual. O lado com menor desembolso mensal investe a diferença; ambos acumulam valor do veículo e investimentos até o mesmo horizonte. Inclui depreciação, manutenção, seguro, tributos e combustível.',offPlan:'Compara comprar na planta com esperar até a entrega. Correção da obra, valorização de mercado, aluguel, capital investido e financiamento na entrega são premissas informadas pelo usuário; não reproduz contrato específico de incorporadora.',windfallDecision:'Compara o uso do mesmo dinheiro extra em dívida, investimento ou recomposição de reserva. A reserva é contexto de liquidez, não recomendação automática.',financialIndependence:'Calcula capital-alvo e progresso usando a taxa real informada pelo usuário. A taxa não é tratada como garantia de retirada sustentável.',liveIncome:'Projeta renda, duração do patrimônio e legado usando retorno real líquido após custos. Permite preservar principal ou consumir patrimônio no prazo informado.',fixedIncome:'Compara três alternativas configuráveis por tipo de remuneração, tributação, custo e carência. Para produtos tributados usa a tabela regressiva de renda fixa vigente em 2026 por lote de aporte. Inflação é usada para visão real; risco de crédito e garantias permanecem dimensões separadas.',grossup:'Gross-up convencional + equivalência composta em dinheiro.',retirement:'Acumulação e fase de renda são projetadas em valores reais. O motor calcula capital necessário, aporte de equilíbrio, idade aproximada de fechamento e uma visão nominal usando a inflação informada. Tributação previdenciária específica não está embutida neste motor.',salary:'INSS e IRRF usam parâmetros oficiais de 2026 revisados em 25/09/2026. Folha real pode ter regras, benefícios e descontos específicos.'};return m[e]||'Simulação matemática com premissas informadas pelo usuário.'}
function loanPay(pv,m,n){return AmareloFinance.loanPay(pv,m,n)}
function loanBalance(pv,m,n,k){return AmareloFinance.loanBalance(pv,m,n,k)}
function loanFlow(pv,m,n,system='price',monthlyExtra=0){return AmareloFinance.loanFlow(pv,m,n,system,monthlyExtra)}
function pvFlows(flows,annualRate,startMonth=1){return AmareloFinance.pvFlows(flows,annualRate,startMonth)}
function fv(p,pmt,a,n){return AmareloFinance.fv(p,pmt,a,n)}
function taxLots(P,pmt,a,N){return AmareloFinance.taxLots(P,pmt,a,N)}
function fixedIncomeProduct(name,type,rateValue,feePct,lockDays,P,pmt,N,cdi,inflation){return AmareloFinance.fixedIncomeProduct(name,type,rateValue,feePct,lockDays,P,pmt,N,cdi,inflation)}
function fixedIncomeTypeLabel(type){return({'cdi-taxed':'% CDI · tributado','cdi-exempt':'% CDI · isento','prefix-taxed':'Prefixado · tributado','prefix-exempt':'Prefixado · isento'})[type]||type}

function solveRate(fn,target,lo=-.99,hi=3){return AmareloFinance.solveRate(fn,target,lo,hi)}
function metric(a,b){return `<div class="metric"><small>${a}</small><b>${b}</b></div>`}
function renderAssumptions(){let items=[...document.querySelectorAll('#toolForm .field')].map(w=>{let el=w.querySelector('input,select'),label=w.querySelector('label');if(!el||!label)return null;let name=[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim()||el.id;let value=el.tagName==='SELECT'?(el.options[el.selectedIndex]?.text||el.value):el.value;return{name,value,advanced:w.classList.contains('advancedField')}}).filter(Boolean);if(!items.length){$('assumptionBox').classList.add('hidden');return}$('assumptionList').innerHTML=items.map(x=>`<div class="assumptionChip ${x.advanced?'advancedAssumption':''}"><small>${x.name}</small><b>${x.value}</b></div>`).join('');$('assumptionBox').classList.remove('hidden')}
function setResult(primary,subtitle,metrics=[],insight='',be=null,sens=null,series=null,label=''){state.last={primary,subtitle,metrics,insight,be,sens:sens||[],series:series||[],label};renderAssumptions();renderDecisionDrivers();recordScenarioSnapshot();$('resultPrimary').textContent=primary;$('resultSubtitle').textContent=subtitle;$('resultMetrics').innerHTML=metrics.map(x=>metric(x[0],x[1])).join('');if(insight){$('resultInsight').classList.remove('hidden');$('insightText').innerHTML=insight}else $('resultInsight').classList.add('hidden');if(be){$('breakEvenBox').classList.remove('hidden');$('breakEven').innerHTML=be}else $('breakEvenBox').classList.add('hidden');if(sens?.length){$('sensitivityBox').classList.remove('hidden');$('sensitivity').innerHTML=sens.map(x=>`<div class="sens"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}else $('sensitivityBox').classList.add('hidden');if(series?.length){$('chartBox').classList.remove('hidden');$('chartLabel').textContent=label;drawChart(series)}else $('chartBox').classList.add('hidden');renderNext()}
function drawChart(series){const w=720,h=220,pad=28,all=series.flatMap(s=>s.data.map(x=>x.y)),min=Math.min(0,...all),max=Math.max(...all,1),span=max-min||1,colors=['#f3c62e','#7ed3af','#8fb5ff','#ff9a82'],maxLen=Math.max(...series.map(s=>s.data.length)),sx=i=>pad+(w-2*pad)*(maxLen<=1?0:i/(maxLen-1)),sy=y=>h-pad-(h-2*pad)*((y-min)/span);let grid='';for(let k=0;k<5;k++){let y=pad+(h-2*pad)*k/4;grid+=`<line x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" stroke="#303029" stroke-width="1"/>`}let paths=series.map((s,si)=>`<path d="${s.data.map((p,i)=>(i?'L':'M')+sx(i)+' '+sy(p.y)).join(' ')}" fill="none" stroke="${colors[si%colors.length]}" stroke-width="3" stroke-linecap="round"/>`).join('');$('chart').innerHTML=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${grid}${paths}</svg>`;$('legend').innerHTML=series.map((s,i)=>`<span><i style="background:${colors[i%colors.length]}"></i>${s.name}</span>`).join('')}
function renderNext(){let map={'financiamento-consorcio':['comparar-financiamentos','comprar-alugar'],'comparar-financiamentos':['financiamento-consorcio','amortizar-investir'],'comprar-alugar':['financiamento-consorcio','amortizar-investir'],'amortizar-investir':['renda-fixa','portabilidade-divida'],'portabilidade-divida':['plano-dividas','amortizar-investir'],'trocar-carro':['custo-carro','avista-parcelado'],'renda-fixa':['gross-up','meta-financeira'],'gross-up':['renda-fixa'],'aposentadoria':['viver-renda','meta-financeira'],'reserva':['quanto-rende'],'salario-liquido':['reserva','quanto-guardar']};let ids=map[state.current.id]||[];$('nextTools').innerHTML=ids.length?'<h4>Próximas análises relacionadas</h4>'+ids.map(id=>{let t=tools.find(x=>x.id===id);return t?`<button onclick="openTool('${id}')">${t.title} →</button>`:''}).join(''):''}
function calculateTool(){if(state.scenario&&!state.scenarioBusy)persistActiveScenario();const e=state.current.engine;try{
 if(e==='compound'){let P=num('p'),pmt=num('pmt'),years=num('years'),r=num('rate')/100,inf=num('inflation')/100,tax=num('tax')/100,N=years*12,gross=fv(P,pmt,r,N),invested=P+pmt*N,gain=gross-invested,net=gross-gain*tax,real=net/Math.pow(1+inf,years);let sens=[Math.max(0,r-.02),r,r+.02].map(rr=>[PCT(rr*100)+' a.a.',BRL(fv(P,pmt,rr,N))]),series=[],b=P,mi=monthly(r);for(let m=1;m<=N;m++){b=b*(1+mi)+pmt;if(m%12===0)series.push({y:b})}setResult(BRL(net),'Patrimônio líquido nominal estimado.',[['Total aportado',BRL(invested)],['Ganho líquido',BRL(net-invested)],['Em dinheiro de hoje',BRL(real)]],`Tempo e aportes são os grandes motores. A inflação reduz o poder de compra do valor nominal.`,`Para preservar poder de compra, o retorno precisa superar <b>${PCT(inf*100)}</b> antes de custos e impostos.`,sens,[{name:'Patrimônio',data:series}],'saldo')}
 else if(e==='fixedIncome'){
  let P=Math.max(0,num('p')),pmt=Math.max(0,num('pmt')),N=Math.max(1,Math.round(num('months'))),cdi=Math.max(-.99,num('cdi')/100),infl=Math.max(-.99,num('fiInflation')/100);
  function product(prefix,name,cdiOverride=cdi,rateOverride=null){
    return fixedIncomeProduct(name,$(prefix+'Type').value,rateOverride===null?num(prefix+'Rate'):rateOverride,num(prefix+'Fee'),Math.max(0,num(prefix+'Lock')),P,pmt,N,cdiOverride,infl);
  }
  let products=[product('fiA','Produto A'),product('fiB','Produto B'),product('fiC','Produto C')],eligible=products.filter(x=>x.eligible),rank=(eligible.length?eligible:products).slice().sort((a,b)=>b.net-a.net),winner=rank[0],second=rank[1]||rank[0],lead=winner.net-second.net;
  function netAt(prefix,name,rate){return product(prefix,name,cdi,rate).net}
  let secondPrefix=second.name==='Produto A'?'fiA':second.name==='Produto B'?'fiB':'fiC',unit=second.cdiBased?'% do CDI':'% a.a.',lo=0,hi=second.cdiBased?400:100,breakRate=null,target=winner.net,flo=netAt(secondPrefix,second.name,lo)-target,fhi=netAt(secondPrefix,second.name,hi)-target;
  if(flo*fhi<=0){for(let i=0;i<70;i++){let mid=(lo+hi)/2,fm=netAt(secondPrefix,second.name,mid)-target;if(flo*fm<=0){hi=mid;fhi=fm}else{lo=mid;flo=fm}}breakRate=(lo+hi)/2}
  let invested=P+pmt*N;
  let sens=[Math.max(0,cdi-.02),cdi,cdi+.02].map(rr=>{let ps=[fixedIncomeProduct('A',$('fiAType').value,num('fiARate'),num('fiAFee'),num('fiALock'),P,pmt,N,rr,infl),fixedIncomeProduct('B',$('fiBType').value,num('fiBRate'),num('fiBFee'),num('fiBLock'),P,pmt,N,rr,infl),fixedIncomeProduct('C',$('fiCType').value,num('fiCRate'),num('fiCFee'),num('fiCLock'),P,pmt,N,rr,infl)].filter(x=>x.eligible);let w=(ps.length?ps:products).sort((a,b)=>b.net-a.net)[0];return[PCT(rr*100)+' CDI',w.name+' · '+BRL(w.net)]});
  function curve(prefix,name){let arr=[];for(let m=1;m<=N;m++){let pr=fixedIncomeProduct(name,$(prefix+'Type').value,num(prefix+'Rate'),num(prefix+'Fee'),num(prefix+'Lock'),P,pmt,m,cdi,infl);arr.push({y:pr.net})}return arr}
  let ineligible=products.filter(x=>!x.eligible);
  let insight=`O ranking principal usa <b>valor líquido em dinheiro</b> no prazo informado. Tipo de remuneração, imposto, custo anual e carência são tratados separadamente. ${ineligible.length?'Atenção: '+ineligible.map(x=>x.name).join(', ')+' não cumpre a carência no prazo informado e fica fora do ranking principal.':'Todos os produtos cumprem a carência informada.'}`;
  let be=breakRate!==null?`${second.name} precisa de aproximadamente <b>${PCT(breakRate)} ${unit}</b> para alcançar o valor líquido de ${winner.name}, mantendo as demais premissas.`:'Não apareceu ponto de equilíbrio da segunda colocada dentro do intervalo de taxa testado.';
  let metrics=[['Total aportado',BRL(invested)],...products.flatMap(x=>[[x.name+' · líquido',BRL(x.net)],[x.name+' · ganho',BRL(x.gain)],[x.name+' · real',BRL(x.real)],[x.name+' · imposto',BRL(x.tax)]]).slice(0,12)];
  setResult(winner.name,`Maior valor líquido estimado${lead>0?' por '+BRL(lead):''} no horizonte informado.`,metrics,insight,be,sens,[{name:'Produto A',data:curve('fiA','A')},{name:'Produto B',data:curve('fiB','B')},{name:'Produto C',data:curve('fiC','C')}],'valor líquido');
 }
 else if(e==='grossup'){let P=num('p'),days=num('days'),cdi=num('cdi')/100,free=num('free')/100,actual=num('actualCdb')/100,du=num('du'),tax=irDays(days),simple=free/(1-tax),daily=Math.pow(1+cdi,1/252)-1,ff=Math.pow(1+daily*free,du),freeFV=P*ff,req=1+(ff-1)/(1-tax),exact=(Math.pow(req,1/du)-1)/daily,cg=P*Math.pow(1+daily*actual,du),cn=P+(cg-P)*(1-tax),diff=cn-freeFV,sens=[free-.05,free,free+.05].map(x=>[PCT(x*100)+' CDI isento',PCT(x/(1-tax)*100)+' CDI trib.']);setResult(PCT(simple*100)+' do CDI','Gross-up convencional da taxa.',[['Equivalente composto',PCT(exact*100)+' CDI'],['Isento líquido',BRL(freeFV)],['CDB informado',BRL(cn)]],diff>=0?`O CDB informado supera o isento em ${BRL(diff)} líquidos.`:`O isento supera o CDB informado em ${BRL(-diff)} líquidos.`,`Para empatar em dinheiro, o CDB precisa de aproximadamente <b>${PCT(exact*100)} do CDI</b>.`,sens)}
 else if(e==='realReturn'){let r=(1+num('nom')/100)/(1+num('inf')/100)-1;setResult(PCT(r*100),'Rentabilidade real.',[['Ganho real',BRL(num('p')*r)],['Inflação',PCT(num('inf'))]])}
 else if(e==='rateConvert'){let r=num('rate')/100,out=$('direction').value==='ma'?Math.pow(1+r,12)-1:Math.pow(1+r,1/12)-1;setResult(PCT(out*100),'Taxa efetiva equivalente.')}
 else if(e==='cdiConvert'){setResult(PCT(num('cdi')*num('pctcdi')/100),'Aproximação anual sobre o CDI informado.')}
 else if(e==='exposure'){let a=num('amount'),l=num('limit');setResult(BRL(a),'Exposição total.',[['Dentro do limite',BRL(Math.min(a,l))],['Acima do limite',BRL(Math.max(0,a-l))]])}
 else if(e==='buyPaths'){
  let asset=num('asset'),cash=Math.min(num('cash'),num('asset')),fm=num('finM')/100,N=Math.max(1,Math.round(num('finN'))),system=$('finSystem').value,cet=num('cetAdd')/100,finExtra=num('finExtra'),adm=num('adm')/100,consN=Math.max(1,Math.round(num('consN'))),cont=Math.max(1,Math.min(consN,Math.round(num('cont')))),bid=Math.min(cash,Math.max(0,num('bid'))),reserve=num('reserveFee')/100,reaj=num('reaj')/100,rent=num('rent'),inv=num('inv')/100,app=num('assetApp')/100,pmtSave=num('monthlySave');
  let credit=Math.max(0,asset-cash),upfront=credit*cet,lf=loanFlow(credit,fm,N,system,finExtra),finNominal=cash+upfront+lf.total,finEconomic=cash+upfront+pvFlows(lf.flows,inv);
  function consortium(cm){
    let baseContract=asset*(1+adm+reserve),basePmt=baseContract/consN,offset=0,total=0,pv=0,flows=[],cum=0,dm=monthly(inv);
    for(let m=1;m<=consN;m++){
      let idx=Math.pow(1+reaj,Math.floor((m-1)/12)),scheduled=basePmt*idx,extra=0;
      if(m===cm)extra=Math.min(bid,Math.max(0,baseContract));
      let reduction=m>cm?Math.min(offset,scheduled):0,paid=Math.max(0,scheduled-reduction);offset-=reduction;
      if(m===cm)offset+=extra;
      let waitCost=m<cm?rent:0;
      let cashOut=paid+extra+waitCost;
      total+=cashOut;pv+=cashOut/Math.pow(1+dm,m);cum+=cashOut;flows.push({y:cum});
    }
    return{total,pv,flows,baseContract};
  }
  let cons=consortium(cont),b=cash,mi=monthly(inv),ai=monthly(app),assetFuture=asset,m=0,investCurve=[];
  while(b<assetFuture&&m<1200){m++;b=b*(1+mi)+pmtSave;assetFuture*=1+ai;investCurve.push({y:b})}
  let maxH=Math.max(N,consN),finCurve=[],fc=cash+upfront;
  for(let k=0;k<maxH;k++){if(k<N)fc+=lf.flows[k];finCurve.push({y:fc})}
  let cross=null;for(let cm=1;cm<=consN;cm++){if(consortium(cm).pv>=finEconomic){cross=cm;break}}
  let sens=[Math.min(12,consN),Math.min(24,consN),Math.min(36,consN)].filter((v,i,a)=>a.indexOf(v)===i).map(cm=>[`Contemplação mês ${cm}`,BRL(consortium(cm).pv)+' VP']);
  let firstLabel=system==='sac'?'1ª parcela SAC':'Parcela Price';
  let insight=`O financiamento compra o bem agora e concentra custo no crédito. O consórcio troca parte desse custo por incerteza de tempo e reajuste. Investir preserva flexibilidade, mas o preço do bem pode avançar enquanto o capital cresce. Nesta conta, o retorno alternativo de <b>${PCT(inv*100)} a.a.</b> também é usado para trazer os fluxos a valor presente.`;
  let be=cross?`Com estas premissas, o valor presente do consórcio alcança o do financiamento quando a contemplação ocorre por volta do <b>mês ${cross}</b>. Antes/depois disso, custo de espera e timing dos pagamentos alteram a relação.`:`Mesmo levando a contemplação até o fim do plano, o valor presente estimado do consórcio não alcançou o do financiamento neste conjunto de premissas.`;
  setResult('Compare custo + tempo','Nenhum caminho é resumido por uma única taxa.',[[firstLabel,BRL(lf.first)],['Financiamento · VP',BRL(finEconomic)],['Consórcio · VP',BRL(cons.pv)],['Financiamento nominal',BRL(finNominal)],['Consórcio nominal',BRL(cons.total)],['Investir até comprar',m>=1200?'100+ anos':(m/12).toFixed(1)+' anos']],insight,be,sens,[{name:'Financiamento · desembolso',data:finCurve},{name:'Consórcio · desembolso',data:cons.flows}],'desembolso acumulado');
 }
 else if(e==='buyRent'){
  let asset=num('asset'),down=Math.min(num('down'),num('asset')),closing=num('closing')/100,maint=num('maintenance')/100,propertyTax=num('propertyTax')/100,saleCost=num('saleCost')/100,app=num('app')/100,fm=num('finM')/100,N=Math.max(1,Math.round(num('finN'))),system=$('buySystem').value,ownerExtra=num('ownerExtra'),rent0=num('rent'),rg=num('rentGrow')/100,inv=num('inv')/100,years=Math.max(1,num('years')),H=Math.max(1,Math.round(years*12)),credit=Math.max(0,asset-down),loan=loanFlow(credit,fm,N,system,0);
  function sim(appr){
    let renterInv=down+asset*closing,buyerInv=0,ri=monthly(inv),ag=monthly(appr),rgi=monthly(rg),home=asset,rent=rent0,debt=credit,buy=[],ren=[];
    for(let month=1;month<=H;month++){
      renterInv*=1+ri;buyerInv*=1+ri;home*=1+ag;rent*=1+rgi;
      let mortgage=month<=N?(loan.flows[month-1]||0):0;
      if(month<=N&&debt>0){let j=debt*fm,a=Math.max(0,mortgage-j);debt=Math.max(0,debt-a)}
      let ownerRecurring=home*(maint+propertyTax)/12+ownerExtra,ownerCost=mortgage+ownerRecurring,rentCost=rent,diff=ownerCost-rentCost;
      if(diff>0)renterInv+=diff;else buyerInv+=-diff;
      let buyerWealth=home-debt-home*saleCost+buyerInv;
      buy.push({y:buyerWealth});ren.push({y:renterInv});
    }
    return{buyer:buy.at(-1).y,renter:renterInv,buy,ren,debt,first:loan.first};
  }
  let base=sim(app),diff=base.buyer-base.renter,root=solveRate(r=>sim(r).buyer-sim(r).renter,0,-.2,.3),rootValid=Math.abs((sim(root).buyer-sim(root).renter))<Math.max(10,asset*.001),sens=[Math.max(-.15,app-.02),app,app+.02].map(r=>{let s=sim(r),d=s.buyer-s.renter;return[PCT(r*100)+' valorização',(`${d>=0?'+':'-'} ${BRL(Math.abs(d))}`) ]});
  let insight=`A comparação considera o capital da entrada e dos custos de aquisição investido no cenário de aluguel. A cada mês, quem tiver o menor custo de moradia investe a diferença. No imóvel próprio entram manutenção, IPTU/seguros, custo adicional informado e custo de saída.`;
  let be=rootValid?`O patrimônio dos dois caminhos fica próximo do empate com valorização do imóvel perto de <b>${PCT(root*100)} ao ano</b>, mantendo as demais premissas.`:'Não apareceu um ponto de equilíbrio estável no intervalo testado de -20% a 30% a.a. de valorização.';
  setResult(BRL(Math.abs(diff)),'Diferença de patrimônio líquido ao fim do horizonte.',[['Comprar',BRL(base.buyer)],['Alugar + investir',BRL(base.renter)],['Lado da diferença',diff>=0?'Comprar':'Alugar + investir'],['1ª parcela',BRL(base.first)],['Custos de aquisição',BRL(asset*closing)],['Saldo devedor final',BRL(base.debt)]],insight,be,sens,[{name:'Comprar',data:base.buy},{name:'Alugar + investir',data:base.ren}],'patrimônio líquido');
 }
 else if(e==='offPlan'){
  let price=Math.max(0,num('offPrice')),entry=Math.min(price,Math.max(0,num('offEntry'))),months=Math.max(1,Math.round(num('offMonths'))),monthlyPay=Math.max(0,num('offMonthly')),balloon=Math.max(0,num('offBalloon')),idx=Math.max(-.99,num('offIndex')/100),system=$('offSystem').value,finRate=Math.max(0,num('offFinanceRate')/100),finN=Math.max(1,Math.round(num('offFinanceN'))),rent0=Math.max(0,num('offRent')),rentGrow=Math.max(-.99,num('offRentGrow')/100),inv=Math.max(-.99,num('offInv')/100),app=Math.max(-.99,num('offApp')/100);
  let idxM=monthly(idx),invM=monthly(inv),rentM=monthly(rentGrow),marketM=monthly(app),correctedPrice=price*Math.pow(1+idxM,months),rent=rent0,paid=entry,buyCashCurve=[{y:entry}],waitCapital=entry,waitCurve=[{y:waitCapital}],cumRent=0;
  for(let m=1;m<=months;m++){
    let installment=monthlyPay*Math.pow(1+idxM,m),r=rent*Math.pow(1+rentM,m-1);
    paid+=installment;cumRent+=r;buyCashCurve.push({y:paid+cumRent});
    waitCapital=waitCapital*(1+invM)+monthlyPay;waitCurve.push({y:waitCapital});
  }
  let correctedBalloon=balloon*Math.pow(1+idxM,months),financeBalance=Math.max(0,correctedPrice-paid-correctedBalloon),loan=loanFlow(financeBalance,finRate,finN,system,0),buyNominal=paid+correctedBalloon+cumRent+loan.total;
  let projectedMarket=price*Math.pow(1+marketM,months),waitAvailable=waitCapital,waitGap=Math.max(0,projectedMarket-waitAvailable),waitSurplus=Math.max(0,waitAvailable-projectedMarket);
  let invPV=entry;for(let m=1;m<=months;m++)invPV=invPV*(1+invM)+monthlyPay;
  let indexBreak=null,lo=-.5,hi=.5;
  function balanceAtIndex(rate){let im=monthly(rate),cp=price*Math.pow(1+im,months),p=entry;for(let m=1;m<=months;m++)p+=monthlyPay*Math.pow(1+im,m);let b=balloon*Math.pow(1+im,months);return Math.max(0,cp-p-b)}
  let target=Math.max(0,projectedMarket-waitAvailable);
  let flo=balanceAtIndex(lo)-target,fhi=balanceAtIndex(hi)-target;
  if(flo*fhi<=0){for(let i=0;i<70;i++){let mid=(lo+hi)/2,fm=balanceAtIndex(mid)-target;if(flo*fm<=0){hi=mid;fhi=fm}else{lo=mid;flo=fm}}indexBreak=(lo+hi)/2}
  let sens=[Math.max(-.1,idx-.02),idx,idx+.02].map(r=>[PCT(r*100)+' correção',BRL(balanceAtIndex(r))+' saldo na entrega']);
  let insight=`Na compra na planta, o principal risco matemático não é apenas a parcela mensal: é o <b>saldo que chega à entrega</b> depois da correção. No caminho de esperar, o capital permanece investido, mas o preço de mercado também pode mudar.`;
  let be=indexBreak!==null?`Com as demais premissas mantidas, uma correção de obra próxima de <b>${PCT(indexBreak*100)} ao ano</b> faria o saldo financiado na entrega ficar próximo do gap estimado de quem espera e compra no mercado.`:'Não apareceu um ponto de equilíbrio de correção no intervalo testado de -50% a 50% a.a.';
  setResult(BRL(financeBalance),'Saldo estimado para financiar na entrega.',[['Preço corrigido estimado',BRL(correctedPrice)],['Pago durante a obra',BRL(paid)],['Parcela na entrega corrigida',BRL(correctedBalloon)],['Aluguel até a entrega',BRL(cumRent)],['Valor de mercado projetado',BRL(projectedMarket)],['Capital de quem espera',BRL(waitAvailable)],['Gap de quem espera',BRL(waitGap)],['Custo nominal compra na planta',BRL(buyNominal)]],insight,be,sens,[{name:'Desembolso compra na planta',data:buyCashCurve},{name:'Capital se esperar',data:waitCurve}],'até a entrega');
 }
 else if(e==='cashInstallment'){let cash=num('cashPrice'),inst=num('install'),N=num('n'),r=num('returnM')/100,cb=num('cashback')/100,now=$('timing').value==='now',pv=0;for(let k=0;k<N;k++){let t=now?k:k+1;pv+=inst/Math.pow(1+r,t)}pv-=inst*N*cb;let nominal=inst*N*(1-cb),be=solveRate(rr=>{let x=0;for(let k=0;k<N;k++){let t=now?k:k+1;x+=inst/Math.pow(1+rr,t)}return x-inst*N*cb},cash,0,.2);setResult(pv>cash?'À vista':'Parcelado','Menor custo por valor presente.',[['À vista',BRL(cash)],['Parcelado nominal',BRL(nominal)],['Valor presente',BRL(pv)]],`A soma nominal não basta. O valor presente desconta cada parcela pelo retorno do dinheiro.`,`O empate acontece perto de <b>${PCT(be*100)} ao mês</b> de retorno líquido.`)}
 else if(e==='loan'){let pv=Math.max(0,num('price')-num('down')),i=num('rate')/100,N=num('n'),p=loanPay(pv,i,N),tot=p*N;setResult(BRL(p),'Parcela estimada.',[['Financiado',BRL(pv)],['Total parcelas',BRL(tot)],['Juros',BRL(tot-pv)]])}
 else if(e==='loanCompare'){
  let price=Math.max(0,num('cmpPrice')),down=Math.min(price,Math.max(0,num('cmpDown'))),credit=Math.max(0,price-down),H=Math.max(1,Math.round(num('cmpHorizon'))),disc=Math.max(-.99,num('cmpDiscount')/100);
  function proposal(prefix,rateOverride=null){
    let system=$(prefix+'System').value,rate=(rateOverride===null?num(prefix+'Rate'):rateOverride)/100,N=Math.max(1,Math.round(num(prefix+'N'))),upfront=Math.max(0,num(prefix+'Upfront')),monthlyExtra=Math.max(0,num(prefix+'Monthly')),base=loanFlow(credit,rate,N,system,0),flows=base.flows.map(x=>x+monthlyExtra),pv=upfront+pvFlows(flows,disc),total=upfront+flows.reduce((s,x)=>s+x,0),h=Math.min(H,N),balance=credit,cum=upfront,curve=[],balanceAtH=credit;
    let amortSac=N?credit/N:0;
    for(let m=1;m<=N;m++){
      let contractual=base.flows[m-1]||0,j=balance*rate,a=system==='sac'?Math.min(amortSac,balance):Math.max(0,contractual-j);
      balance=Math.max(0,balance-a);cum+=flows[m-1]||0;curve.push({y:cum});if(m===h)balanceAtH=balance;
    }
    return{system,rate,N,upfront,monthlyExtra,base,flows,pv,total,curve,balanceAtH,cashAtH:upfront+flows.slice(0,h).reduce((s,x)=>s+x,0)};
  }
  let A=proposal('cmpA'),B=proposal('cmpB'),winner=A.pv<=B.pv?'Proposta A':'Proposta B',diff=Math.abs(A.pv-B.pv),target=A.pv,lo=0,hi=5,breakB=null,flo=proposal('cmpB',lo).pv-target,fhi=proposal('cmpB',hi).pv-target;
  if(flo*fhi<=0){for(let i=0;i<70;i++){let mid=(lo+hi)/2,fm=proposal('cmpB',mid).pv-target;if(flo*fm<=0){hi=mid;fhi=fm}else{lo=mid;flo=fm}}breakB=(lo+hi)/2}
  let sens=[Math.max(0,num('cmpBRate')-.1),num('cmpBRate'),num('cmpBRate')+.1].map(r=>{let b=proposal('cmpB',r),d=b.pv-A.pv;return[PCT(r)+' a.m. proposta B',(d<=0?'B - ':'B + ')+BRL(Math.abs(d))+' VP']});
  let insight=`Taxa menor não garante menor custo quando prazo, seguros e tarifas mudam. O comparador olha o fluxo completo e também mostra o saldo devedor que permanece no horizonte escolhido.`;
  let be=breakB!==null?`Mantidas as demais condições da Proposta B, uma taxa perto de <b>${PCT(breakB)} a.m.</b> faria seu valor presente empatar com a Proposta A.`:'Não apareceu uma taxa de equilíbrio da Proposta B entre 0% e 5% a.m. com as condições atuais.';
  setResult(winner,'Menor valor presente estimado dos desembolsos.',[['Valor financiado',BRL(credit)],['A · 1ª parcela',BRL(A.flows[0]||0)],['B · 1ª parcela',BRL(B.flows[0]||0)],['A · valor presente',BRL(A.pv)],['B · valor presente',BRL(B.pv)],['A · total nominal',BRL(A.total)],['B · total nominal',BRL(B.total)],['A · saldo no horizonte',BRL(A.balanceAtH)],['B · saldo no horizonte',BRL(B.balanceAtH)],['A · caixa pago no horizonte',BRL(A.cashAtH)],['B · caixa pago no horizonte',BRL(B.cashAtH)]],insight,be,sens,[{name:'Proposta A · desembolso',data:A.curve},{name:'Proposta B · desembolso',data:B.curve}],'desembolso acumulado');
 }
 else if(e==='carCost'){let p=num('price'),y=num('years'),dep=p*num('dep')/100,rec=num('insurance')*y+num('tax')*y+num('fuel')*12*y+num('maint')*y,total=dep+rec;setResult(BRL(total),'Custo de uso + perda de valor.',[['Depreciação',BRL(dep)],['Custos recorrentes',BRL(rec)],['Média mensal',BRL(total/(12*y))]])}
 else if(e==='amortInvest'){
  let bal=num('balance'),da=num('debtA')/100,N=Math.max(1,Math.round(num('months'))),cash=Math.min(num('cash'),bal),ig=num('invGross')/100,tax=Math.max(0,Math.min(.999,num('tax')/100)),fee=num('fee')/100,system=$('loanSystem').value,mode=$('amortMode').value,m=monthly(da),newBal=Math.max(0,bal-cash);
  let base=loanFlow(bal,m,N,system,0),after;
  if(mode==='payment'){
    after=loanFlow(newBal,m,N,system,0);
  }else if(system==='sac'){
    let baseAmort=bal/N,b=newBal,flows=[],interest=0,k=0;
    while(b>.01&&k<N){let j=b*m,a=Math.min(baseAmort,b),p=a+j;b=Math.max(0,b-a);interest+=j;flows.push(p);k++}
    after={flows,interest,first:flows[0]||0,last:flows.at(-1)||0,total:flows.reduce((s,x)=>s+x,0)};
  }else{
    let target=base.first,b=newBal,flows=[],interest=0,k=0;
    while(b>.01&&k<N){let j=b*m,p=Math.min(target,b+j),a=Math.max(0,p-j);b=Math.max(0,b-a);interest+=j;flows.push(p);k++;if(a<=0)break}
    after={flows,interest,first:flows[0]||0,last:flows.at(-1)||0,total:flows.reduce((s,x)=>s+x,0)};
  }
  let savings=Array.from({length:N},(_,i)=>(base.flows[i]||0)-(after.flows[i]||0));
  function investEnd(rate){let net=Math.max(-.99,rate-fee),gross=cash*Math.pow(1+net,N/12);return cash+(gross-cash)*(1-tax)}
  function amortEnd(rate){let net=Math.max(-.99,rate-fee),mi=monthly(net);return savings.reduce((sum,s,k)=>{if(Math.abs(s)<.0001)return sum;let months=N-k-1,gross=s*Math.pow(1+mi,months),netValue=s+(gross-s)*(1-tax);return sum+netValue},0)}
  function solveZero(fn,lo=0,hi=1.5){let a=fn(lo),b=fn(hi);if(!Number.isFinite(a)||!Number.isFinite(b)||a*b>0)return null;for(let i=0;i<70;i++){let mid=(lo+hi)/2,v=fn(mid);if(Math.abs(v)<1e-8)return mid;if(a*v<=0){hi=mid;b=v}else{lo=mid;a=v}}return(lo+hi)/2}
  let invEnd=investEnd(ig),amEnd=amortEnd(ig),diff=invEnd-amEnd,interestSaved=Math.max(0,base.interest-after.interest),be=solveZero(r=>investEnd(r)-amortEnd(r),0,1.5);
  function balCurve(principal,flows){let b=principal,out=[];for(let p of flows){let j=b*m,a=Math.max(0,p-j);b=Math.max(0,b-a);out.push({y:b})}return out}
  let sens=[Math.max(0,ig-.02),ig,ig+.02].map(r=>{let d=investEnd(r)-amortEnd(r);return[PCT(r*100)+' bruto',(`${d>=0?'+':'-'} ${BRL(Math.abs(d))}`) ]});
  let modeMetric=mode==='term'?['Novo prazo',after.flows.length+' meses']:['Nova 1ª parcela',BRL(after.first)];
  let insight=diff>0?`Neste cenário, manter o capital investido termina o prazo original com cerca de <b>${BRL(diff)}</b> a mais do que amortizar e reinvestir o caixa liberado.`:`Neste cenário, amortizar e reinvestir o caixa mensal liberado termina o prazo original com cerca de <b>${BRL(-diff)}</b> a mais do que manter o capital investido.`;
  let beText=be===null?'Não apareceu um ponto de equilíbrio entre 0% e 150% a.a. nas premissas atuais.':`O retorno bruto aproximado que empata os dois caminhos é <b>${PCT(be*100)} ao ano</b>, considerando os custos e o IR efetivo informados.`;
  setResult(diff>0?'Investir ganha espaço':'Amortizar ganha espaço','Comparação no mesmo horizonte do financiamento original.',[['Investir · valor líquido final',BRL(invEnd)],['Amortizar · caixa liberado reinvestido',BRL(amEnd)],['Juros evitados',BRL(interestSaved)],modeMetric,['Parcela atual / 1ª',BRL(base.first)],['Capital usado',BRL(cash)]],insight,beText,sens,[{name:'Saldo sem amortização',data:balCurve(bal,base.flows)},{name:'Saldo após amortização',data:balCurve(newBal,after.flows)}],'saldo devedor');
 }
 else if(e==='windfallDecision'){
  let amount=Math.max(0,num('windAmount')),expense=Math.max(0,num('windExpense')),reserve=Math.max(0,num('windReserve')),reserveMonths=Math.max(0,num('windReserveMonths')),debt=Math.max(0,num('windDebt')),system=$('windDebtSystem').value,debtRate=Math.max(-.99,num('windDebtRate')/100),N=Math.max(1,Math.round(num('windDebtMonths'))),inv=Math.max(-.99,num('windInv')/100),tax=Math.max(0,Math.min(.999,num('windTax')/100)),fee=Math.max(0,num('windFee')/100),reserveTarget=expense*reserveMonths,reserveGap=Math.max(0,reserveTarget-reserve);
  let usedDebt=Math.min(amount,debt),debtMi=monthly(debtRate),currentLoan=loanFlow(debt,debtMi,N,system,0),reducedLoan=loanFlow(Math.max(0,debt-usedDebt),debtMi,N,system,0),debtBenefit=Math.max(0,currentLoan.total-(usedDebt+reducedLoan.total));
  let netRate=Math.max(-.99,inv-fee),gross=amount*Math.pow(1+netRate,N/12),investEnd=amount+(gross-amount)*(1-tax),investGain=investEnd-amount;
  let toReserve=Math.min(amount,reserveGap),reserveAfter=reserve+toReserve,reserveCoverage=expense?reserveAfter/expense:0,remainingAfterReserve=Math.max(0,amount-toReserve);
  let diff=investGain-debtBenefit,sens=[Math.max(0,inv-.02),inv,inv+.02].map(r=>{let g=amount*Math.pow(1+Math.max(-.99,r-fee),N/12),net=amount+(g-amount)*(1-tax);return[PCT(r*100)+' bruto',BRL(net-amount)+' ganho líquido']});
  let insight=`Os três destinos resolvem problemas diferentes: dívida reduz juros futuros de um fluxo contratado, investimento busca retorno futuro e reserva aumenta liquidez. O AMARELO mantém essas dimensões separadas.`;
  let be=`No horizonte da dívida, a economia estimada de juros ao usar <b>${BRL(usedDebt)}</b> no saldo é <b>${BRL(debtBenefit)}</b>. O ganho líquido estimado do investimento é <b>${BRL(investGain)}</b>. A diferença é de <b>${BRL(Math.abs(diff))}</b> a favor de ${diff>=0?'investir':'reduzir a dívida'} no modelo. A reserva ainda possui gap de <b>${BRL(reserveGap)}</b> antes deste valor.`;
  setResult('3 destinos','Compare juros evitados, retorno potencial e liquidez.',[['Juros evitados na dívida',BRL(debtBenefit)],['Nova 1ª parcela após redução',BRL(reducedLoan.first)],['Ganho líquido investindo',BRL(investGain)],['Reserva-alvo',BRL(reserveTarget)],['Reserva após alocação',BRL(reserveAfter)],['Cobertura da reserva',reserveCoverage.toFixed(1).replace('.',',')+' meses'],['Sobra após completar reserva',BRL(remainingAfterReserve)]],insight,be,sens);
 }
 else if(e==='opportunity'){let P=num('p'),y=num('years'),A=P*Math.pow(1+num('a')/100,y),B=P*Math.pow(1+num('b')/100,y);setResult(BRL(Math.abs(A-B)),'Custo de oportunidade.',[['Cenário A',BRL(A)],['Cenário B',BRL(B)]])}
 else if(e==='presentValue')setResult(BRL(num('fv')/Math.pow(1+num('rate')/100,num('years'))),'Valor presente estimado.')
 else if(e==='futureValue')setResult(BRL(num('p')*Math.pow(1+num('rate')/100,num('years'))),'Valor futuro estimado.')
 else if(e==='debtPlan'){
  let base=[{name:'A',bal:num('aBal'),rate:num('aRate')/100,min:num('aMin')},{name:'B',bal:num('bBal'),rate:num('bRate')/100,min:num('bMin')},{name:'C',bal:num('cBal'),rate:num('cRate')/100,min:num('cMin')}].filter(d=>d.bal>0),extra=Math.max(0,num('extra')),lump=Math.max(0,num('debtLump')),grow=Math.max(-.99,num('debtExtraGrow')/100);
  function sim(strategy,useExtra=true){let ds=base.map(d=>({...d})),month=0,interest=0,curve=[],events=[],l=useExtra?lump:0;if(l>0){let ord=[...ds].sort(strategy==='avalanche'?(a,b)=>b.rate-a.rate:(a,b)=>a.bal-b.bal);for(let d of ord){let x=Math.min(d.bal,l);d.bal-=x;l-=x;if(l<=0)break}}
    while(ds.some(d=>d.bal>.01)&&month<600){month++;for(let d of ds){if(d.bal>0){let j=d.bal*d.rate;d.bal+=j;interest+=j}}
      let year=Math.floor((month-1)/12),extraNow=useExtra?extra*Math.pow(1+grow,year):0,budget=extraNow+ds.reduce((s,d)=>s+(d.bal>0?Math.min(d.min,d.bal):0),0),order=[...ds].filter(d=>d.bal>0).sort(strategy==='avalanche'?(a,b)=>b.rate-a.rate:(a,b)=>a.bal-b.bal);
      for(let d of order){let before=d.bal,x=Math.min(d.min,d.bal,budget);d.bal-=x;budget-=x;if(before>.01&&d.bal<=.01)events.push([d.name,month])}
      for(let d of order){if(budget<=0)break;let before=d.bal,x=Math.min(d.bal,budget);d.bal-=x;budget-=x;if(before>.01&&d.bal<=.01&&!events.some(e=>e[0]===d.name))events.push([d.name,month])}
      curve.push({y:ds.reduce((s,d)=>s+Math.max(0,d.bal),0)})
    }return{month,interest,curve,events}
  }
  let a=sim('avalanche',true),s=sim('snowball',true),minimum=sim('avalanche',false),best=a.interest<=s.interest?a:s,bestName=a.interest<=s.interest?'Avalanche':'Bola de neve',savedVsMinimum=Math.max(0,minimum.interest-best.interest),monthsSaved=Math.max(0,minimum.month-best.month),first=best.events[0];
  let sens=[Math.max(0,extra-500),extra,extra+500].map(x=>{let old=extra;extra=x;let z=sim('avalanche',true);extra=old;return[BRL(x)+'/mês',z.month+' meses · '+BRL(z.interest)+' juros']});
  setResult(bestName,'Estratégia com menor custo de juros nas premissas.',[['Avalanche',a.month+' meses · '+BRL(a.interest)],['Bola de neve',s.month+' meses · '+BRL(s.interest)],['Só mínimos',minimum.month+' meses · '+BRL(minimum.interest)],['Juros evitados vs mínimos',BRL(savedVsMinimum)],['Tempo economizado',monthsSaved+' meses'],['Primeira dívida eliminada',first?first[0]+' · mês '+first[1]:'—']],`O valor extra mensal e o aporte inicial aceleram a desalavancagem. Avalanche prioriza taxa; bola de neve prioriza saldo. O modelo reaplica o orçamento liberado conforme cada dívida é quitada.`,`Com o orçamento atual, ${bestName} elimina todas as dívidas em aproximadamente <b>${best.month} meses</b>.`,sens,[{name:'Avalanche',data:a.curve},{name:'Bola de neve',data:s.curve},{name:'Só mínimos',data:minimum.curve}],'saldo total');
 }
 else if(e==='debtPortability'){
  let bal=Math.max(0,num('portBalance')),cr=num('portCurrentRate')/100,cn=Math.max(1,Math.round(num('portCurrentN'))),cs=$('portCurrentSystem').value,ce=num('portCurrentExtra'),nr=num('portNewRate')/100,nn=Math.max(1,Math.round(num('portNewN'))),ns=$('portNewSystem').value,nfee=Math.max(0,num('portFee')),ne=num('portNewExtra'),disc=num('portDiscount')/100;
  let current=loanFlow(bal,cr,cn,cs,ce),next=loanFlow(bal,nr,nn,ns,ne),currentPV=pvFlows(current.flows,disc),newPV=nfee+pvFlows(next.flows,disc),diff=newPV-currentPV,maxH=Math.max(cn,nn),curCum=0,newCum=nfee,curCurve=[],newCurve=[];
  for(let m=0;m<maxH;m++){curCum+=current.flows[m]||0;newCum+=next.flows[m]||0;curCurve.push({y:curCum});newCurve.push({y:newCum})}
  let flowPVWithoutFee=pvFlows(next.flows,disc),feeBreak=currentPV-flowPVWithoutFee,targetPV=currentPV-nfee,rateBreak=null;
  if(targetPV>0){let lowPV=pvFlows(loanFlow(bal,0,nn,ns,ne).flows,disc),highPV=pvFlows(loanFlow(bal,.2,nn,ns,ne).flows,disc);if(targetPV>=lowPV&&targetPV<=highPV)rateBreak=solveRate(r=>pvFlows(loanFlow(bal,r,nn,ns,ne).flows,disc),targetPV,0,.2)}
  let sens=[Math.max(0,nr-.0025),nr,nr+.0025].map(r=>{let p=nfee+pvFlows(loanFlow(bal,r,nn,ns,ne).flows,disc),d=p-currentPV;return[PCT(r*100)+' a.m.',(d<=0?'nova proposta - ':'nova proposta + ')+BRL(Math.abs(d))+' VP']});
  let insight=diff<=0?`A nova proposta reduz o valor presente estimado dos desembolsos em <b>${BRL(-diff)}</b>, considerando a taxa de desconto informada.`:`A nova proposta aumenta o valor presente estimado dos desembolsos em <b>${BRL(diff)}</b>, considerando a taxa de desconto informada.`;
  let be=feeBreak>=0?`Mantidas as demais premissas, os custos iniciais poderiam chegar a aproximadamente <b>${BRL(feeBreak)}</b> antes de igualar o valor presente do contrato atual.${rateBreak!==null?' A taxa mensal de equilíbrio fica perto de <b>'+PCT(rateBreak*100)+' a.m.</b>.':' Não apareceu taxa de equilíbrio entre 0% e 20% a.m. para o prazo informado.'}`:`Mesmo sem custos iniciais, o fluxo da nova proposta fica acima do valor presente do contrato atual nas premissas informadas.`;
  setResult(BRL(Math.abs(diff)),'Diferença de valor presente entre os contratos.',[['Parcela atual / 1ª',BRL(current.first)],['Nova parcela / 1ª',BRL(next.first)],['Contrato atual · VP',BRL(currentPV)],['Nova proposta · VP',BRL(newPV)],['Atual · nominal',BRL(current.total)],['Nova · nominal',BRL(nfee+next.total)]],insight,be,sens,[{name:'Contrato atual',data:curCurve},{name:'Nova proposta',data:newCurve}],'desembolso acumulado');
 }
 else if(e==='debtSwap'){let d=num('debt'),A=d*Math.pow(1+num('r1')/100,num('n')),B=d*Math.pow(1+num('r2')/100,num('n'));setResult(BRL(Math.abs(A-B)),'Diferença entre os cenários.',[['Atual',BRL(A)],['Alternativa',BRL(B)]])}
 else if(e==='debtGrowth'){let d=num('debt'),end=d*Math.pow(1+num('rate')/100,num('n'));setResult(BRL(end),'Saldo matemático ao fim do período.',[['Acréscimo',BRL(end-d)]])}
 else if(e==='reserve'){let target=num('cost')*num('months'),gap=Math.max(0,target-num('now')),t=num('pmt')>0?Math.ceil(gap/num('pmt')):Infinity;setResult(BRL(target),'Meta de reserva.',[['Falta',BRL(gap)],['Tempo',isFinite(t)?t+' meses':'—'],['Cobertura atual',(num('now')/Math.max(1,num('cost'))).toFixed(1)+' meses']])}
 else if(e==='goal'){let target=num('target'),P=num('current'),pmt=num('pmt'),years=num('years'),r=num('rate')/100,N=years*12,mi=monthly(r),proj=fv(P,pmt,r,N),req=Math.max(0,(target-P*Math.pow(1+mi,N))*mi/(Math.pow(1+mi,N)-1)),needRate=solveRate(rr=>fv(P,pmt,rr,N),target,-.9,2),sens=[r-.02,r,r+.02].map(rr=>[PCT(Math.max(0,rr)*100)+' a.a.',BRL(fv(P,pmt,Math.max(0,rr),N))]);setResult(BRL(proj),'Patrimônio projetado no prazo.',[['Meta',BRL(target)],['Aporte necessário',BRL(req)+'/mês'],['Taxa necessária',PCT(needRate*100)]],proj>=target?'A meta é atingida nas premissas atuais.':'A meta ainda não fecha no prazo atual.',`Mantendo patrimônio, aporte e prazo, a taxa necessária é aproximadamente <b>${PCT(needRate*100)} ao ano</b>.`,sens)}
 else if(e==='liveIncome'){
  let cap=Math.max(0,num('capital')),income=Math.max(0,num('income')),r=Math.max(-.99,num('real')/100-num('liveFee')/100),mi=monthly(r),strategy=$('incomeMode').value,yrs=Math.max(1,num('years')),N=Math.max(1,Math.round(yrs*12)),legacyPct=Math.max(0,num('legacy')/100),infl=Math.max(-.99,num('liveInflation')/100),legacyTarget=cap*legacyPct,sustainable,need;
  if(strategy==='preserve'){sustainable=Math.max(0,cap*mi);need=mi>0?income/mi:Infinity}else{let factor=Math.pow(1+mi,N);sustainable=Math.abs(mi)<1e-12?(cap-legacyTarget)/N:(cap*factor-legacyTarget)*mi/(factor-1);need=Math.abs(mi)<1e-12?income*N+legacyTarget:(income*(factor-1)/mi+legacyTarget)/factor}
  let b=cap,curve=[],depleted=null;for(let m=1;m<=N;m++){b=b*(1+mi)-income;if(b<0&&depleted===null)depleted=m;b=Math.max(0,b);curve.push({y:b})}
  let gap=sustainable-income,nominalIncome=income*Math.pow(1+infl,yrs),sens=[Math.max(-.01,r-.01),r,r+.01].map(rr=>{let mm=monthly(rr),factor=Math.pow(1+mm,N),sus=strategy==='preserve'?cap*mm:(Math.abs(mm)<1e-12?(cap-legacyTarget)/N:(cap*factor-legacyTarget)*mm/(factor-1));return[PCT(rr*100)+' real líquido',BRL(sus)+'/mês']});
  let insight=gap>=0?`Nas premissas, a renda desejada fica abaixo da renda matemática estimada em <b>${BRL(gap)}/mês</b>.`:`Nas premissas, a renda desejada supera a renda matemática estimada em <b>${BRL(-gap)}/mês</b>.`;
  let be=depleted?`Mantendo a retirada desejada, o patrimônio chega a zero por volta do <b>mês ${depleted}</b> do plano, antes do horizonte informado.`:`Ao fim do horizonte, o patrimônio projetado é de <b>${BRL(b)}</b>, contra legado-alvo de <b>${BRL(legacyTarget)}</b>.`;
  setResult(BRL(sustainable)+'/mês','Renda matemática estimada em dinheiro de hoje.',[['Renda desejada',BRL(income)+'/mês'],['Patrimônio necessário',BRL(need)],['Gap mensal',(gap>=0?'+ ':'- ')+BRL(Math.abs(gap))],['Patrimônio ao fim',BRL(b)],['Legado-alvo',BRL(legacyTarget)],['Renda nominal equivalente no fim',BRL(nominalIncome)+'/mês']],insight,be,sens,[{name:'Patrimônio durante a renda',data:curve}],'patrimônio');
 }
 else if(e==='financialIndependence'){
  let expenses=Math.max(0,num('fiExpenses')),coverage=Math.max(0,num('fiCoverage')/100),current=Math.max(0,num('fiCurrent')),pmt=Math.max(0,num('fiPmt')),r=Math.max(-.99,num('fiReal')/100),years=Math.max(1,num('fiYears')),extra=Math.max(0,num('fiExtra')),mi=monthly(r),targetIncome=expenses*coverage,target=mi>0?targetIncome/mi:Infinity,N=Math.max(1,Math.round(years*12));
  function accumulate(monthlyContribution,months=N){let b=current,curve=[];for(let m=1;m<=months;m++){b=b*(1+mi)+monthlyContribution;if(m%12===0)b+=extra;curve.push({y:b})}return{balance:b,curve}}
  let acc=accumulate(pmt),currentIncome=Math.max(0,current*mi),currentCoverage=expenses?currentIncome/expenses:0,yearsTo=null,b=current;
  if(Number.isFinite(target)){for(let m=1;m<=1200;m++){b=b*(1+mi)+pmt;if(m%12===0)b+=extra;if(b>=target){yearsTo=m/12;break}}}
  let req=null;if(Number.isFinite(target)){let lo=0,hi=Math.max(1000,pmt);while(accumulate(hi).balance<target&&hi<1e8)hi*=2;for(let i=0;i<70;i++){let mid=(lo+hi)/2;if(accumulate(mid).balance>=target)hi=mid;else lo=mid}req=hi}
  let milestones=Number.isFinite(target)?[.25,.5,.75,1].map(x=>[Math.round(x*100)+'% da meta',BRL(target*x)]):[['25% da meta','—'],['50% da meta','—'],['75% da meta','—'],['100% da meta','—']],sens=[Math.max(-.005,r-.01),r,r+.01].map(rr=>{let mm=monthly(rr),t=mm>0?targetIncome/mm:Infinity;return[PCT(rr*100)+' real',Number.isFinite(t)?BRL(t):'não sustenta preservação']});
  let insight=mi>0?`A independência financeira aqui é definida pela <b>cobertura do custo de vida</b> com a taxa real informada. Não existe uma taxa universal garantida; por isso o motor mostra sensibilidade e mantém a premissa explícita.`:`Com retorno real menor ou igual a zero, não existe capital finito que preserve o principal e gere a renda-alvo indefinidamente. Ajuste a premissa ou use um horizonte de consumo no motor Viver de Renda.`;
  let be=Number.isFinite(target)?(yearsTo!==null?`Mantendo aporte e retorno real informados, a projeção alcança 100% da cobertura por volta de <b>${yearsTo.toFixed(1).replace('.',',')} anos</b>.`:`No horizonte pesquisado de 100 anos, a meta não foi alcançada. Para atingir em ${years.toFixed(0)} anos, o aporte estimado é <b>${BRL(req)}/mês</b>.`):'A meta de preservação do principal não possui ponto de equilíbrio finito com retorno real ≤ 0.';
  setResult(PCT(currentCoverage*100),'Cobertura atual estimada do custo de vida.',[['Renda patrimonial atual',BRL(currentIncome)+'/mês'],['Renda-alvo',BRL(targetIncome)+'/mês'],['Capital-alvo',Number.isFinite(target)?BRL(target):'não finito'],['Patrimônio no prazo desejado',BRL(acc.balance)],['Aporte p/ prazo desejado',req!==null?BRL(req)+'/mês':'—'],['Tempo estimado até a meta',yearsTo!==null?yearsTo.toFixed(1).replace('.',',')+' anos':'—'],...milestones],insight,be,sens,[{name:'Patrimônio projetado',data:acc.curve}],'caminho até a independência');
 }
 else if(e==='retirement'){
  let age=num('age'),ret=Math.max(age+.0833,num('ret')),endAge=Math.max(ret+.0833,num('endAge')),P=Math.max(0,num('current')),pmt=Math.max(0,num('pmt')),extra=Math.max(0,num('extra')),income=Math.max(0,num('income')),infl=num('inflation')/100,r=Math.max(-.99,num('real')/100-num('fee')/100),N=Math.max(1,Math.round((ret-age)*12)),M=Math.max(1,Math.round((endAge-ret)*12)),mi=monthly(r);
  function accumulate(monthlyContribution,months=N){let b=P,curve=[];for(let k=1;k<=months;k++){b=b*(1+mi)+monthlyContribution;if(k%12===0)b+=extra;curve.push({y:b})}return{balance:b,curve}}
  function capitalNeeded(){return Math.abs(mi)<1e-12?income*M:income*(1-Math.pow(1+mi,-M))/mi}
  let need=capitalNeeded(),acc=accumulate(pmt),b=acc.balance,gap=b-need;
  function requiredContribution(){let lo=0,hi=Math.max(1000,pmt, income*5);while(accumulate(hi).balance<need&&hi<1e8)hi*=2;for(let i=0;i<70;i++){let mid=(lo+hi)/2;if(accumulate(mid).balance>=need)hi=mid;else lo=mid}return hi}
  let req=requiredContribution();
  function retirementAt(targetAge){let months=Math.max(1,Math.round((targetAge-age)*12)),a=accumulate(pmt,months),decMonths=Math.max(1,Math.round((endAge-targetAge)*12)),needed=Math.abs(mi)<1e-12?income*decMonths:income*(1-Math.pow(1+mi,-decMonths))/mi;return{balance:a.balance,need:needed,gap:a.balance-needed}}
  let ageBreak=null;for(let a=Math.ceil(ret*12)/12;a<=Math.min(80,endAge-1/12);a+=1/12){if(retirementAt(a).gap>=0){ageBreak=a;break}}
  let dec=b,fullCurve=[...acc.curve],depletedAt=null;for(let k=1;k<=M;k++){dec=dec*(1+mi)-income;if(dec<0&&depletedAt===null)depletedAt=ret+k/12;dec=Math.max(0,dec);fullCurve.push({y:dec})}
  let nominalFactor=Math.pow(1+infl,(ret-age)),nominalWealth=b*nominalFactor,nominalIncome=income*nominalFactor;
  let sens=[Math.max(-.02,r-.01),r,r+.01].map(rr=>{let mm=monthly(rr),bb=P;for(let k=1;k<=N;k++){bb=bb*(1+mm)+pmt;if(k%12===0)bb+=extra}let nn=Math.abs(mm)<1e-12?income*M:income*(1-Math.pow(1+mm,-M))/mm;return[PCT(rr*100)+' real',(`${bb-nn>=0?'+':'-'} ${BRL(Math.abs(bb-nn))}`) ]});
  let insight=gap>=0?`Com as premissas atuais, o patrimônio projetado cobre a renda desejada até a idade final e deixa uma margem estimada de <b>${BRL(gap)}</b> em dinheiro de hoje na data da aposentadoria.`:`Com as premissas atuais, existe um déficit de capital de <b>${BRL(-gap)}</b> na data da aposentadoria. Aporte, idade, renda desejada e retorno real são as principais alavancas.`;
  let be=gap>=0?`O aporte mensal atual já fecha a meta no cenário-base. O aporte mínimo estimado é de <b>${BRL(req)}/mês</b>.`:(ageBreak!==null?`Mantendo o aporte atual e as demais premissas, a primeira idade aproximada em que a conta fecha é <b>${ageBreak.toFixed(1).replace('.',',')} anos</b>. Para manter a idade de ${ret.toFixed(0)}, o aporte estimado sobe para <b>${BRL(req)}/mês</b>.`:`Mesmo estendendo a simulação até 80 anos, o cenário não fechou com o aporte atual. Para a idade escolhida, o aporte estimado é <b>${BRL(req)}/mês</b>.`);
  setResult(BRL(b),'Patrimônio projetado na aposentadoria, em dinheiro de hoje.',[['Patrimônio necessário',BRL(need)],['Gap na aposentadoria',(gap>=0?'+ ':'- ')+BRL(Math.abs(gap))],['Aporte estimado p/ meta',BRL(req)+'/mês'],['Patrimônio nominal na data',BRL(nominalWealth)],['Renda nominal equivalente',BRL(nominalIncome)+'/mês'],['Patrimônio ao fim do plano',BRL(dec)]],insight,be,sens,[{name:'Patrimônio real projetado',data:fullCurve}],'acumulação + fase de renda');
 }
 else if(e==='pgblVgbl'){let c=num('contrib'),r=num('return'),t=num('tax')/100,pg=(c+r)*(1-t),vg=c+r*(1-t);setResult(BRL(Math.max(pg,vg)),'Maior valor líquido nesta simplificação.',[['PGBL líquido',BRL(pg)],['VGBL líquido',BRL(vg)]])}
 else if(e==='salary'){let gross=num('gross')+num('commission')+num('overtime'),deps=num('deps'),pension=num('pension'),other=num('other'),vt=gross*num('vt')/100;function INSS(g){let bands=[[1621,.075],[2902.84,.09],[4354.27,.12],[8475.55,.14]],tax=0,prev=0,base=Math.min(g,8475.55);for(let [lim,r] of bands){let part=Math.max(0,Math.min(base,lim)-prev);tax+=part*r;if(base<=lim)break;prev=lim}return tax}let ins=INSS(gross),legal=ins+deps*189.59+pension,ded=Math.max(legal,607.20),base=Math.max(0,gross-ded),ir=base<=2428.8?0:base<=2826.65?base*.075-182.16:base<=3751.05?base*.15-394.16:base<=4664.68?base*.225-675.49:base*.275-908.73;ir=Math.max(0,ir);let red=gross<=5000?Math.min(ir,312.89):gross<=7350?Math.min(ir,Math.max(0,978.62-.133145*gross)):0;ir=Math.max(0,ir-red);let net=gross-ins-ir-other-vt;setResult(BRL(net),'Salário líquido estimado.',[['INSS',BRL(ins)],['IRRF',BRL(ir)],['Outros/VT',BRL(other+vt)]],`A carga efetiva dos descontos informados é ${PCT((gross-net)/gross*100)} do bruto.`)}
 else if(e==='thirteenth')setResult(BRL(num('salary')*Math.min(12,num('months'))/12),'13º bruto proporcional.')
 else if(e==='vacation'){let b=num('salary')*num('days')/30;setResult(BRL(b*4/3),'Férias + 1/3 antes de descontos.',[['Férias base',BRL(b)],['1/3',BRL(b/3)]])}
 else if(e==='fgtsDeposit')setResult(BRL(num('salary')*num('rate')/100*num('months')),'Depósitos estimados.')
 else if(e==='correction')setResult(BRL(num('p')*(1+num('index')/100)),'Valor corrigido.')
 else if(e==='percentage')setResult(BRL(num('p')*num('rate')/100),'Percentual do valor.')
 else if(e==='discount')setResult(BRL(num('p')*(1-num('rate')/100)),'Preço após desconto.')
 else if(e==='spending')setResult(BRL(Math.max(0,num('income')-num('fixed')-num('saving'))),'Valor restante após essenciais e meta de poupança.')
 else if(e==='saveRate')setResult(BRL(num('income')*num('rate')/100)+'/mês','Valor correspondente à taxa escolhida.')
 else if(e==='diagnostic'){let inc=num('income'),debt=inc?num('debt')/inc*100:0,save=inc?num('saving')/inc*100:0,months=num('ess')?num('reserve')/num('ess'):0;setResult('Diagnóstico pronto','Três sinais principais.',[['Dívidas/renda',PCT(debt)],['Taxa de poupança',PCT(save)],['Reserva',months.toFixed(1)+' meses']])}
}catch(err){console.error(err);toast('Revise os dados da simulação.')}}
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
  window.dispatchEvent(new CustomEvent('amarelo:decision-saved',{detail:{toolId:state.current.id}}));
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
function deleteDecision(id){storage.set('amarelo_decisions',saved().filter(x=>x.id!==id));renderDashboard();toast(window.AmareloCloud?.isAuthenticated()?'Versão removida e sincronizando.':'Versão removida deste navegador.')}
function closeVersionCompare(){$('versionModal').classList.add('hidden')}
function openVersionCompare(decisionKey){
  let versions=saved().filter(x=>savedDecisionKey(x)===decisionKey).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
  if(versions.length<2)return toast('Salve pelo menos duas versões desta decisão.');
  $('versionModalTitle').textContent=(versions[0]?.decisionName||versions[0]?.title||'Decisão')+' — versões';
  $('versionCompareGrid').innerHTML=versions.map((v,i)=>`<article class="versionCard ${i===0?'latest':''}"><div class="versionCardTop"><span>VERSÃO ${v.version||versions.length-i}</span><b>${new Date(v.date).toLocaleDateString('pt-BR')}</b></div><h3>${v.scenarioLabel||'Cenário salvo'}</h3><div class="versionPrimary">${escapeHtml(v.primary)}</div><p>${escapeHtml(v.subtitle||'')}</p><div class="versionMetrics">${(v.metrics||[]).slice(0,4).map(m=>`<div><span>${escapeHtml(m[0])}</span><b>${escapeHtml(m[1])}</b></div>`).join('')}</div><button onclick="closeVersionCompare();openSavedDecision(${v.id})">Reabrir esta versão →</button></article>`).join('');
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
  const metrics=(state.last.metrics||[]).map(m=>`<div class="reportMetric"><small>${escapeHtml(m[0])}</small><b>${escapeHtml(m[1])}</b></div>`).join('');
  const sensitivity=(state.last.sens||[]).map(s=>`<div class="reportSensitivityItem"><small>${escapeHtml(s[0])}</small><b>${escapeHtml(s[1])}</b></div>`).join('');
  const decisionKey=makeDecisionKey(state.current.id,name),savedVersions=saved().filter(x=>savedDecisionKey(x)===decisionKey).sort((a,b)=>new Date(b.date)-new Date(a.date)),previous=savedVersions[0]||null;
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
  $('reportContent').innerHTML=`<header class="reportHeader"><div class="reportBrand"><i></i>AMARELO</div><div class="reportMeta">Gerado em ${new Date().toLocaleString('pt-BR')}<br>Simulação educacional · premissas editáveis</div></header><div class="reportKicker">${escapeHtml(state.current.cat.toUpperCase())} / RELATÓRIO DE DECISÃO</div><h1 class="reportTitle">${escapeHtml(name)}</h1><p class="reportSubtitle">${escapeHtml(state.current.title)} · ${escapeHtml(state.current.desc)}</p><div class="reportScenario">${escapeHtml(scenarioLabel)}</div><section class="reportHero"><small>RESPOSTA DA SIMULAÇÃO</small><h2>${escapeHtml(state.last.primary)}</h2><p>${escapeHtml(state.last.subtitle||'')}</p></section><section class="reportSection"><div class="reportSectionHead"><h3>Métricas principais</h3><span>RESULTADO</span></div><div class="reportMetricGrid">${metrics}</div></section>${drivers?`<section class="reportSection"><div class="reportSectionHead"><h3>O que move a decisão</h3><span>DRIVERS</span></div><div class="reportDriverGrid">${drivers}</div></section>`:''}<section class="reportSection"><div class="reportSectionHead"><h3>Premissas</h3><span>TRANSPARÊNCIA</span></div><div class="reportAssumptions">${assumptions}</div></section>${insight}${breakEven}${sensitivity?`<section class="reportSection"><div class="reportSectionHead"><h3>Sensibilidade</h3><span>E SE?</span></div><div class="reportSensitivity">${sensitivity}</div></section>`:''}${scenarioSection}${evolutionSection}<div class="reportMethod"><b>Metodologia.</b> ${escapeHtml(method(state.current.engine))}</div><footer class="reportFooter"><span>AMARELO · Antes de decidir, coloque na conta.</span><span>Este relatório organiza uma simulação e não substitui análise individual de riscos, contratos, tributos ou condições específicas.</span></footer>`;
  $('reportModal').classList.remove('hidden');
}
function renderDashboard(){
  let p=storage.get('amarelo_profile',{income:0,wealth:0,essentials:0,reserve:0,monthly:0,age:0}),months=p.essentials?p.reserve/p.essentials:0;
  $('profileSummary').innerHTML=[['Renda líquida',BRL(p.income)],['Patrimônio financeiro',BRL(p.wealth)],['Reserva',months?months.toFixed(1)+' meses':'—'],['Investimento mensal',BRL(p.monthly)]].map(x=>`<div class="profileStat"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
  let d=saved(),groups=groupSavedDecisions(d),now=Date.now(),day=86400000,review=groups.filter(g=>(now-new Date(g.versions[0].date).getTime())/day>=45),multi=groups.filter(g=>g.versions.length>1),recent=groups.filter(g=>(now-new Date(g.versions[0].date).getTime())/day<30);
  $('decisionPulse').innerHTML=[
    ['Decisões acompanhadas',groups.length],
    ['Versões salvas',d.length],
    ['Com histórico',multi.length],
    ['Atualizadas em 30 dias',recent.length]
  ].map((x,i)=>`<div class="pulseStat"><span>0${i+1}</span><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
  $('reviewQueue').innerHTML=review.length?review.slice(0,4).map(g=>{let x=g.versions[0],days=Math.floor((now-new Date(x.date).getTime())/day);return`<div class="reviewDecision"><div><span>${days} DIAS</span><h4>${escapeHtml(x.decisionName||x.title)}</h4><p>${escapeHtml(x.title)} · última versão V${x.version||g.versions.length}</p></div><button onclick="openSavedDecision(${x.id})">Revisar →</button></div>`}).join(''):`<div class="reviewEmpty"><i>✓</i><div><b>Nenhuma decisão está há 45 dias sem nova versão.</b><p>Quando uma decisão ficar antiga, ela aparece aqui para você reabrir as premissas.</p></div></div>`;
  $('savedDecisions').innerHTML=groups.length?groups.slice(0,8).map(g=>{let x=g.versions[0],count=g.versions.length;return`<div class="decisionRow groupedDecision"><div><div class="decisionTitleLine"><h4>${escapeHtml(x.decisionName||x.title)}</h4><span>V${x.version||count}</span></div><p>${escapeHtml(x.title)} · ${count} ${count===1?'versão':'versões'} · atualizado ${new Date(x.date).toLocaleDateString('pt-BR')}</p></div><div class="decisionValue"><strong>${escapeHtml(x.primary)}</strong><div class="decisionActions"><button onclick="openSavedDecision(${x.id})">Reabrir</button>${count>1?`<button data-history-key="${escapeHtml(g.key)}">Histórico</button>`:''}<button onclick="deleteDecision(${x.id})">Excluir última</button></div></div></div>`}).join(''):'<div class="dashEmpty"><span>01</span><h4>Seu histórico começa na primeira decisão.</h4><p>Faça uma simulação, dê um nome ao caso e salve a primeira versão.</p><button onclick="navigate(\'tools\')">Abrir biblioteca →</button></div>';
  $('savedDecisions').querySelectorAll('[data-history-key]').forEach(b=>b.addEventListener('click',()=>openVersionCompare(b.dataset.historyKey)));
  let f=favs().map(id=>tools.find(t=>t.id===id)).filter(Boolean);
  $('favoriteTools').innerHTML=f.length?f.slice(0,6).map(t=>`<div class="miniTool" onclick="openTool('${t.id}')"><i>${t.icon}</i><b>${t.title}</b></div>`).join(''):'<div class="dashEmpty compact"><span>☆</span><h4>Fixe o que você usa mais.</h4><p>Seus favoritos aparecem aqui.</p></div>';
  if(review.length){
    let x=review[0].versions[0];
    $('nextDecision').innerHTML=`<div class="miniTool" onclick="openSavedDecision(${x.id})"><i>↻</i><div><b>${escapeHtml(x.decisionName||x.title)}</b><p class="muted">Reabra a última versão e atualize as premissas.</p></div></div>`;
  }else{
    let next=p.reserve<p.essentials*6&&p.essentials>0?['reserva','Sua reserva informada está abaixo de 6 meses.']:p.monthly>0?['meta-financeira','Transforme seu aporte mensal em uma meta.']:['diagnostico','Comece pelo diagnóstico financeiro.'];
    $('nextDecision').innerHTML=`<div class="miniTool" onclick="openTool('${next[0]}')"><i>→</i><div><b>${tools.find(t=>t.id===next[0])?.title||'Próxima análise'}</b><p class="muted">${next[1]}</p></div></div>`;
  }
}
function openProfile(){let p=storage.get('amarelo_profile',{income:0,wealth:0,essentials:0,reserve:0,monthly:0,age:0});for(const k in p){let el=$('profile'+k[0].toUpperCase()+k.slice(1));if(el)el.value=p[k]}$('profileModal').classList.remove('hidden')}
function closeProfile(){$('profileModal').classList.add('hidden')}
function saveProfile(){let p={income:num('profileIncome'),wealth:num('profileWealth'),essentials:num('profileEssentials'),reserve:num('profileReserve'),monthly:num('profileMonthly'),age:num('profileAge')};storage.set('amarelo_profile',p);closeProfile();renderDashboard();toast(window.AmareloCloud?.isAuthenticated()?'Perfil salvo e sincronizando.':'Perfil salvo neste navegador.')}
renderHome();renderAskExamples();navigate('home');