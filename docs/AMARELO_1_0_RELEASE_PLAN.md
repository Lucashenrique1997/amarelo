# AMARELO 1.0 — Plano fechado de lançamento

## Regra daqui para frente
Não haverá V18, V19, V20.

Existe uma única entrega: **AMARELO 1.0**.

Melhorias que não forem necessárias para o 1.0 entram em **Depois do lançamento**.

---

## O que o 1.0 é

Produto brasileiro de decisão financeira para consumidor final.

### Planos no lançamento
1. **Free**
2. **PRO**

### Fora do 1.0
- Família
- Professional
- Open Finance
- aplicativo nativo
- recomendação personalizada de investimento
- integração com corretoras/bancos
- marca branca
- gestão profissional de clientes

Esses itens não podem atrasar o lançamento consumidor.

---

## Produto fechado

### Biblioteca
O catálogo atual é suficiente. O 1.0 não tem meta de quantidade de ferramentas.

Motores prioritários que precisam estar em padrão ouro:
- Financiamento x Consórcio x Investir
- Comprar x Alugar
- Comparar Propostas de Financiamento
- Imóvel na Planta x Esperar
- Amortizar x Investir
- Renda Fixa Pro
- Aposentadoria
- Viver de Renda
- Independência Financeira
- Plano de Dívidas
- Portabilidade de Dívida
- À Vista x Parcelado

As demais ferramentas são aquisição/conveniência.

### Padrão ouro
Quando aplicável:
- resposta direta;
- premissas;
- Base / Conservador / Otimista;
- E se?;
- drivers;
- break-even;
- sensibilidade;
- evolução temporal;
- metodologia;
- salvar;
- versionar;
- relatório.

---

## Workstreams finitos

### A. Arquitetura
- [x] HTML shell separado
- [x] CSS separado
- [x] catálogo separado
- [x] núcleo financeiro separado
- [x] configuração de motores separada
- [x] execução de motores separada
- [x] adaptador de dados criado
- [x] Worker modular
- [x] repositórios D1 criados
- [x] testes matemáticos iniciais
- [x] CI com fronteiras arquiteturais
- [x] reduzir responsabilidades restantes do app.js onde trouxer benefício real

**Gate:** código alterável sem editar um monólito.

### B. Matemática e qualidade
- [x] baseline regulatória 2026
- [x] motores prioritários existentes
- [x] testes do núcleo financeiro
- [x] casos de teste de referência por motor prioritário
- [x] edge cases: zero, prazo curto, retorno negativo, taxas extremas
- [ ] revisão final de regras tributárias imediatamente antes do lançamento

**Gate:** nenhum motor prioritário vai ao lançamento sem caso de teste conhecido.

### C. Conta e identidade
- [ ] estratégia de autenticação aprovada
- [ ] cadastro/login
- [ ] sessão segura
- [ ] logout
- [ ] recuperação de conta
- [ ] proteção contra abuso

**Gate:** nenhuma API de dados pessoais sem identidade autenticada.

### D. D1 + sincronização
- [x] schema inicial
- [x] schema de workspaces/versões
- [x] repository layer
- [ ] D1 `amarelo` criado no Cloudflare
- [ ] binding `DB`
- [ ] migrations aplicadas
- [x] API autenticada de perfil (implementada; ativação depende de D1 + login)
- [x] API autenticada de decisões (implementada; ativação depende de D1 + login)
- [x] API autenticada de versões (implementada; ativação depende de D1 + login)
- [x] migração localStorage -> conta (implementada; ativação depende de D1 + login)
- [x] sincronização multi-dispositivo (camada implementada; ativação depende de D1 + login)
- [x] conflito/versionamento append-only com IDs idempotentes

**Gate:** decisões sobrevivem a logout, navegador e dispositivo.

### E. Meu AMARELO
- [x] decisões locais
- [x] versões locais
- [x] fila de revisão
- [x] comparação de versões
- [ ] persistência online
- [x] metas persistentes (UI + API + sync implementados; ativação depende de D1 + login)
- [x] linha do tempo da decisão
- [x] estado vazio/onboarding final

**Gate:** existe motivo real para retornar ao produto.

### F. PRO
- [x] Free x PRO conceitualmente separados
- [x] PRO Beta sem cobrança
- [x] pricing honesto
- [x] entitlement vindo do backend (feature-gated; ativação depende de login)
- [ ] checkout
- [ ] assinatura
- [ ] cancelamento
- [ ] falha de pagamento
- [ ] downgrade sem perda indevida de dados

**Gate:** cobrança só é ativada quando entitlement e ciclo de assinatura funcionarem ponta a ponta.

### G. Relatórios
- [x] relatório no produto
- [x] cenários
- [x] sensibilidade
- [x] versão anterior
- [x] impressão/PDF implementada e endurecida para desktop/mobile (validação visual final no smoke test)
- [x] cabeçalho/rodapé final
- [x] identificação da decisão
- [x] disclaimer final

### H. Segurança, privacidade e operação
- [ ] política de privacidade
- [ ] termos de uso
- [ ] política de retenção/exclusão
- [x] headers revisados
- [x] rate limiting de APIs privadas de escrita (D1-backed; ativação depende do binding DB)
- [x] logs sem dados financeiros sensíveis
- [x] tratamento global de erros
- [x] backup/exportação básica do usuário

### I. Lançamento
- [ ] domínio `oamarelo.com.br`
- [x] SEO/meta/social
- [ ] mobile final
- [ ] desktop final
- [ ] smoke test de produção
- [ ] checkout testado
- [ ] health/capabilities verdes

---

## Definition of Done — AMARELO 1.0

O projeto só é chamado de **1.0 pronto** quando:

1. Free funciona sem conta.
2. PRO possui conta real.
3. decisões PRO são persistentes.
4. histórico e versões funcionam entre dispositivos.
5. 12 motores prioritários possuem testes.
6. relatório funciona.
7. cobrança e cancelamento funcionam.
8. regras oficiais foram revisadas.
9. privacidade/termos estão publicados.
10. domínio definitivo está ativo.
11. CI está verde.
12. produção foi verificada.

---

## Decisões que exigem o responsável pelo projeto

A execução técnica não deve parar para pedir opinião sobre detalhes reversíveis.

Só interromper para:
1. **criar/vincular recurso Cloudflare que exige ação de conta**;
2. **aprovar estratégia de autenticação**;
3. **aprovar processador/custo de pagamento**;
4. **registrar/apontar domínio**;
5. **aprovar termos/preço antes de cobrança real**.

Todo o restante é responsabilidade de execução do projeto.


---

## Depois do lançamento

Itens que não bloqueiam o AMARELO 1.0:
- analytics de produto;
- Família;
- Professional;
- Open Finance;
- aplicativo nativo;
- integrações bancárias/corretoras;
- white label;
- automações avançadas;
- novos motores além do catálogo atual.

Esses itens só entram depois que o 1.0 estiver publicado e sendo usado.
