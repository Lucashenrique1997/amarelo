import assert from "node:assert/strict";
import "../public/assets/intent-core.js";

const I=globalThis.AmareloIntent;

assert.equal(I.parseMoneyBR("R$ 1.250,50"),1250.50);
assert.equal(I.parseMoneyBR("250 mil"),250000);
assert.equal(I.parseMoneyBR("1,5 milhão"),1500000);
assert.equal(I.parseRateBR("1,29"),1.29);

const cases=[
  ["Tenho duas propostas de financiamento para comparar","comparar-financiamentos"],
  ["Estou comprando um imóvel na planta corrigido pelo INCC","imovel-na-planta"],
  ["Recebi meu 13º e quero decidir o que fazer","bonus-decidir"],
  ["Quero chegar na independência financeira","independencia-financeira"],
  ["Consórcio ou financiamento para comprar um carro?","financiamento-consorcio"],
  ["Comprar ou alugar um apartamento?","comprar-alugar"],
  ["Recebi proposta de portabilidade da dívida","portabilidade-divida"],
  ["Trocar de carro ou manter o atual?","trocar-carro"],
  ["Tenho dinheiro para amortizar meu financiamento","amortizar-investir"],
  ["Quero me aposentar aos 60","aposentadoria"],
  ["Quanto preciso para viver de renda?","viver-renda"],
  ["Qual meu salário líquido?","salario-liquido"],
  ["LCI ou CDB?","gross-up"],
  ["Preciso organizar dívida do cartão","plano-dividas"],
  ["Vale pagar à vista ou parcelado?","avista-parcelado"],
  ["Quero chegar em uma meta de 500 mil","meta-financeira"],
  ["Quanto rende 100 mil?","quanto-rende"]
];
for(const [query,expected] of cases){
  assert.equal(I.detectAskTool(query),expected,query);
}
console.log("Intent routing vectors passed.");
