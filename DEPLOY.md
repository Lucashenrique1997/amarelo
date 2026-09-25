# Deploy do AMARELO

## Arquitetura oficial do MVP
GitHub -> Cloudflare Pages/Workers -> oamarelo.com.br
Cloudflare D1 -> banco SQL

O AMARELO permanece totalmente separado de Azul, Verde e Dourado.

## Primeiro deploy no Cloudflare
1. Workers & Pages > Create > Pages > Connect to Git
2. Selecione o repositório `Lucashenrique1997/amarelo`
3. Branch de produção: `main`
4. Framework preset: None
5. Build command: deixar vazio
6. Build output directory: `.`
7. Deploy

Depois do merge desta branch, a `main` conterá o site publicável.

## Banco D1
O schema inicial está em `migrations/0001_initial.sql`.
O banco NÃO deve ser criado dentro de outro projeto. Crie um D1 chamado `amarelo` no projeto/conta Cloudflare do AMARELO e vincule-o como `DB`.

## Domínio
Depois do deploy funcionar no domínio temporário do Cloudflare, conectar `oamarelo.com.br` em Custom Domains.
