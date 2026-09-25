# AMARELO — Reports & Decision History V14

## Objetivo
A V14 transforma o histórico local do AMARELO em casos financeiros identificáveis e adiciona uma saída profissional para cada análise.

## Decisões nomeadas
Cada simulação pode receber um nome próprio, por exemplo:
- Apartamento Jardim Vivendas
- Portabilidade Banco A
- Troca do carro da família
- Aposentadoria aos 60

O nome é opcional. Quando vazio, o título do motor é usado.

## Chave da decisão
Uma decisão é identificada por:
- motor financeiro;
- nome normalizado do caso.

Isso permite que duas análises feitas no mesmo motor permaneçam separadas.

Exemplo:
- Comprar x Alugar / Apartamento A
- Comprar x Alugar / Casa B

## Histórico e versões
Ao salvar novamente a mesma decisão:
- a versão é incrementada;
- premissas permanecem preservadas;
- pacote de cenários é preservado;
- cenário ativo é preservado;
- resultado e métricas são preservados.

O Meu AMARELO mostra uma linha por decisão e a versão mais recente, em vez de repetir todas as versões na tela principal.

Quando há mais de uma versão, o usuário pode abrir o histórico e comparar até seis versões.

## Relatório AMARELO
Usuários fora do plano Free podem gerar uma prévia de relatório pronta para impressão / salvar em PDF pelo navegador.

O relatório inclui, quando disponível:
- nome da decisão;
- motor utilizado;
- cenário ativo;
- resposta;
- métricas principais;
- drivers;
- premissas;
- leitura do resultado;
- break-even;
- comparação de cenários;
- metodologia;
- disclaimer educacional.

O relatório não transforma a simulação em recomendação financeira.

## Privacidade nesta fase
Os nomes, decisões, versões e relatórios continuam baseados em dados armazenados no navegador via localStorage.

Não existe sincronização em nuvem ainda.

## Próxima etapa estrutural
Quando D1 e autenticação forem ativados, a unidade de persistência deverá ser a decisão identificada, com versões relacionadas por uma chave estável gerada pelo backend.
