# AMARELO

**Central brasileira de decisões financeiras.**

> Antes de decidir, coloque na conta.

O AMARELO transforma dúvidas financeiras reais em cenários comparáveis, com premissas visíveis, ponto de equilíbrio, sensibilidade, versões e acompanhamento.

## Arquitetura
- GitHub: código, branches, pull requests e histórico
- Cloudflare Workers + Static Assets: frontend e APIs
- Cloudflare D1: banco planejado e schema versionado
- Worker de produção: `amarelo` no ambiente Cloudflare LUCAS DEV
- Domínio definitivo planejado: `oamarelo.com.br`

## Regra de isolamento
O AMARELO é isolado de Azul, Verde e Dourado. Nenhum banco, deploy, variável, domínio, segredo ou recurso deve ser compartilhado entre os projetos.

## Fluxo de desenvolvimento
`branch -> commits -> pull request -> CI -> merge em main -> publicação Cloudflare -> verificação`

Nunca considerar um deploy concluído apenas porque houve merge. Produção deve ser verificada.

## Produto atual

### Free
- ferramentas rápidas;
- simulações básicas;
- até 3 decisões salvas localmente;
- biblioteca de decisões.

### PRO Preview
Durante a beta, o PRO está liberado sem cobrança:
- motores de decisão;
- Base / Conservador / Otimista;
- break-even;
- sensibilidade;
- “E se?”;
- versões;
- fila de revisão;
- relatórios;
- comparação de versões.

Preço-alvo de lançamento: **R$ 24,90/mês**, condicionado à persistência e conta online.

### Família e Professional
Estão em desenvolvimento e **não devem ser vendidos como produtos ativos**.

## Persistência
Hoje:
- decisões, perfil e preferências ficam no navegador;
- `/api/health` informa se o D1 está vinculado;
- `/api/capabilities` expõe o estado real das capacidades da beta.

Preparado no schema:
- usuários;
- sessões;
- decisões;
- versões;
- workspaces;
- membros;
- perfis financeiros;
- clientes;
- metas;
- assinaturas.

Preparado no código, mas dependente do D1 externo:
- autenticação por e-mail e senha;
- sessão segura;
- persistência/sincronização de perfil, favoritos, decisões e versões;
- migração inicial de dados locais para a conta.

Ainda não ativo em produção enquanto o D1 não estiver vinculado e migrado:
- autenticação online;
- persistência/sincronização D1;
- cobrança;
- recuperação de senha por e-mail;
- IA interpretativa real.

## IA
A matemática deve permanecer determinística e testável.

“Pergunte ao AMARELO” atualmente faz roteamento e extração estruturada em beta. Uma camada de IA interpretativa real só deve ser anunciada quando estiver conectada e validada.

## Direção visual
- amarelo como assinatura;
- fundo quente e preto suave;
- linguagem editorial;
- decisões antes de ferramentas;
- resultado como workspace;
- mobile first.

## Guardrails comerciais
- não anunciar funcionalidade inexistente;
- não cobrar durante a beta atual;
- não ativar Família/Professional antes dos respectivos workspaces;
- não afirmar sincronização enquanto os dados estiverem em localStorage;
- não chamar roteamento local de “IA real”;
- não integrar processador de pagamento sem aprovação explícita;
- regras tributárias e regulatórias precisam de baseline atualizada antes do lançamento comercial.

## Documentos principais
- `docs/PRODUCT_NORTH_STAR.md`
- `docs/VISUAL_SYSTEM_V11.md`
- `docs/DECISION_ENGINES_V10.md`
- `docs/V16_PRO_DEPTH_RETENTION.md`
- `docs/COMMERCIAL_READINESS_V17.md`


## AMARELO 1.0

O ciclo atual deixa de priorizar novas versões numeradas e passa a priorizar a fundação 1.0: arquitetura, legibilidade, persistência, autenticação, testes e prontidão de produção.

Documento: `docs/AMARELO_1_0.md`

- `docs/CLOUDFLARE_HANDOFF.md`
