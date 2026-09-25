# AMARELO 1.0 — API Contract

## Princípios
- mesma origem;
- JSON;
- APIs financeiras privadas exigem sessão;
- ausência de D1 retorna 503;
- ausência de sessão retorna 401;
- nenhuma rota privada deve confiar em user_id enviado pelo cliente;
- user_id vem exclusivamente da sessão no servidor.

## Públicas

### GET /api/health
Uso: health check.

Resposta sem D1:
```json
{"ok":true,"app":"amarelo","database":"not-bound-yet"}
```

### GET /api/capabilities
Uso: expor o estado real do produto sem promessas falsas.

Campos atuais:
- phase
- database
- persistence
- authentication
- billing
- ai_interpretation
- local_decisions
- pro_beta

## Privadas /api/v1

Todas exigem:
- D1 configurado;
- cookie de sessão válido.

### GET /api/v1/profile
Retorna o perfil financeiro do usuário autenticado.

### PUT /api/v1/profile
Body:
```json
{
  "displayName":"...",
  "birthDate":"YYYY-MM-DD",
  "monthlyIncome":0,
  "financialWealth":0,
  "essentialExpenses":0,
  "emergencyReserve":0,
  "monthlyInvestment":0
}
```

### GET /api/v1/decisions
Lista decisões do usuário autenticado.

### POST /api/v1/decisions
Cria ou atualiza uma decisão e adiciona uma nova versão.

Body conceitual:
```json
{
  "decisionId":"opcional",
  "toolId":"comprar-alugar",
  "decisionKey":"comprar-alugar::meu-apartamento",
  "decisionName":"Meu apartamento",
  "title":"Comprar x Alugar",
  "status":"active",
  "workspaceId":"opcional",
  "scenarioLabel":"Base",
  "inputs":{},
  "outputs":{},
  "assumptions":{},
  "sensitivity":[],
  "primaryResult":"...",
  "summary":"...",
  "reviewDueAt":"ISO-8601 opcional"
}
```

O servidor ignora qualquer tentativa de enviar user_id.

### GET /api/v1/decisions/:id/versions
Lista versões da decisão, desde que ela pertença ao usuário autenticado.

### GET /api/v1/workspaces
Lista workspaces dos quais o usuário autenticado participa.

## Ainda não montadas
- cadastro;
- login;
- logout;
- recuperação de conta;
- billing;
- delete/export de conta;
- metas persistentes.

Essas rotas não devem ser simuladas antes de existirem.

## Sessão
Cookie planejado: `amarelo_session`.

Quando o mecanismo de login for implementado, o cookie deve ser criado com:
- HttpOnly;
- Secure;
- SameSite=Lax ou mais restritivo quando compatível;
- Path=/;
- expiração explícita.

## Erros
Formato:
```json
{"ok":false,"error":"error_code"}
```

Códigos já reservados:
- database_not_configured
- authentication_required
- content_type
- invalid_json
- missing_required_fields
- method_not_allowed
- not_found

## Segurança
- sem CORS aberto;
- sem IDs de usuário confiados do frontend;
- sem endpoints financeiros anônimos;
- JSON de API recebe Cache-Control: no-store;
- logs não devem carregar premissas financeiras completas.
