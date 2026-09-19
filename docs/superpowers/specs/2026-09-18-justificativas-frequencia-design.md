# Fila de Justificativas de Frequência

## Objetivo

Entregar no frontend a fila administrativa de justificativas já disponível no backend. A responsável poderá localizar justificativas, consultar o contexto da falta e aprovar ou rejeitar cada solicitação. A rejeição exigirá parecer; a aprovação poderá exibir o alerta do backend quando o estudante continuar inativo.

Esta é a segunda fatia do subsistema de frequência. Relatórios, histórico consolidado por estudante, criação retroativa de justificativa e atribuição de motoristas continuam fora do escopo.

## Abordagem escolhida

A fila terá página própria em `/frequencias/justificativas`. Separar a análise administrativa da folha operacional mantém responsabilidades claras: motoristas registram a chamada; responsáveis analisam justificativas. A rota aparecerá na navegação logo após “Frequência”.

O endpoint `/me` ainda não expõe cargos nem permissões. Portanto, a interface não tentará reproduzir autorização no cliente. Usuários sem `justificativas.view` receberão o erro `403` do backend em uma apresentação clara, sem acesso aos dados ou ações.

## Contratos do backend

Serão consumidas estas rotas autenticadas:

- `GET /frequencias/justificativas`: lista paginada, com pendências primeiro.
- `GET /frequencias/justificativas/{id}`: carrega o detalhe atualizado.
- `PUT /frequencias/justificativas/{id}/analise`: envia `Aprovada` ou `Rejeitada`; parecer é obrigatório na rejeição.

Filtros disponíveis na listagem:

- `status`: `Em analise`, `Aprovada` ou `Rejeitada`;
- `linha_id`;
- `de` e `ate`, no formato `AAAA-MM-DD`;
- `page` e `per_page`, com 10, 15, 20 ou 30 registros.

A resposta paginada inclui `em_analise`, usado como contador da fila. A resposta de análise pode incluir `alerta`, que será exibido sem alteração: aprovar justificativa não reativa automaticamente um estudante inativo.

## Arquitetura

`src/app/(dashboard)/frequencias/justificativas/page.tsx` será uma página fina que renderiza `JustificativasWorkspace`. A feature continuará em `src/components/ui/frequencias`, junto ao fluxo de chamada, mas cada arquivo terá responsabilidade própria.

Os contratos entrarão em `src/types/frequencia.ts`. As URLs serão adicionadas ao grupo `FREQUENCIAS` em `src/services/api/endpoints.ts`; os métodos ficarão em `frequenciaService`, sem Axios nos componentes.

Componentes:

- `JustificativasWorkspace.tsx`: estado dos filtros, paginação, carregamento e coordenação das análises.
- `JustificativasFilterCard.tsx`: status, linha e período, reutilizando `Select`, `DateInput` e `Button`.
- `JustificativasTable.tsx`: tabela responsiva baseada no `DataTable` global, com estudante, linha, data, motivo, status e ações.
- `JustificativaAnalysisModal.tsx`: confirmação de aprovação ou formulário de rejeição com parecer.
- `JustificativasSkeleton.tsx`: fallback de rota consistente com tabelas existentes.
- `justificativaPresentation.ts`: funções puras para estado inicial de filtros, parâmetros da API, rótulos, classes e datas.

## Fluxo de dados

Ao abrir a página, o workspace carrega em paralelo as linhas acessíveis e a primeira página de justificativas. O filtro inicial seleciona `Em analise`, mostrando primeiro o trabalho pendente. Alterar filtros volta para a página 1; trocar apenas a página mantém os filtros atuais.

A tabela exibe o motivo completo apenas no detalhe, truncando o texto na linha para preservar legibilidade. “Aprovar” abre uma confirmação sem campo de parecer. “Rejeitar” abre o mesmo modal em modo de rejeição e exige um parecer não vazio. Registros já analisados permanecem consultáveis, mas não exibem ações de decisão.

Depois da análise, a resposta atualiza o registro na lista e o contador `em_analise`; em seguida, a página atual é recarregada para respeitar ordenação e filtros. Se a última linha da página desaparecer por causa do filtro, o workspace recua uma página e consulta novamente.

## Validação e concorrência

O frontend exige parecer de rejeição com ao menos um caractere não vazio e limita o texto a 1.000 caracteres, refletindo o contrato atual. O backend permanece a autoridade final.

Se outra pessoa analisar a mesma justificativa antes, o backend retorna conflito `409`. A interface preserva a mensagem recebida, fecha ações duplicadas e oferece recarregar os dados. Durante uma análise, os botões do modal ficam desabilitados.

## Erros e acessibilidade

Falhas de carregamento aparecem dentro da tabela com ação de tentar novamente. `403` será apresentado como falta de permissão; `409` usará a mensagem do backend. Erros de validação aparecem junto ao campo de parecer.

Filtros terão labels explícitos. Ações terão texto visível e `aria-label` contextual com o nome do estudante quando necessário. Modais reutilizarão o componente global, preservando fechamento por Escape e foco visível. Mensagens de sucesso usarão `output`; erros usarão `role="alert"`.

## Testes

O desenvolvimento seguirá TDD para contratos e regras puras:

- serviço lista justificativas com filtros e paginação;
- serviço carrega detalhe e envia análise com URL e payload corretos;
- filtros vazios não enviam parâmetros sem valor;
- rejeição exige parecer e aprovação não exige;
- registros analisados não oferecem decisão;
- apresentação de status e data permanece consistente.

Depois da implementação serão executados todos os testes `node:test`, Biome nos arquivos da entrega e o build de produção. O lint global será registrado separadamente enquanto os problemas preexistentes de CRLF fora do escopo permanecerem.

## Critérios de aceite

- A rota `/frequencias/justificativas` aparece na navegação.
- A fila inicia mostrando justificativas em análise e seu contador total.
- É possível filtrar por status, linha e período, além de paginar.
- É possível consultar estudante, falta, linha, data, motivo e responsáveis.
- É possível aprovar uma justificativa pendente.
- É possível rejeitar somente com parecer válido.
- Registros analisados ficam somente para consulta.
- Mensagens do backend, inclusive conflito e alerta de estudante inativo, ficam visíveis.
- Testes da entrega, verificação do Biome e build passam sem incorporar alterações locais alheias.
