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
renderHome();renderAskExamples();navigate('home');refreshRuntimeCapabilities().then(()=>{if(state.route==='dashboard')renderDashboard()});

window.addEventListener('error',event=>console.error('AMARELO runtime error',{message:event.message,filename:event.filename,lineno:event.lineno,colno:event.colno}));
window.addEventListener('unhandledrejection',event=>console.error('AMARELO unhandled promise rejection',String(event.reason?.message||event.reason||'unknown')));
