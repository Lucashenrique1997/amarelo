# AMARELO

Central brasileira de decisões financeiras.

## Arquitetura
- GitHub: código e histórico
- Cloudflare Pages/Workers: frontend, APIs e deploy
- Cloudflare D1: banco SQL
- Domínio planejado: oamarelo.com.br

## Regra de projeto
O AMARELO é isolado de Azul, Verde e Dourado. Nenhum banco, deploy, variável ou recurso deve ser compartilhado entre os projetos.

## Fluxo de desenvolvimento
branch -> commits -> pull request -> revisão -> merge em main

## Status
Fundação inicial. A próxima branch adiciona a aplicação e a estrutura Cloudflare.
