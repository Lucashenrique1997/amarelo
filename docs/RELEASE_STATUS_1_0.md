# AMARELO 1.0 — Status Executivo

Atualizado em 25/09/2026.

## Situação
A fase de protótipo incremental terminou.

O projeto está em uma única release:
- Branch: `release/amarelo-1.0`
- PR macro: #11
- Produção atual permanece na `main`
- O PR continua em draft até os gates de lançamento serem cumpridos.

## O que já está estruturalmente resolvido

### Produto
- catálogo amplo de ferramentas;
- 12 motores prioritários definidos;
- padrão PRO com cenários, E se?, drivers, sensibilidade, break-even e relatório;
- Meu AMARELO;
- decisões e versões;
- linha do tempo;
- fila de revisão;
- metas acompanhadas;
- onboarding;
- backup local;
- Free e PRO com promessa comercial coerente.

### Engenharia
Frontend modular:
- shell;
- visual;
- catálogo;
- finance-core;
- configuração;
- cenários;
- motores;
- data store;
- capabilities;
- API client;
- sync service;
- histórico/relatório;
- metas;
- dashboard;
- runtime principal.

Backend modular:
- Worker;
- API router;
- sessão;
- perfil;
- decisões;
- versões;
- workspaces;
- metas;
- entitlements;
- exportação;
- segurança.

### D1 pronto em código
Migrations:
1. schema inicial;
2. commercial readiness;
3. segurança de sincronização de versões;
4. segurança de sincronização de metas.

A migração local -> conta é idempotente:
- `clientVersionId`;
- `clientGoalId`.

### Segurança
- nenhuma API privada anônima;
- user_id vem da sessão do servidor;
- headers de segurança;
- API JSON com no-store;
- request ID;
- erro 500 sanitizado;
- logs sem body financeiro;
- exportação de dados preparada.

### Qualidade
CI cobre:
- arquitetura;
- isolamento do AMARELO;
- finance-core;
- 12 motores prioritários;
- edge cases;
- Worker/API;
- sincronização.

## O que está implementado mas aguardando ativação

### Conta + persistência
Código pronto:
- API de perfil;
- decisões;
- versões;
- metas;
- workspaces;
- sync;
- entitlement;
- exportação.

Bloqueio:
- D1 real;
- binding DB;
- autenticação real;
- migrations aplicadas.

### PRO
Código pronto:
- entitlement server-side;
- feature flags;
- PRO Beta preservado sem cobrança.

Bloqueio:
- processador de pagamento;
- checkout/ciclo de assinatura.

## Bloqueios que exigem decisão/ação do responsável

### 1. Cloudflare D1
Necessário criar o banco exclusivo `amarelo`, vincular `DB` e aplicar migrations.

### 2. Estratégia de autenticação
Precisa ser aprovada antes de cadastro/login/recuperação.

### 3. Pagamento
Precisa escolher e aprovar processador/custos antes de cobrança.

### 4. Domínio
Confirmar registro e apontamento de `oamarelo.com.br`.

### 5. Jurídico/comercial final
Aprovar:
- responsável legal;
- canal de suporte/privacidade;
- termos;
- política de privacidade;
- retenção/exclusão;
- preço final.

## Última milha após os bloqueios
Depois dos cinco pontos acima:
1. ativar conta;
2. validar persistência multi-dispositivo;
3. ativar checkout;
4. revisar regras oficiais;
5. QA visual desktop/mobile;
6. smoke test em produção;
7. tirar PR #11 de draft;
8. merge na main;
9. verificar Cloudflare;
10. declarar AMARELO 1.0 lançado.

## Regra operacional
Não criar nova versão numerada para cada melhoria.

Toda alteração necessária ao lançamento entra no PR #11 até o Definition of Done.

Itens não essenciais vão para pós-1.0.
