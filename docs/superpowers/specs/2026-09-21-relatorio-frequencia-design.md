# Relatório de frequência — design

## Objetivo

Entregar uma página administrativa que consolide a frequência por estudante e permita consultar o histórico individual no mesmo período. A tela deve tornar visíveis faltas, faltas consecutivas e a situação do benefício sem duplicar as regras calculadas pelo backend.

## Escopo

- Criar a rota `/frequencias/relatorio` e adicioná-la à navegação.
- Consultar `GET /frequencias/relatorio` com filtros de período, linha e mínimo de faltas consecutivas.
- Exibir os totais retornados pelo backend e uma tabela ordenada conforme a resposta.
- Consultar `GET /frequencias/estudantes/{id}/relatorio` ao abrir o detalhe.
- Exibir resumo, situação mensal do benefício e histórico diário do estudante.
- Tratar loading, vazio, erro de API e `403` conforme o padrão da fila de justificativas.

Ficam fora desta entrega: envio tardio de justificativa, exclusão/listagem administrativa de chamadas e vínculo de motorista. Esses blocos terão planos próprios após o relatório.

## Arquitetura

A página do App Router será fina e renderizará `RelatorioFrequenciaWorkspace`. A feature continuará em `src/components/ui/frequencias`, dividida em filtro, cartões de resumo, tabela e modal de detalhe. Chamadas HTTP continuarão centralizadas em `frequenciaService`; os tipos e métodos já existentes serão reutilizados.

## Fluxo e interface

Ao entrar, a página consulta o relatório com o período padrão do backend e carrega as linhas disponíveis para o filtro. O usuário pode informar início, fim, linha e mínimo de faltas consecutivas. Datas inválidas ou intervalos acima de 366 dias bloqueiam a consulta.

O cabeçalho apresenta o período efetivamente retornado. Cinco cartões exibem estudantes, presenças, faltas, justificadas e pendentes. A tabela mostra estudante, linha atual, presença, faltas, justificadas, sequência atual e uma ação para detalhar.

O detalhe é carregado sob demanda e apresenta os mesmos indicadores, os limites mensais do benefício quando disponíveis e o histórico mais recente primeiro. Situações usam rótulos e cores já adotados na chamada.

## Erros e acessibilidade

- Falha da listagem aparece dentro da tabela com ação de tentar novamente.
- Falha do detalhe permanece no modal e permite nova abertura.
- `403` informa falta de permissão sem expor dados.
- Filtros têm labels, botões são semânticos e o modal preserva foco pelo componente global.

## Verificação

- Testes das regras puras de parâmetros, período, percentual e tom de presença.
- Testes dos contratos HTTP geral e individual.
- Biome nos arquivos tocados.
- Suíte completa e build de produção com a nova rota.
