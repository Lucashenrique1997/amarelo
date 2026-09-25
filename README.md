# AMARELO

**Central brasileira de decisões financeiras.**

> Antes de decidir, coloque na conta.

## Estado do projeto
O desenvolvimento agora está concentrado em uma única entrega: **AMARELO 1.0**.

Não existe mais ciclo de V18/V19/V20. A branch `release/amarelo-1.0` permanece aberta até cumprir o Definition of Done.

## Produto 1.0
Lançamento consumidor:
- **Free**
- **PRO**

Fora do 1.0:
- Família
- Professional
- Open Finance
- app nativo
- white label
- integrações com bancos/corretoras

## Arquitetura frontend
```
public/
  index.html
  assets/
    app.css
    catalog.js
    finance-core.js
    decision-config.js
    decision-engines.js
    data-store.js
    runtime-capabilities.js
    api-client.js
    sync-service.js
    decision-history.js
    goals.js
    dashboard.js
    app.js
```

Responsabilidades separadas:
- shell;
- visual;
- catálogo;
- matemática;
- configuração;
- execução de motores;
- dados;
- UI/estado.

## Backend
```
src/
  worker.js
  api/
  config/
  db/
  http/
```

O Worker não expõe CRUD financeiro sem autenticação.

## Banco
Migrations:
- `0001_initial.sql`
- `0002_commercial_readiness.sql`
- `0003_sync_safety.sql`
- `0004_goals_sync.sql`

Repository layer já existe para:
- decisões e versões;
- perfil;
- workspaces;
- metas;
- entitlements.

O binding D1 ainda não está ativo.

## Qualidade
CI do 1.0 valida:
- arquitetura;
- isolamento do projeto;
- catálogo;
- ausência de regressão para monólito;
- finance-core;
- 12 motores prioritários.

Comandos:
```bash
npm run verify
npm run test:finance
npm run test:engines
npm test
```

Sem dependências npm de runtime nesta fase.

## Comercial
Durante a beta:
- sem cobrança;
- Free ativo;
- PRO Preview ativo;
- R$ 24,90/mês é preço-alvo de lançamento;
- Família e Professional não são vendáveis.

## Cloudflare
Ambiente: **LUCAS DEV**  
Worker: `amarelo`  
URL temporária validada: `amarelo.lucas-dev-260.workers.dev`

## Documentos principais
- `docs/AMARELO_1_0_RELEASE_PLAN.md`
- `docs/ARCHITECTURE_1_0.md`
- `docs/PRODUCT_NORTH_STAR.md`
- `docs/COMMERCIAL_READINESS_V17.md`
- `DEPLOY.md`

## Regra de isolamento
Nada do AMARELO deve compartilhar banco, segredo, deploy ou recurso com Azul, Verde ou Dourado.
