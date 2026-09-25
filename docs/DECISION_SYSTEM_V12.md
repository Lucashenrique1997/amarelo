# AMARELO — Decision System V12

## Objetivo
A V12 transforma os principais motores do AMARELO de uma simulação isolada em um sistema de decisão com múltiplos cenários, versões e continuidade.

## Motores iniciais
O Decision System é aplicado primeiro em:
- Financiamento x Consórcio x Investir
- Comprar x Alugar
- Amortizar x Investir
- Previdência / Aposentadoria

## Cenários
Cada decisão começa com três cenários:

### Base
As premissas informadas pelo usuário.

### Conservador
Uma variação mais prudente das variáveis incertas. Serve como teste de resistência e **não representa previsão**.

### Otimista
Uma variação mais favorável das variáveis incertas. Serve como teste de folga e **não representa previsão**.

O usuário pode editar qualquer cenário. Se editar Conservador ou Otimista, ele deixa de ser recalculado automaticamente a partir da Base.

## Duplicar cenário
O usuário pode duplicar o cenário ativo para criar uma hipótese livre. A cópia é independente.

## E se?
Os controles rápidos alteram os principais direcionadores de cada motor sem reconstruir o formulário:
- financiamento/consórcio: taxa, contemplação, retorno alternativo;
- comprar/alugar: valorização, retorno, aluguel;
- amortizar/investir: retorno, capital, prazo;
- aposentadoria: retorno real, aporte, idade.

## Comparação
A comparação apresenta:
- cards por cenário;
- resposta principal;
- principais métricas;
- matriz lado a lado com métricas equivalentes quando disponíveis.

Não existe ordenação automática de “melhor cenário”. O AMARELO mostra consequências.

## Drivers
Cada motor explicita quatro direcionadores relevantes e o papel de cada um na conta.

Drivers não são um ranking estatístico de importância. São as variáveis estruturais que a metodologia identifica como centrais para a decisão.

## Versões
Ao salvar uma decisão compatível com V12, o AMARELO salva:
- versão;
- cenário ativo;
- premissas do cenário ativo;
- pacote completo de cenários;
- resposta;
- métricas;
- data.

Versões anteriores podem ser reabertas e comparadas lado a lado.

## Pergunte ao AMARELO
A V12 adiciona uma camada determinística de interpretação de linguagem natural.

Ela pode:
- identificar o motor provável;
- extrair alguns valores, idades, taxas e prazos;
- preencher campos identificados;
- listar os dados que ainda não foram encontrados.

Essa camada não substitui IA futura e não inventa premissas. Campos não identificados permanecem com os valores de exemplo do formulário e devem ser revisados pelo usuário.

## Princípios
1. matemática determinística;
2. premissas visíveis;
3. cenários como hipóteses, nunca previsões;
4. nenhuma escolha é feita pelo AMARELO;
5. histórico deve preservar a premissa usada na época;
6. linguagem natural ajuda a entrar na conta, não substitui a conta.
