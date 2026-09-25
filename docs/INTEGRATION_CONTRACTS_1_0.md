# AMARELO 1.0 — Contratos de Integração

Este documento evita acoplamento prematuro a fornecedores externos.

## Autenticação

### O que já está pronto
- sessão first-party;
- cookie `HttpOnly`;
- `Secure`;
- `SameSite=Lax`;
- token aleatório de 256 bits;
- somente hash SHA-256 do token é salvo no D1;
- expiração explícita;
- revogação de sessão;
- APIs privadas derivam `user_id` exclusivamente da sessão.

### O que o provedor/estratégia de identidade precisa entregar
Após validar a identidade, o fluxo de autenticação deve entregar apenas:
```
{
  userId: "id interno do AMARELO",
  email: "email normalizado/verificado quando aplicável"
}
```

A partir daí o AMARELO cria sua própria sessão.

### Estratégias que podem ser plugadas
- credencial própria;
- passkey/WebAuthn;
- OAuth/OIDC;
- magic link.

A escolha não deve alterar os contratos de decisão, perfil, metas e entitlement.

### Requisitos antes de ativar
- recuperação de conta;
- proteção contra enumeração;
- rate limit;
- prevenção de abuso;
- política para e-mail não verificado;
- revogação de todas as sessões;
- fluxo de exclusão.

---

## Pagamento

### Contrato lógico
A camada de cobrança deve transformar eventos externos em estado interno de assinatura:

```
subscriptions
  user_id
  plan
  status
  provider
  provider_customer_id
  provider_subscription_id
  current_period_end
```

### Estados internos mínimos
- free / active
- pro / active
- pro / past_due
- pro / canceled

### Regra
A interface nunca confia no checkout para liberar PRO.

Quem libera funcionalidades é exclusivamente:
`GET /api/v1/entitlements`

O webhook do processador atualiza `subscriptions`; o frontend lê entitlement do backend.

### Troca de processador
Código de checkout/webhook deve ficar atrás de um adapter. Motores, decisões e dashboard não podem conhecer Stripe, Mercado Pago ou outro nome de fornecedor.

---

## D1
D1 é a fonte de verdade para:
- identidade interna;
- sessões;
- perfil;
- decisões;
- versões;
- metas;
- workspaces;
- assinatura.

`localStorage` permanece apenas como cache/beta/offline transitório após a sincronização ser ativada.
