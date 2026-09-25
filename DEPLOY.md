# Deploy do AMARELO 1.0

## Produção conhecida
- Cloudflare account/workspace: **LUCAS DEV**
- Worker: `amarelo`
- URL temporária validada pelo responsável: `https://amarelo.lucas-dev-260.workers.dev/`
- GitHub: `Lucashenrique1997/amarelo`

A conexão GitHub -> Cloudflare existe no ambiente LUCAS DEV. Até o comportamento automático estar observado de forma consistente, cada release só deve ser considerada publicada depois de verificação real do site.

## Arquitetura
```
GitHub
  ↓
Cloudflare Worker amarelo
  ├─ Static Assets (public/)
  ├─ API (src/api/)
  ├─ Security headers (src/http/)
  └─ futuro D1 binding DB
```

## Branches
- `main`: produção
- `release/amarelo-1.0`: obra macro do 1.0

A release 1.0 não deve ser mergeada parcialmente apenas para mostrar progresso.

## Verificação antes de produção
1. CI verde.
2. PR de release fora de draft.
3. merge na `main`.
4. Cloudflare concluir implantação.
5. abrir produção.
6. validar home e motor prioritário.
7. validar `/api/health`.
8. validar `/api/capabilities`.
9. somente então declarar deploy concluído.

## D1
Banco planejado: `amarelo`.

Quando o recurso existir:
```toml
[[d1_databases]]
binding = "DB"
database_name = "amarelo"
database_id = "<DATABASE_ID>"
migrations_dir = "migrations"
```

Sequência:
1. criar D1 exclusivo do AMARELO;
2. obter database ID;
3. adicionar binding;
4. aplicar migrations em ordem;
5. testar health;
6. só depois habilitar APIs autenticadas.

Nunca reutilizar banco, segredo ou binding de Azul, Verde ou Dourado.

## Domínio
Domínio-alvo: `oamarelo.com.br`.

Só apontar o domínio quando:
- release candidata estiver estável;
- HTTPS estiver validado;
- rotas SPA e API estiverem funcionando;
- páginas legais estiverem prontas.

## Regra
**GitHub é a fonte de verdade. Cloudflare é execução. Produção só existe quando foi verificada.**
