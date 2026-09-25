# AMARELO — Baseline regulatória 2026

Última revisão manual: **25/09/2026**

Este arquivo registra parâmetros regulados usados ou previstos em motores do AMARELO. Ele não substitui nova validação antes de um lançamento comercial.

## INSS — empregado, empregado doméstico e trabalhador avulso
Válido a partir da competência janeiro/2026, conforme tabela oficial do INSS:

| Faixa de salário de contribuição | Alíquota progressiva |
| --- | ---: |
| até R$ 1.621,00 | 7,5% |
| R$ 1.621,01 a R$ 2.902,84 | 9% |
| R$ 2.902,85 a R$ 4.354,27 | 12% |
| R$ 4.354,28 a R$ 8.475,55 | 14% |

Fonte oficial:
https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal

## IRRF mensal — 2026

| Base de cálculo | Alíquota | Dedução |
| --- | ---: | ---: |
| até R$ 2.428,80 | 0% | R$ 0 |
| R$ 2.428,81 a R$ 2.826,65 | 7,5% | R$ 182,16 |
| R$ 2.826,66 a R$ 3.751,05 | 15% | R$ 394,16 |
| R$ 3.751,06 a R$ 4.664,68 | 22,5% | R$ 675,49 |
| acima de R$ 4.664,68 | 27,5% | R$ 908,73 |

Outros parâmetros:
- dedução mensal por dependente: R$ 189,59
- desconto simplificado mensal: R$ 607,20
- redução do imposto até rendimentos de R$ 5.000: limitada ao imposto calculado, até R$ 312,89
- redução decrescente de R$ 5.000,01 a R$ 7.350: R$ 978,62 - (0,133145 × rendimentos tributáveis sujeitos à incidência mensal)

Fonte oficial:
https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026

Exemplos oficiais:
https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025

## Renda fixa em geral — IR sobre rendimentos

| Prazo | Alíquota |
| --- | ---: |
| até 180 dias | 22,5% |
| 181 a 360 dias | 20% |
| 361 a 720 dias | 17,5% |
| acima de 720 dias | 15% |

Fonte oficial:
https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026

## Guardrail
Antes de disponibilizar qualquer motor regulado como funcionalidade comercial:
1. revisar a fonte oficial;
2. registrar a data de revisão;
3. validar testes com casos oficiais quando existirem;
4. evitar hardcode sem documentação;
5. mostrar ao usuário que folha real e tributação podem conter exceções específicas.
