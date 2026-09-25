# AMARELO — V16 PRO Depth & Retention

## Objetivo
A V16 aumenta o valor percebido do PRO sem transformar o produto em um catálogo de calculadoras. O foco é:
- comparadores configuráveis;
- decisões de crédito mais auditáveis;
- relatórios que mostram evolução;
- motivos concretos para o usuário voltar ao Meu AMARELO.

## Renda Fixa Pro
O motor passa a comparar três alternativas configuráveis.

Cada produto pode ser:
- % do CDI tributado;
- % do CDI isento;
- prefixado tributado;
- prefixado isento.

Premissas por produto:
- taxa;
- custo anual;
- carência mínima.

Premissas globais:
- capital inicial;
- aporte mensal;
- prazo;
- CDI informado;
- inflação.

Saídas:
- valor líquido;
- ganho líquido;
- imposto estimado;
- valor real;
- ranking por valor líquido;
- sensibilidade ao CDI;
- break-even da segunda alternativa contra a primeira.

Produtos que não cumprem a carência informada ficam fora do ranking principal.

## Comparar Propostas de Financiamento
Compara duas propostas para o mesmo valor financiado.

Premissas:
- preço e entrada;
- SAC ou Price;
- taxa mensal;
- prazo;
- custos iniciais;
- seguros/tarifas mensais;
- horizonte para observar saldo;
- taxa alternativa para valor presente.

Saídas:
- primeira parcela;
- valor presente dos desembolsos;
- total nominal;
- saldo devedor no horizonte;
- caixa pago no horizonte;
- break-even da taxa da proposta B;
- curva de desembolso acumulado.

O valor presente é uma ferramenta de comparação econômica e não substitui o CET oficial.

## Meu AMARELO
Nova camada de recorrência:
- decisões acompanhadas;
- número de versões;
- decisões com histórico;
- decisões atualizadas nos últimos 30 dias;
- fila de revisão após 45 dias sem nova versão;
- reabertura da versão salva diretamente pelo painel.

O prazo de 45 dias é uma regra de produto para incentivar revisão das premissas, não uma recomendação financeira.

## Relatório PRO
O relatório passa a incluir:
- sensibilidade;
- comparação com a última versão salva;
- matriz Agora x Última versão;
- cenários;
- drivers;
- premissas;
- metodologia;
- break-even.

## Pergunte ao AMARELO
O roteador passa a reconhecer pedidos de comparação entre duas propostas de financiamento e tenta extrair:
- valor do bem;
- entrada;
- taxa da proposta A;
- taxa da proposta B;
- prazo de cada proposta.

## Guardrails
- taxas e condições são informadas pelo usuário;
- não há recomendação de produto;
- carência, risco de crédito e garantias continuam dimensões separadas;
- CET oficial, contratos e condições de instituição financeira devem ser verificados fora da simulação;
- tributação regulada deve continuar vinculada à baseline oficial documentada.
