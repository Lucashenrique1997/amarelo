# Deploy do AMARELO

## Arquitetura oficial
```
GitHub
  ↓
Cloudflare Worker `amarelo`
  ├─ Static Assets (`public/`)
  ├─ API (`src/worker.js`)
  └─ futuro D1 binding `DB`

Domínio futuro: oamarelo.com.br
```

O AMARELO permanece isolado de Azul, Verde e Dourado.

## Estado verificado
- Existe um Worker Cloudflare chamado `amarelo`.
- Ele foi publicado manualmente e já abriu no endereço temporário `amarelo.lucashenriquebezerra.workers.dev`.
- Esse deploy manual **não implica** que a versão atualmente no Cloudflare seja igual à versão mais recente deste repositório.
- A automação GitHub -> Cloudflare está propositalmente pausada até a autenticação ser resolvida.

## Publicação manual temporária
Enquanto o deploy automatizado não estiver validado:
1. desenvolver em branch;
2. validar via CI;
3. revisar o pull request;
4. gerar/publicar a versão aprovada no Worker `amarelo`;
5. confirmar visualmente e pelo endpoint `/api/health`;
6. somente então considerar o deploy concluído.

Nunca afirmar que uma versão está em produção sem essa verificação.

## Deploy via GitHub Actions
O workflow `.github/workflows/deploy.yml` existe, mas atualmente é **manual** (`workflow_dispatch`).

Antes de utilizá-lo, o repositório precisa ter:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

O token deve ter apenas as permissões necessárias para publicar o AMARELO. Não compartilhar tokens em chats ou documentação.

Quando o fluxo estiver validado de ponta a ponta, o gatilho poderá voltar a ser `push` na branch `main`.

## Cloudflare D1
O schema inicial está em `migrations/0001_initial.sql`.

O banco ainda não foi criado/aplicado.

Quando chegar essa etapa:
- criar D1 chamado `amarelo`;
- vincular ao Worker como binding `DB`;
- adicionar o `database_id` real ao `wrangler.toml`;
- aplicar migrations;
- testar `/api/health`;
- nunca reutilizar banco de outro projeto.

## Domínio
Depois que o Worker e o deploy estiverem estáveis:
1. confirmar o registro de `oamarelo.com.br`;
2. configurar o domínio no Cloudflare;
3. validar HTTPS;
4. validar redirecionamentos;
5. confirmar que o Worker `amarelo` responde no domínio definitivo.

## Regra de ouro
**GitHub é a fonte de verdade do código. Cloudflare é a camada de execução.**
Se houver divergência entre os dois, o deploy deve ser considerado pendente até ser reconciliado.
