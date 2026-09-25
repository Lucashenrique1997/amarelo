/* AMARELO 1.0 — deterministic financial core
 *
 * This file contains pure financial/math helpers shared by the decision engines.
 * No DOM access, storage access or routing should be added here.
 */
const BRL=x=>(Number.isFinite(x)?x:0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
const PCT=x=>(Number.isFinite(x)?x:0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
const monthly=a=>Math.pow(1+a,1/12)-1, irDays=d=>d<=180?.225:d<=360?.20:d<=720?.175:.15;

function loanPay(pv,m,n){return m===0?pv/n:pv*m/(1-Math.pow(1+m,-n))}
function loanBalance(pv,m,n,k){let pay=loanPay(pv,m,n);return m===0?Math.max(0,pv-pay*k):Math.max(0,pv*Math.pow(1+m,k)-pay*(Math.pow(1+m,k)-1)/m)}
function loanFlow(pv,m,n,system='price',monthlyExtra=0){let balance=pv,flows=[],interest=0,first=0,last=0,amort=n?pv/n:0,price=n?loanPay(pv,m,n):0;for(let k=1;k<=n;k++){let j=balance*m,pay;if(system==='sac'){let a=Math.min(amort,balance);pay=a+j;balance=Math.max(0,balance-a)}else{pay=price;let a=Math.max(0,pay-j);balance=Math.max(0,balance-a)}interest+=j;pay+=monthlyExtra;if(k===1)first=pay;if(k===n)last=pay;flows.push(pay)}return{flows,interest,first,last,total:flows.reduce((s,x)=>s+x,0)}}
function pvFlows(flows,annualRate,startMonth=1){let d=monthly(Math.max(-.99,annualRate));return flows.reduce((s,x,i)=>s+x/Math.pow(1+d,i+startMonth),0)}
function fv(p,pmt,a,n){let m=monthly(a),b=p;for(let k=0;k<n;k++)b=b*(1+m)+pmt;return b}
function taxLots(P,pmt,a,N){let m=monthly(a),gross=P*Math.pow(1+m,N),tax=(gross-P)*irDays(N*30);for(let k=0;k<N;k++){let age=N-1-k,end=pmt*Math.pow(1+m,age),gain=end-pmt;gross+=end;if(gain>0)tax+=gain*irDays(Math.max(1,age*30))}return{gross,tax,net:gross-tax,invested:P+pmt*N}}
function fixedIncomeProduct(name,type,rateValue,feePct,lockDays,P,pmt,N,cdi,inflation){
  let cdiBased=type.startsWith('cdi'),taxed=type.endsWith('taxed'),annualGross=cdiBased?cdi*(rateValue/100):rateValue/100,annual=Math.max(-.99,annualGross-feePct/100),calc=taxed?taxLots(P,pmt,annual,N):null,gross=taxed?calc.gross:fv(P,pmt,annual,N),tax=taxed?calc.tax:0,net=taxed?calc.net:gross,invested=P+pmt*N,eligible=N*30>=lockDays,real=net/Math.pow(1+inflation,N/12);
  return{name,type,rateValue,feePct,lockDays,cdiBased,taxed,annual,gross,tax,net,invested,gain:net-invested,real,eligible};
}
function fixedIncomeTypeLabel(type){return({'cdi-taxed':'% CDI · tributado','cdi-exempt':'% CDI · isento','prefix-taxed':'Prefixado · tributado','prefix-exempt':'Prefixado · isento'})[type]||type}

function solveRate(fn,target,lo=-.99,hi=3){for(let i=0;i<70;i++){let mid=(lo+hi)/2;if(fn(mid)>target)hi=mid;else lo=mid}return(lo+hi)/2}
