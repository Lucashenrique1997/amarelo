# AMARELO 1.0 — Foundation

## Objetivo

Encerrar o ciclo de versões incrementais focadas em quantidade e transformar o AMARELO em uma plataforma pronta para evoluir com segurança.

## Decisão de produto

Até a base 1.0 estar pronta:
- congelar expansão indiscriminada do catálogo;
- priorizar qualidade dos motores existentes;
- priorizar conta, persistência, sincronização, testes e experiência;
- manter cobrança desativada;
- manter Família e Professional como futuros produtos.

## Padrão visual obrigatório

Legibilidade é requisito funcional.

- corpo de texto: 15–16 px;
- inputs: 16 px;
- navegação e botões: 14 px ou maior;
- textos auxiliares importantes: 12–13 px ou maior;
- títulos com contraste e hierarquia clara;
- nenhum dado financeiro relevante deve depender de texto minúsculo;
- mobile deve manter leitura confortável sem zoom.

## Arquitetura pública

A aplicação deixa de concentrar CSS e JavaScript dentro de um único HTML.

- `public/index.html`: shell semântico;
- `public/assets/styles.css`: sistema visual;
- `public/assets/app.js`: aplicação atual;
- `src/worker.js`: APIs e entrega segura de assets.

Esta é uma etapa de transição. O próximo desmembramento deve separar catálogo, motores matemáticos, serviços e componentes sem reescrever as regras já validadas.

## Próximos gates

### Gate 1 — Plataforma
- D1 vinculado;
- migrações aplicadas;
- autenticação segura;
- perfil persistente;
- decisões e versões persistentes;
- migração local -> nuvem.

### Gate 2 — Confiança
- testes determinísticos por motor prioritário;
- casos de borda;
- baseline tributária/regulatória;
- analytics;
- monitoramento de erros.

### Gate 3 — Experiência
- jornadas guiadas por intenção;
- Pergunte ao AMARELO conectado aos motores;
- acessibilidade;
- revisão mobile/desktop;
- domínio definitivo.

### Gate 4 — Comercial
- termos e privacidade;
- assinatura;
- cancelamento;
- recuperação de conta;
- validação completa antes da primeira cobrança.
