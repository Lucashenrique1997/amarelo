/* AMARELO 1.0 — application runtime
 * Source of truth extracted from the former monolithic index.html.
 * Financial calculations remain deterministic.
 */
const $=id=>document.getElementById(id), num=id=>parseFloat($(id)?.value)||0;
let state={route:'home',category:'Todas',current:null,mode:'simple',last:null,plan:storage.get('amarelo_plan','free'),scenario:null,scenarioBusy:false,pendingAsk:null,askContext:null};
if(!['free','pro'].includes(state.plan)){state.plan='pro';storage.set('amarelo_plan','pro')}

const journeys=[
['Investir','↗','Quero investir melhor','Renda fixa, juros, inflação, metas e aposentadoria.'],
['Comprar','⌂','Quero comprar','Imóvel, carro, financiamento, consórcio e pagamento.'],
['Dívidas','!','Quero resolver uma dívida','Cartão, empréstimo, renegociação e quitação.'],
['Planejar','∞','Quero planejar meu futuro','Reserva, metas, previdência e viver de renda.'],
['Trabalho','R$','Quero entender meu salário','Salário, férias, 13º, INSS, IRRF e FGTS.'],
['Decidir','◎','Quero comparar caminhos','Amortizar ou investir, custo de oportunidade e decisões de patrimônio.']
];

const tools=window.AMARELO_TOOLS;

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

