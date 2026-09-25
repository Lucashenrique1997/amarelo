# AMARELO

**Central brasileira de decisões financeiras.**

> Antes de decidir, coloque na conta.

O AMARELO não é uma coleção de calculadoras. A proposta é transformar dúvidas financeiras reais em cenários comparáveis, com premissas visíveis, ponto de equilíbrio, sensibilidade e histórico.

## Arquitetura
- GitHub: código, branches, pull requests e histórico
- Cloudflare Workers + Static Assets: frontend e APIs
- Cloudflare D1: banco SQL planejado
- Domínio planejado: `oamarelo.com.br`

## Regra de isolamento
O AMARELO é isolado de Azul, Verde e Dourado. Nenhum banco, deploy, variável, domínio, segredo ou recurso deve ser compartilhado entre os projetos.

## Fluxo de desenvolvimento
`branch -> commits -> pull request -> CI -> revisão -> merge em main`

Não afirmar deploy sem verificar o estado real do Cloudflare ou do workflow de publicação.

## Produto
A experiência é organizada em três níveis:

1. **Ferramentas rápidas** — contas simples e gratuitas.
2. **Motores PRO** — decisões com cenários, break-even, sensibilidade e evolução.
3. **Meu AMARELO** — decisões salvas, premissas, favoritos, metas e continuidade.

A IA deve interpretar a intenção e explicar o resultado; a matemática deve permanecer em motores determinísticos e testáveis.

## Direção visual
- Amarelo como assinatura, não como preenchimento excessivo
- Fundo quente, preto suave e alto contraste
- Linguagem editorial e de decisão
- Menos “dashboard genérico”; mais contexto, consequência e comparação
- Mobile first sem sacrificar a experiência desktop

## Estado atual
- Worker `amarelo` já foi publicado manualmente no Cloudflare
- O deploy automático GitHub -> Cloudflare ainda não está ativo
- O frontend V9 está sendo desenvolvido no PR #1
- Decisões podem ser salvas localmente com as premissas e reabertas
- D1 ainda não foi criado/aplicado
- Autenticação, pagamento e IA real ainda não estão ativos

## Guardrails para lançamento
Regras tributárias, trabalhistas, previdenciárias e parâmetros regulados não devem ser tratados como definitivos sem validação atualizada antes de produção comercial.
