# AMARELO 1.0 — Arquitetura

## Objetivo
Transformar o protótipo evolutivo em uma base de produto estável. O 1.0 não deve depender de um único HTML gigante nem misturar matemática, UI, persistência e API.

## Frontend

```
public/
  index.html                # shell estável
  assets/
    app.css                 # sistema visual
    catalog.js              # metadados das ferramentas
    finance-core.js         # matemática determinística reutilizável
    decision-config.js      # campos e metodologias dos motores
    decision-engines.js     # execução dos motores
    data-store.js           # adaptador de dados/cache local
    app.js                  # navegação, estado, dashboard, cenários, relatórios
```

### Fronteiras
- `index.html`: estrutura e conteúdo; sem CSS/JS inline.
- `app.css`: aparência; nenhuma regra financeira.
- `catalog.js`: catálogo e metadados; nenhuma conta.
- `finance-core.js`: funções puras; sem DOM, localStorage ou estado.
- `decision-config.js`: formulários e metodologia; sem persistência.
- `decision-engines.js`: orquestra cálculos; usa finance-core.
- `data-store.js`: contrato de armazenamento local; será camada de cache quando D1 estiver ativo.
- `app.js`: interface, navegação e composição.

## Worker

```
src/
  worker.js                 # composition root
  api/
    router.js               # roteamento
    health.js               # health check
  config/
    product.js              # capabilities/fase
  db/
    decisions.js            # decisões e versões
    profiles.js             # perfil financeiro
    workspaces.js           # workspaces
```

### Regra de segurança
Nenhuma API com dados pessoais é exposta sem autenticação. Os repositórios D1 podem existir antes das rotas autenticadas, mas não devem ser publicados como CRUD anônimo.

## Banco
Migrations são append-only:
- `0001_initial.sql`
- `0002_commercial_readiness.sql`

Não reescrever migrations aplicadas em produção.

## Testes
- `scripts/verify.mjs`: arquitetura, catálogo, isolamento, contratos.
- `scripts/test-finance-core.mjs`: matemática determinística.
- CI executa ambos.

## Deploy
- GitHub é a fonte de verdade.
- Cloudflare executa.
- `main` é produção.
- `release/amarelo-1.0` recebe a obra macro.
- Não fazer merges parciais na `main` apenas para “mostrar progresso”.
