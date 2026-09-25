# AMARELO 1.0 — Status Executivo

Atualizado em 25/09/2026.

## Situação
A fase de protótipo incremental terminou.

Existe uma única release:
- branch: `release/amarelo-1.0`;
- PR macro: **#11**;
- PR permanece em draft;
- produção atual permanece na `main`;
- último CI da release: verde antes desta atualização documental.

## Estrutura resolvida

### Frontend modular
- shell HTML;
- sistema visual;
- catálogo;
- finance-core;
- configuração de motores;
- cenários/what-if/drivers;
- execução dos motores;
- data store;
- runtime capabilities;
- API client;
- sync service;
- decisões/versões/relatórios;
- metas;
- dashboard;
- runtime principal.

### Backend modular
- Worker;
- router;
- health/capabilities;
- sessão;
- APIs privadas;
- repositories D1;
- segurança;
- rate limiting;
- identidade provider-neutral;
- billing provider-neutral.

### Banco pronto em código
Migrations append-only:
1. schema inicial;
2. commercial readiness;
3. sync de versões;
4. sync de metas;
5. rate limits;
6. identidade + billing provider-neutral.

O CI agora aplica todas as migrations em SQLite antes do merge.

## Qualidade
Cobertura automática:
- arquitetura e isolamento;
- finance-core;
- 12 motores prioritários;
- edge cases;
- Worker/API;
- sessão e segurança;
- billing lifecycle;
- contratos de UI;
- sincronização;
- migrations.

## Produto
Já implementado:
- 42 ferramentas;
- 12 motores prioritários em padrão ouro;
- cenários;
- E se?;
- drivers;
- break-even;
- sensibilidade;
- relatórios;
- histórico e timeline;
- fila de revisão;
- metas;
- backup local;
- sync local -> conta preparado;
- entitlement server-side preparado;
- PRO Beta sem cobrança.

## Segurança pronta em código
- token de sessão opaco de 256 bits;
- somente hash da sessão no D1;
- cookie HttpOnly/Secure/SameSite;
- logout;
- revogação de todas as sessões;
- same-origin em mutações;
- rate limit D1;
- request ID;
- erro 500 sanitizado;
- logs sem body financeiro;
- exportação autenticada;
- headers de segurança.

## Comercial
No 1.0 entram somente:
- Free;
- PRO.

Família e Professional permanecem pós-1.0.

Cobrança continua desativada.

## O que realmente bloqueia o lançamento

### 1. D1 no Cloudflare — ação de conta
- criar banco exclusivo `amarelo`;
- vincular binding `DB`;
- aplicar migrations 0001–0006.

### 2. Identidade — decisão
A infraestrutura de sessão e identidades está pronta, mas ainda é necessário aprovar a estratégia de autenticação antes de criar cadastro/login/recuperação.

### 3. Pagamento — decisão
Lifecycle, entitlement, schema e idempotência estão prontos. Falta escolher o processador para checkout/webhook/cancelamento real.

### 4. Domínio — ação de conta
Confirmar registro e apontar `oamarelo.com.br`.

### 5. Jurídico/comercial — aprovação
Rascunhos já existem:
- privacidade;
- termos;
- retenção/exclusão.

Faltam dados do responsável e aprovação final.

### 6. Última milha
Depois dos cinco pontos acima:
- ativar login;
- validar sync multi-dispositivo;
- ativar cobrança;
- revisar baseline regulatória imediatamente antes do lançamento;
- smoke visual final;
- health/capabilities em produção;
- tirar PR #11 de draft;
- merge;
- verificar Cloudflare;
- lançar.

## Regra
Não criar V18/V19/V20.

Qualquer item necessário ao lançamento entra no PR #11.  
Qualquer ideia não necessária ao 1.0 vai para pós-lançamento.
