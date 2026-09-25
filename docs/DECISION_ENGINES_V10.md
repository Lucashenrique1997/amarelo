# AMARELO — Decision Engines V10

Este documento registra a lógica dos motores prioritários. A intenção é manter a matemática auditável e separar cálculo determinístico de interpretação por IA.

## 1. Financiamento x Consórcio x Investir

### Financiamento
- aceita Price ou SAC;
- calcula fluxo mensal;
- inclui custos iniciais sobre o crédito;
- permite seguro/tarifas mensais;
- mostra desembolso nominal e valor presente;
- usa o retorno alternativo informado como taxa de desconto.

### Consórcio
- contemplação é sempre um **cenário informado**, nunca uma previsão;
- taxa de administração, fundo/seguros e reajuste são premissas abertas;
- lance com recursos próprios é tratado como antecipação de caixa e reduz contribuições futuras no modelo;
- inclui custo mensal enquanto o usuário aguarda contemplação;
- calcula desembolso nominal, valor presente e sensibilidade à data de contemplação.

### Investir até comprar
- capital disponível permanece investido;
- aportes mensais são adicionados;
- o preço do bem evolui pela valorização informada;
- o motor busca o mês em que o patrimônio alcança o preço projetado do bem.

### Limitação
Contratos reais de consórcio podem ter regras específicas de lance, reajuste, seguros e amortização. O modelo serve para comparação de cenários, não para reproduzir regulamento de uma administradora.

## 2. Amortizar x Investir

O motor compara os dois usos do **mesmo capital** até o final do prazo original do financiamento.

### Amortização
- Price ou SAC;
- reduzir prazo ou reduzir parcela;
- calcula juros evitados;
- calcula o fluxo mensal liberado após a amortização;
- assume que esse caixa liberado é reinvestido.

### Investimento
- usa retorno bruto informado;
- desconta custo anual informado;
- aplica IR efetivo informado sobre o ganho;
- leva o capital inicial até o mesmo horizonte do financiamento.

### Comparação
A comparação principal é entre:
- valor líquido do capital mantido investido; e
- valor final do caixa liberado pela amortização e reinvestido.

Isso evita comparar um benefício distribuído no tempo com um valor futuro sem colocá-los no mesmo horizonte.

## 3. Comprar x Alugar

O motor compara **patrimônio líquido mês a mês**.

### Comprar
- Price ou SAC;
- entrada;
- custos de aquisição;
- manutenção;
- IPTU/seguros;
- custo mensal adicional do proprietário;
- valorização do imóvel;
- custo de venda/saída;
- saldo devedor.

### Alugar
- entrada + custos de aquisição que não foram usados na compra permanecem investidos;
- aluguel cresce pela taxa informada;
- retorno do investimento é informado pelo usuário.

### Regra de equilíbrio mensal
A cada mês, o caminho com menor custo de moradia investe a diferença:
- se possuir o imóvel custa mais, o inquilino investe a diferença;
- se alugar custa mais, o proprietário investe a diferença.

O financiamento deixa de gerar parcela quando termina. Isso evita prolongar artificialmente o custo do crédito em horizontes superiores ao prazo do financiamento.

## 4. Aposentadoria

A leitura principal é em **dinheiro de hoje**.

### Acumulação
- patrimônio atual;
- aporte mensal;
- aporte extra anual;
- retorno real antes de custos;
- custos anuais.

### Fase de renda
- renda mensal desejada em valores reais;
- idade de aposentadoria;
- idade final do plano;
- projeção mês a mês da fase de consumo.

### Respostas
- patrimônio projetado;
- patrimônio necessário;
- gap;
- aporte mensal de equilíbrio;
- idade aproximada em que o plano fecha mantendo o aporte atual;
- patrimônio ao fim do plano;
- sensibilidade ao retorno real;
- visão nominal usando a inflação informada.

### Limitação
Tributação específica de previdência, PGBL/VGBL, regime progressivo/regressivo, sucessão e particularidades de produto não estão embutidas neste motor geral.

## Princípio comum
Nenhum motor deve esconder uma premissa relevante. Quando uma variável é incerta, o produto deve expô-la como cenário ou sensibilidade, não transformá-la em “previsão”.
