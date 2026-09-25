# AMARELO — Commercial Readiness V17

## Diagnóstico

O produto já entrega valor matemático e de decisão, mas a experiência atual ainda não deve ser vendida como quatro planos comerciais completos.

### Free
**Pronto como produto de aquisição.**

Entrega:
- biblioteca de ferramentas;
- contas rápidas;
- decisões simples;
- até 3 decisões salvas localmente.

### PRO
**Pronto como preview/beta. Ainda não pronto para cobrança recorrente.**

Já entrega:
- motores de decisão profundos;
- Base / Conservador / Otimista;
- break-even;
- sensibilidade;
- “E se?”;
- versões;
- acompanhamento local;
- relatórios;
- comparação entre versões;
- fila de revisão.

Faltam para cobrança:
- conta segura;
- persistência no D1;
- sincronização entre dispositivos;
- controle real de assinatura;
- migração dos dados locais para a conta;
- política de recuperação de conta;
- termos e privacidade finais;
- validação de cobrança e cancelamento.

**Preço-alvo mantido:** R$ 24,90/mês.

Durante a beta, não há cobrança.

### Família
**Não vendável ainda.**

Precisa existir de verdade:
- workspaces familiares;
- até 4 perfis;
- convites e permissões;
- patrimônio consolidado;
- metas compartilhadas;
- decisões privadas e compartilhadas;
- separação correta de dados entre membros.

O schema D1 da V17 já prepara workspaces, membros e perfis financeiros.

### Professional
**Não vendável ainda.**

Precisa existir de verdade:
- workspace profissional;
- cadastro de clientes;
- decisões ligadas a clientes;
- histórico por cliente;
- relatórios com identidade profissional;
- exportação;
- organização por cliente;
- permissões e segregação de dados;
- termos adequados ao uso profissional.

O schema D1 da V17 já prepara clientes e relacionamentos com decisões.

## Regra de produto

Uma funcionalidade só pode ser citada como benefício de um plano pago se:
1. estiver implementada;
2. passar pelo CI;
3. estiver acessível ao plano;
4. não depender de um recurso inexistente;
5. tiver persistência segura quando a promessa exigir continuidade.

## Fases

### Fase A — Beta atual
- Free;
- PRO Preview;
- localStorage;
- sem cobrança;
- sem autenticação;
- sem sincronização.

### Fase B — PRO comercial
- D1;
- autenticação segura;
- decisões e versões persistentes;
- perfil persistente;
- sincronização;
- assinatura real;
- migração local -> nuvem.

### Fase C — Família
- workspaces;
- membros;
- perfis;
- compartilhamento;
- consolidação.

### Fase D — Professional
- clientes;
- relatórios profissionais;
- histórico;
- marca;
- exportação;
- organização de carteira.

## Dependências externas

O AMARELO continua limitado à arquitetura GitHub + Cloudflare neste momento.

Um processador de pagamentos será necessário para cobrança real. Nenhum será escolhido ou integrado sem aprovação explícita do responsável pelo projeto.

Autenticação também não deve ser improvisada. A implementação precisa prever:
- armazenamento seguro de credenciais ou identidade federada;
- sessões HttpOnly/Secure/SameSite;
- recuperação de conta;
- proteção contra abuso;
- isolamento entre workspaces.

## Critério para dizer “vale R$ 24,90/mês”

O PRO passa a justificar recorrência quando o usuário consegue:
- criar uma conta;
- abrir uma decisão em qualquer dispositivo;
- acompanhar versões ao longo do tempo;
- receber/visualizar revisões pendentes;
- atualizar premissas sem perder histórico;
- gerar relatório;
- perceber claramente o que mudou na decisão.

Até lá, o valor existe, mas a cobrança recorrente ainda não deve ser ativada.
