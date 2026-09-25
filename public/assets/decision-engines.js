/* AMARELO 1.0 — decision engine execution layer
 *
 * Engine orchestration lives here. Deterministic reusable math belongs in finance-core.js.
 * UI rendering belongs in app.js.
 */
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