function openTool(id){state.current=tools.find(t=>t.id===id);navigate('tool');openCurrentTool()}
function openCurrentTool(){const t=state.current;state.scenario=null;state.scenarioBusy=false;$('decisionNameInput').value='';$('decisionNameInput').placeholder='Ex.: '+t.title+' — meu caso';$('scenarioLab').classList.add('hidden');$('scenarioCompare').classList.add('hidden');$('toolTitle').textContent=t.title;$('toolDescription').textContent=t.desc;$('toolCategory').textContent=t.cat.toUpperCase();$('toolTier').textContent=t.tier==='decision'?'DECISÃO PRO':t.tier==='pro'?'PRO':'GRÁTIS';$('toolTier').className='tier '+t.tier;$('toolForm').innerHTML=buildForm(t.engine);$('methodology').textContent=method(t.engine);applyPendingAsk();state.mode='simple';setMode('simple');updateFav();state.last=null;clearResult();let allowed=planAllows(t);$('paywall').classList.toggle('hidden',allowed);$('calculator').classList.toggle('hidden',!allowed);if(allowed){calculateTool();initScenarioLab()}}
function updateFav(){$('favoriteBtn').textContent=(isFav(state.current.id)?'★':'☆')+' Favoritar'}function toggleFavoriteCurrent(){toggleFav(state.current.id);updateFav()}
function setMode(m){state.mode=m;$('simpleMode').classList.toggle('active',m==='simple');$('advancedMode').classList.toggle('active',m==='advanced');$('toolForm').classList.toggle('advanced',m==='advanced')}
function clearResult(){$('resultPrimary').textContent='Calculando...';$('resultSubtitle').textContent='';$('resultMetrics').innerHTML='';['resultInsight','breakEvenBox','sensitivityBox','chartBox','assumptionBox','driverBox'].forEach(id=>$(id).classList.add('hidden'));$('nextTools').innerHTML=''}
function metric(a,b){return `<div class="metric"><small>${a}</small><b>${b}</b></div>`}
function renderAssumptions(){let items=[...document.querySelectorAll('#toolForm .field')].map(w=>{let el=w.querySelector('input,select'),label=w.querySelector('label');if(!el||!label)return null;let name=[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim()||el.id;let value=el.tagName==='SELECT'?(el.options[el.selectedIndex]?.text||el.value):el.value;return{name,value,advanced:w.classList.contains('advancedField')}}).filter(Boolean);if(!items.length){$('assumptionBox').classList.add('hidden');return}$('assumptionList').innerHTML=items.map(x=>`<div class="assumptionChip ${x.advanced?'advancedAssumption':''}"><small>${x.name}</small><b>${x.value}</b></div>`).join('');$('assumptionBox').classList.remove('hidden')}
function setResult(primary,subtitle,metrics=[],insight='',be=null,sens=null,series=null,label=''){state.last={primary,subtitle,metrics,insight,be,sens:sens||[],series:series||[],label};renderAssumptions();renderDecisionDrivers();recordScenarioSnapshot();$('resultPrimary').textContent=primary;$('resultSubtitle').textContent=subtitle;$('resultMetrics').innerHTML=metrics.map(x=>metric(x[0],x[1])).join('');if(insight){$('resultInsight').classList.remove('hidden');$('insightText').innerHTML=insight}else $('resultInsight').classList.add('hidden');if(be){$('breakEvenBox').classList.remove('hidden');$('breakEven').innerHTML=be}else $('breakEvenBox').classList.add('hidden');if(sens?.length){$('sensitivityBox').classList.remove('hidden');$('sensitivity').innerHTML=sens.map(x=>`<div class="sens"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}else $('sensitivityBox').classList.add('hidden');if(series?.length){$('chartBox').classList.remove('hidden');$('chartLabel').textContent=label;drawChart(series)}else $('chartBox').classList.add('hidden');renderNext()}
function drawChart(series){const w=720,h=220,pad=28,all=series.flatMap(s=>s.data.map(x=>x.y)),min=Math.min(0,...all),max=Math.max(...all,1),span=max-min||1,colors=['#f3c62e','#7ed3af','#8fb5ff','#ff9a82'],maxLen=Math.max(...series.map(s=>s.data.length)),sx=i=>pad+(w-2*pad)*(maxLen<=1?0:i/(maxLen-1)),sy=y=>h-pad-(h-2*pad)*((y-min)/span);let grid='';for(let k=0;k<5;k++){let y=pad+(h-2*pad)*k/4;grid+=`<line x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" stroke="#303029" stroke-width="1"/>`}let paths=series.map((s,si)=>`<path d="${s.data.map((p,i)=>(i?'L':'M')+sx(i)+' '+sy(p.y)).join(' ')}" fill="none" stroke="${colors[si%colors.length]}" stroke-width="3" stroke-linecap="round"/>`).join('');$('chart').innerHTML=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${grid}${paths}</svg>`;$('legend').innerHTML=series.map((s,i)=>`<span><i style="background:${colors[i%colors.length]}"></i>${s.name}</span>`).join('')}
function renderNext(){let map={'financiamento-consorcio':['comparar-financiamentos','comprar-alugar'],'comparar-financiamentos':['financiamento-consorcio','amortizar-investir'],'comprar-alugar':['financiamento-consorcio','amortizar-investir'],'amortizar-investir':['renda-fixa','portabilidade-divida'],'portabilidade-divida':['plano-dividas','amortizar-investir'],'trocar-carro':['custo-carro','avista-parcelado'],'renda-fixa':['gross-up','meta-financeira'],'gross-up':['renda-fixa'],'aposentadoria':['viver-renda','meta-financeira'],'reserva':['quanto-rende'],'salario-liquido':['reserva','quanto-guardar']};let ids=map[state.current.id]||[];$('nextTools').innerHTML=ids.length?'<h4>Próximas análises relacionadas</h4>'+ids.map(id=>{let t=tools.find(x=>x.id===id);return t?`<button onclick="openTool('${id}')">${t.title} →</button>`:''}).join(''):''}
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
function saveProfile(){let p={income:num('profileIncome'),wealth:num('profileWealth'),essentials:num('profileEssentials'),reserve:num('profileReserve'),monthly:num('profileMonthly'),age:num('profileAge')};storage.set('amarelo_profile',p);closeProfile();renderDashboard();toast('Perfil salvo neste navegador.')}
renderHome();renderAskExamples();navigate('home');
