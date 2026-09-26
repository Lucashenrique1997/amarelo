(function(root){
const journeys=[
['Investir','↗','Quero investir melhor','Renda fixa, juros, inflação, metas e aposentadoria.'],
['Comprar','⌂','Quero comprar','Imóvel, carro, financiamento, consórcio e pagamento.'],
['Dívidas','!','Quero resolver uma dívida','Cartão, empréstimo, renegociação e quitação.'],
['Planejar','∞','Quero planejar meu futuro','Reserva, metas, previdência e viver de renda.'],
['Trabalho','R$','Quero entender meu salário','Salário, férias, 13º, INSS, IRRF e FGTS.'],
['Decidir','◎','Quero comparar caminhos','Amortizar ou investir, custo de oportunidade e decisões de patrimônio.']
];

const tools=[
{id:'quanto-rende',cat:'Investir',tier:'free',icon:'↗',title:'Quanto rende?',desc:'Capital, aportes, juros e inflação.',engine:'compound',featured:true},
{id:'juros-compostos',cat:'Investir',tier:'free',icon:'+',title:'Juros Compostos',desc:'Veja quanto tempo e aportes fazem diferença.',engine:'compound'},
{id:'renda-fixa',cat:'Investir',tier:'pro',icon:'%',title:'Renda Fixa Pro',desc:'CDB x LCI/LCA x alternativa com imposto, custos e cenários.',engine:'fixedIncome',featured:true},
{id:'gross-up',cat:'Investir',tier:'pro',icon:'⇄',title:'Gross-Up Pro',desc:'Taxa isenta, equivalência tributada e ponto de equilíbrio.',engine:'grossup',featured:true},
{id:'rentabilidade-real',cat:'Investir',tier:'free',icon:'%',title:'Rentabilidade Real',desc:'Desconte corretamente a inflação.',engine:'realReturn'},
{id:'converter-taxas',cat:'Investir',tier:'free',icon:'↔',title:'Conversor de Taxas',desc:'Mensal para anual e anual para mensal.',engine:'rateConvert'},
{id:'percentual-cdi',cat:'Investir',tier:'free',icon:'%',title:'% CDI → Taxa Anual',desc:'Converta um percentual do CDI.',engine:'cdiConvert'},
{id:'fgc-exposicao',cat:'Investir',tier:'free',icon:'✓',title:'Exposição por Instituição',desc:'Compare concentração com um limite informado.',engine:'exposure'},

{id:'financiamento-consorcio',cat:'Comprar',tier:'decision',icon:'⌂',title:'Financiamento x Consórcio x Investir',desc:'Custo, tempo, contemplação e custo de oportunidade.',engine:'buyPaths',featured:true},
{id:'comprar-alugar',cat:'Comprar',tier:'decision',icon:'⌂',title:'Comprar x Alugar',desc:'Compare patrimônio líquido dos dois caminhos.',engine:'buyRent',featured:true},
{id:'avista-parcelado',cat:'Comprar',tier:'decision',icon:'▦',title:'À Vista x Parcelado',desc:'Valor presente e desconto de equilíbrio.',engine:'cashInstallment',featured:true},
{id:'financiamento-imovel',cat:'Comprar',tier:'free',icon:'⌂',title:'Financiamento Imobiliário',desc:'Parcela e custo total simplificado.',engine:'loan'},
{id:'comparar-financiamentos',cat:'Comprar',tier:'decision',icon:'⇄',title:'Comparar Propostas de Financiamento',desc:'SAC/Price, taxas, tarifas, seguros, valor presente e saldo futuro.',engine:'loanCompare',new:true},
{id:'financiamento-carro',cat:'Comprar',tier:'free',icon:'◈',title:'Financiamento de Veículo',desc:'Entrada, parcela e juros totais.',engine:'loan'},
{id:'custo-carro',cat:'Comprar',tier:'pro',icon:'◈',title:'Custo Real de um Carro',desc:'Depreciação, seguro, impostos, combustível e manutenção.',engine:'carCost'},
{id:'trocar-carro',cat:'Comprar',tier:'decision',icon:'↔',title:'Trocar de Carro x Manter o Atual',desc:'Financiamento, depreciação, custos de uso e patrimônio final.',engine:'carDecision',new:true},
{id:'imovel-na-planta',cat:'Comprar',tier:'decision',icon:'▥',title:'Imóvel na Planta x Esperar',desc:'Obra, correção, aluguel, financiamento na entrega e capital alternativo.',engine:'offPlan',new:true},

{id:'amortizar-investir',cat:'Decidir',tier:'decision',icon:'⇄',title:'Amortizar x Investir',desc:'Descubra o retorno necessário para não amortizar.',engine:'amortInvest',featured:true},
{id:'bonus-decidir',cat:'Decidir',tier:'decision',icon:'+',title:'13º / Bônus: Dívida x Investir x Reserva',desc:'Coloque um dinheiro extra em três destinos e compare o impacto.',engine:'windfallDecision',new:true},
{id:'custo-oportunidade',cat:'Decidir',tier:'free',icon:'Δ',title:'Custo de Oportunidade',desc:'Compare dois cenários de retorno.',engine:'opportunity'},
{id:'valor-presente',cat:'Decidir',tier:'free',icon:'←',title:'Valor Presente',desc:'Traga um valor futuro para hoje.',engine:'presentValue'},
{id:'valor-futuro',cat:'Decidir',tier:'free',icon:'→',title:'Valor Futuro',desc:'Projete um valor atual para o futuro.',engine:'futureValue'},

{id:'plano-dividas',cat:'Dívidas',tier:'decision',icon:'!',title:'Plano para Quitar Dívidas',desc:'Avalanche x bola de neve, prazo e juros.',engine:'debtPlan',featured:true},
{id:'portabilidade-divida',cat:'Dívidas',tier:'decision',icon:'⇄',title:'Portabilidade de Dívida',desc:'Compare o fluxo atual com uma nova proposta, incluindo taxas e custos.',engine:'debtPortability',new:true},
{id:'trocar-divida',cat:'Dívidas',tier:'free',icon:'↘',title:'Trocar uma Dívida',desc:'Compare duas taxas para o mesmo saldo.',engine:'debtSwap'},
{id:'cartao',cat:'Dívidas',tier:'free',icon:'!',title:'Crescimento da Dívida',desc:'Veja como uma taxa mensal afeta o saldo.',engine:'debtGrowth'},

{id:'reserva',cat:'Planejar',tier:'free',icon:'✓',title:'Reserva de Emergência',desc:'Meta de segurança e tempo para formar.',engine:'reserve',featured:true},
{id:'meta-financeira',cat:'Planejar',tier:'pro',icon:'◎',title:'Meta Financeira Pro',desc:'Aporte, prazo, taxa necessária e sensibilidade.',engine:'goal',featured:true},
{id:'viver-renda',cat:'Planejar',tier:'pro',icon:'R$',title:'Viver de Renda',desc:'Patrimônio necessário, renda sustentável, duração e legado.',engine:'liveIncome'},
{id:'independencia-financeira',cat:'Planejar',tier:'decision',icon:'◉',title:'Mapa de Independência Financeira',desc:'Cobertura do custo de vida, capital-alvo, marcos e tempo até a meta.',engine:'financialIndependence',new:true},
{id:'aposentadoria',cat:'Previdência',tier:'decision',icon:'∞',title:'Previdência / Aposentadoria',desc:'Patrimônio, renda, gap, idade e cenários.',engine:'retirement',featured:true},
{id:'pgbl-vgbl',cat:'Previdência',tier:'pro',icon:'P',title:'PGBL x VGBL',desc:'Compare bases tributáveis em uma simulação educacional.',engine:'pgblVgbl'},

{id:'salario-liquido',cat:'Trabalho',tier:'pro',icon:'R$',title:'Salário Líquido 2026',desc:'INSS, IRRF, dependentes e descontos.',engine:'salary',featured:true},
{id:'decimo-terceiro',cat:'Trabalho',tier:'free',icon:'13',title:'13º Salário',desc:'Estimativa proporcional bruta.',engine:'thirteenth'},
{id:'ferias',cat:'Trabalho',tier:'free',icon:'☀',title:'Férias',desc:'Salário + adicional constitucional de 1/3.',engine:'vacation'},
{id:'fgts',cat:'Trabalho',tier:'free',icon:'F',title:'Depósito de FGTS',desc:'Projete depósitos com alíquota informada.',engine:'fgtsDeposit'},

{id:'correcao',cat:'Ferramentas rápidas',tier:'free',icon:'↗',title:'Correção Monetária',desc:'Atualize um valor por índice acumulado.',engine:'correction'},
{id:'porcentagem',cat:'Ferramentas rápidas',tier:'free',icon:'%',title:'Porcentagem',desc:'Calcule um percentual de um valor.',engine:'percentage'},
{id:'desconto',cat:'Ferramentas rápidas',tier:'free',icon:'↓',title:'Desconto',desc:'Preço após desconto percentual.',engine:'discount'},

{id:'quanto-gastar',cat:'Vida financeira',tier:'free',icon:'R$',title:'Quanto Posso Gastar?',desc:'Renda menos essenciais e poupança desejada.',engine:'spending'},
{id:'quanto-guardar',cat:'Vida financeira',tier:'free',icon:'↓',title:'Quanto Guardar por Mês?',desc:'Converta uma taxa de poupança em valor.',engine:'saveRate'},
{id:'diagnostico',cat:'Vida financeira',tier:'pro',icon:'◎',title:'Diagnóstico Financeiro',desc:'Comprometimento, poupança, reserva e próximos passos.',engine:'diagnostic'}
];

root.AmareloCatalog = Object.freeze({
  journeys,
  tools
});
})(globalThis);
