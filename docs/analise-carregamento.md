# Análise do carregamento — 11/09/2026

## Diagnóstico do log

O trecho enviado contém 60 requisições entre 19:25:29 e 19:25:39:

| Endpoint | Requisições |
| --- | ---: |
| `/curso` | 2 |
| `/instituicao` | 2 |
| `/inscricoes` | 4 |
| `/linha` | 4 |
| `/inscricoes/{id}/instituicoes` | 24 |
| `/inscricoes/{id}/documentos` | 24 |

A tela fazia quatro leituras iniciais e depois duas leituras adicionais para cada inscrição retornada, antes de encerrar o carregamento. A paginação da tabela acontece no navegador, portanto essas chamadas também atingiam inscrições fora da página visível. Com seis inscrições, uma execução completa fazia 16 chamadas. O log contém quatro passagens pelos relacionamentos dessas seis inscrições.

Os efeitos de montagem não compartilhavam requisições pendentes. Execuções sobrepostas, incluindo as verificações de efeitos no desenvolvimento, repetiam as leituras. O log isolado não permite atribuir todas as quatro passagens a uma causa específica de remontagem.

Curso, instituição e linha pertencem aos filtros e aos detalhes desta tela. Não foi encontrado um provider que carregue os dados de todas as telas: o layout monta o conteúdo da rota ativa, o menu e o cabeçalho. A autenticação consulta `/me` ao restaurar uma sessão ainda desconhecida.

## Alterações realizadas

1. A listagem administrativa de inscrições agora carrega dados acadêmicos, instituição e documentos em lote no Laravel e os serializa com os resources existentes. O front consome essa resposta diretamente. Foram eliminadas as duas chamadas HTTP por inscrição e os erros silenciosamente convertidos em documentos vazios nesse enriquecimento.
2. As leituras dos serviços compartilham promessas apenas enquanto estão pendentes, distinguindo parâmetros e sessão. Sucesso e erro removem a entrada. Escritas invalidam o compartilhamento, inclusive ao terminar, permitindo uma leitura nova após uma alteração. Não há cache com prazo fixo escondendo atualizações do servidor.
3. Os dois serviços que consultavam linhas usam a mesma função de leitura, evitando duplicidade entre consumidores.
4. Após aprovar, rejeitar ou devolver uma inscrição, a tela recarrega só `/inscricoes`. Os catálogos de filtros já carregados são reaproveitados. Ao montar novamente a tela, eles são consultados novamente. Respostas de carregamentos ultrapassados ou de uma montagem encerrada não atualizam a tela.
5. O skeleton continua acompanhando o estado de carregamento, mas deixa de impor o mínimo padrão de 1.000 ms. O hook também passa a mostrar imediatamente o carregamento ao iniciar uma nova consulta. A opção explícita de tempo mínimo continua disponível.
6. Na listagem de linhas, a ocupação é calculada com `withCount`, como já acontecia no dashboard. Antes, o resource executava duas contagens por linha; agora a listagem obtém tudo em uma consulta SQL. Os endpoints individuais reutilizam uma única contagem quando necessário.

## Fluxos revisados

Os números abaixo representam uma carga da tela com a sessão já restaurada; não incluem ações posteriores, arquivos baixados nem requisições internas do Next.js.

| Tela | Leituras principais | Observações |
| --- | --- | --- |
| Dashboard | `/dashboard` | Endpoint agregado; não busca listas completas de inscrições ou estudantes. |
| Solicitações | `/inscricoes`, `/curso`, `/instituicao`, `/linha` | Quatro chamadas na montagem; uma para atualizar a lista após análise. Relacionamentos incluídos na resposta. |
| Estudantes | `/estudantes?page=…&per_page=…` e três catálogos | O back já pagina e carrega relacionamentos em lote. Os catálogos são buscados na montagem; mudar de página não dispara seus efeitos novamente. O modal de edição só faz suas leituras quando aberto. |
| Linhas | `/linha` | Eliminadas as contagens adicionais por linha no back. |
| Recadastramento administrativo | Períodos e solicitações | Duas leituras iniciais. Ausentes são buscados ao acionar a consulta do período. O back já carrega os relacionamentos em lote. |
| Registro | Cursos e instituições | Catálogos específicos do formulário. CEP depende do preenchimento; gravações e uploads dependem das ações do usuário. |
| Área do estudante | Acesso informado pelo estudante | A consulta de acesso ocorre na ação do formulário. |

## Validação

- TypeScript: `tsc --noEmit --incremental false`, sem erros.
- Biome: todos os arquivos alterados de código e testes passaram.
- Front: `node --test tests/pending-request.test.cjs` — 5 testes passaram. Cobrem compartilhamento, nova leitura após conclusão, recuperação de erro, separação por parâmetros/token, troca de sessão, invalidação por escrita e duas cargas simultâneas com somente quatro chamadas.
- Back: suíte completa PHPUnit — 152 testes, 466 assertions, todos passaram. Execução em SQLite em memória, com configuração isolada do cache de configuração da aplicação.
- Novas regressões verificam relacionamentos completos e vazios, manutenção da proteção da listagem, ausência de token/caminho de arquivo no retorno administrativo e quantidade constante de consultas ao passar de um para seis registros.
- Laravel Pint e `git diff --check`: sem problemas nos arquivos alterados.

## Limites e acompanhamento

A redução de chamadas foi validada por testes, não por uma medição autenticada no navegador com o banco real. Não é possível prometer um tempo final inferior a três segundos apenas a partir desses resultados. Os tempos de aproximadamente 30 ms e 530 ms no log não identificam, sozinhos, quanto foi gasto em fila, conexão, PHP ou banco. Não foi encontrado `sleep`/`usleep` no código de aplicação, bootstrap ou configuração pesquisados.

A listagem de solicitações continua retornando todas as inscrições, preservando busca, filtros e histórico locais. Embora não haja mais chamadas por registro, o tamanho da resposta ainda cresce com a base. Para bases maiores, o próximo ajuste estrutural é paginar e filtrar no servidor, incluindo o histórico; limitar apenas a resposta atual quebraria essas funções.

Também foram observados contratos de paginação que merecem uma tarefa funcional separada: cursos e instituições retornam páginas de 15 itens, mas os consumidores de catálogo usam somente a primeira; o serviço de recadastramento também descarta os metadados da paginação. Estes comportamentos já existiam e não são a causa da cascata de requisições apresentada.

As alterações de front e back devem entrar juntas, com o back atualizado primeiro, porque o front agora espera os relacionamentos na resposta de `/inscricoes`. Para conferir no ambiente real, abra Solicitações com a aba Network limpa: espere quatro chamadas de dados na montagem (mais `/me` se a sessão precisar ser restaurada), nenhuma chamada por inscrição para instituições/documentos e uma leitura de inscrições após uma análise.
