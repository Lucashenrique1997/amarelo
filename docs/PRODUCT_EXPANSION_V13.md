# AMARELO — Product Expansion V13

## Objetivo
A V13 aumenta a biblioteca sem reduzir o padrão médio de profundidade.

A regra é: novos produtos de alto impacto financeiro devem nascer como **Motores de Decisão**, e não como calculadoras isoladas.

## Novo motor — Portabilidade de Dívida

### Entradas
- saldo devedor;
- sistema atual: Price ou SAC;
- taxa atual;
- prazo restante;
- custos mensais atuais;
- novo sistema;
- nova taxa;
- novo prazo;
- custos iniciais;
- novos custos mensais;
- taxa alternativa para valor presente.

### Saídas
- primeira parcela atual e nova;
- valor presente de cada contrato;
- desembolso nominal;
- diferença econômica;
- sensibilidade à nova taxa;
- tarifa inicial de equilíbrio;
- taxa de equilíbrio quando existir;
- curva de desembolso acumulado.

### Princípio
A comparação não usa somente a taxa anunciada. Mudanças de prazo e custos de troca entram no mesmo fluxo.

## Novo motor — Trocar de Carro x Manter o Atual

### Carro atual
- valor de venda;
- depreciação;
- manutenção;
- seguro;
- IPVA/tributos;
- combustível.

### Novo carro
- preço;
- capital adicional;
- custos de compra;
- Price ou SAC;
- taxa e prazo;
- depreciação;
- manutenção;
- seguro;
- IPVA/tributos;
- combustível.

### Comparação
- os dois caminhos são levados ao mesmo horizonte;
- cada veículo perde valor pela depreciação informada;
- o financiamento reduz o patrimônio enquanto houver saldo;
- o lado com menor desembolso mensal investe a diferença;
- a comparação final usa veículo + investimento - dívida;
- o motor calcula um break-even de manutenção do veículo atual quando existir.

## Ferramentas existentes elevadas ao Decision System

### Renda Fixa Pro
Passa a ter:
- Base / Conservador / Otimista;
- duplicação;
- E se? para CDI, CDB e LCI/LCA;
- drivers explícitos;
- versões salvas.

### Meta Financeira Pro
Passa a ter:
- Base / Conservador / Otimista;
- E se? para retorno, aporte e prazo;
- drivers explícitos;
- versões salvas.

## Linguagem natural
Pergunte ao AMARELO passa a reconhecer também:
- portabilidade / refinanciamento;
- trocar de carro / manter o atual.

Quando consegue, pré-preenche saldo, taxas, valores, prazos e outros dados identificáveis.

## Guardrails
- cenários não são previsões;
- break-even só é exibido quando existe no intervalo testado;
- valores de exemplo continuam visíveis quando o texto do usuário não contém todos os dados;
- contratos reais podem conter regras e cobranças não informadas;
- nenhum motor decide pelo usuário.
