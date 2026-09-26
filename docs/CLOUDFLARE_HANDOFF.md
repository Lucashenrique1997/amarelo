# AMARELO 1.0 — Cloudflare handoff

O código de conta, autenticação e sincronização está preparado. Esta etapa depende de acesso externo ao Cloudflare.

## O que precisa ser feito no Cloudflare

1. Criar um D1 exclusivo chamado `amarelo`.
2. Copiar o `database_id` criado.
3. Ativar no `wrangler.toml` o binding:
   - binding: `DB`
   - database_name: `amarelo`
   - database_id: o ID real do D1
   - migrations_dir: `migrations`
4. Aplicar, em ordem, as migrations:
   - `0001_initial.sql`
   - `0002_commercial_readiness.sql`
   - `0003_cloud_core.sql`
5. Confirmar no GitHub Actions os secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
6. Fazer o deploy e validar:
   - `/api/health` deve retornar `database: "d1"`;
   - `/api/capabilities` deve retornar `authentication: true` e `cloud_sync: true`;
   - `/api/version` deve retornar `product: "1.0-cloud-core"`.

## O que já está pronto no código

- cadastro com e-mail e senha;
- PBKDF2-SHA256 com 210.000 iterações e salt aleatório;
- sessão de 30 dias por cookie HttpOnly / Secure / SameSite=Lax;
- rate-limit para tentativas de login;
- logout e invalidação de sessão;
- sincronização de perfil;
- sincronização de favoritos;
- sincronização de decisões;
- sincronização de versões;
- migração inicial dos dados locais para a conta;
- fallback integral para localStorage quando D1 não está disponível;
- backup JSON local;
- verificação de schema antes de anunciar nuvem como ativa.

## Dependências que continuam externas

- recuperação de senha por e-mail: exige provedor transacional;
- login Google/Apple: exige configuração dos provedores;
- cobrança: exige processador de pagamentos;
- domínio definitivo: exige DNS.

Nenhum desses recursos é anunciado como ativo antes da integração real.
