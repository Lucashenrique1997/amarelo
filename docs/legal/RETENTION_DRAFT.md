# RASCUNHO — Política de Retenção e Exclusão

## Estado atual
Beta local:
- perfil e decisões ficam no localStorage do navegador;
- o usuário pode exportar backup;
- exclusão local ocorre ao remover os dados do navegador ou pelas ações do produto.

## 1.0 persistente — proposta
Antes do lançamento comercial, confirmar prazos finais.

### Conta ativa
Manter:
- perfil;
- decisões;
- versões;
- metas;
- assinatura;
enquanto necessários para prestar o serviço.

### Conta excluída
Fluxo desejado:
1. revogar sessões imediatamente;
2. marcar pedido de exclusão;
3. remover dados ativos em prazo operacional definido;
4. manter somente o que for necessário por obrigação legal/financeira;
5. expirar backups/logs conforme prazo documentado.

### Logs
Logs técnicos não devem incluir:
- patrimônio completo;
- renda completa;
- premissas da decisão;
- conteúdo do relatório.

Registrar preferencialmente:
- request ID;
- rota;
- método;
- status;
- duração;
- mensagem técnica sanitizada.

### Exportação
Antes da exclusão, o usuário deve poder exportar os dados da conta em formato estruturado.

## Campos pendentes
- prazo de exclusão de dados ativos;
- prazo de retenção de logs;
- prazo de retenção de dados fiscais de assinatura;
- política do processador de pagamento;
- política do provedor de autenticação.
