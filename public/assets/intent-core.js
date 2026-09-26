(function(root){
  function parseMoneyBR(raw){
    if(!raw)return null;
    let s=String(raw).toLowerCase().trim(),mult=1;
    if(/milh|milhão|milhões|milhoes|\bmi\b/.test(s))mult=1e6;
    else if(/\bmil\b|\bk\b/.test(s))mult=1e3;
    s=s.replace(/[^\d,.\-]/g,'');
    if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    else if((s.match(/\./g)||[]).length&&/\.\d{3}(?:\.|$)/.test(s))s=s.replace(/\./g,'');
    const n=parseFloat(s);
    return Number.isFinite(n)?n*mult:null;
  }

  function parseRateBR(raw){
    if(raw==null)return null;
    const n=parseFloat(String(raw).replace(',','.'));
    return Number.isFinite(n)?n:null;
  }

  function detectAskTool(raw){
    const text=String(raw||'').toLowerCase();
    const rules=[
      ['comparar-financiamentos',['comparar financiamento','comparar financiamentos','duas propostas','proposta a','proposta b','qual financiamento']],
      ['imovel-na-planta',['na planta','imóvel na planta','imovel na planta','incc','entrega do imóvel','entrega do imovel']],
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
      const score=words.reduce((sum,word)=>sum+(text.includes(word)?1:0),0);
      if(score>best[1])best=[id,score];
    }
    return best[0];
  }

  root.AmareloIntent=Object.freeze({parseMoneyBR,parseRateBR,detectAskTool});
})(globalThis);
