# Cache de navegação — plano de implementação

**Objetivo:** reutilizar dados nas seis páginas sem skeletons ou requisições redundantes no retorno.

**Arquitetura:** preservar serviços Axios e `sharePendingRequest`; acrescentar cache tipado em memória e um hook compartilhado. Validade de 60 segundos, revalidação no acesso, invalidação após mutações e limpeza na troca de sessão. Consultas parametrizadas possuem entradas independentes. Sem mudanças visuais ou dependências.

**Referência:** solicitação anexada “Padronização de cache e skeletons entre páginas”.

- [x] Testar cache válido, expiração, falha em segundo plano, concorrência, parâmetros, mutações e troca de sessão com o executor Node existente.
- [x] Implementar cache em `src/services/api/query-cache.ts`, consultas em `page-queries.ts` e hook em `src/hooks/use-cached-query.ts`.
- [x] Integrar a invalidação nos interceptors existentes; impedir respostas anteriores à invalidação de sobrescreverem dados atuais.
- [x] Integrar Linhas, Recadastro, Usuários e Frequência (incluindo suas abas), preservando skeletons e erros iniciais.
- [x] Substituir os caches isolados de Estudantes e Solicitações pela mesma política, mantendo filtros e paginação.
- [x] Executar suíte Node, Biome, TypeScript e validar navegação/requisições no navegador quando houver acesso disponível.

**Pontos de revisão:** listas vazias são cache válido; falha de atualização mantém conteúdo; paginação/filtros não misturam respostas; logout limpa também requisições em andamento; mutações invalidam consultas relacionadas, inclusive entre páginas.

## Validação concluída

- `node --test tests/*.test.cjs`: 78 testes passaram, incluindo 14 testes novos de cache e integração com os serviços/interceptors reais.
- `npx.cmd --no-install tsc --noEmit --incremental false`: passou.
- Biome nos 16 arquivos de código/testes desta tarefa: passou. `npm.cmd run lint -- --reporter=summary` identificou 49 pendências de formatação em arquivos não alterados, mantidas fora do escopo.
- Chrome isolado, usando o frontend local e interceptação da API via CDP com respostas simuladas: skeleton inicial nas seis páginas e três abas de Frequência; retorno a todas sem skeleton e sem aumento da contagem de requisições; busca e paginação de estudantes; filtro de chamadas em chave distinta; expiração com falha HTTP 500 mantendo cards; alteração de status de usuário; invalidação entre páginas; reload descartando cache em memória. Sem exceções de execução no navegador. Nenhuma mutação foi enviada ao backend real.
- Revisão independente encontrou e confirmou a correção de uma corrida entre mutação e troca de sessão. A versão da sessão é capturada antes das mutações que atualizam o cache diretamente; respostas de sessões anteriores são descartadas, inclusive no fluxo A → B → A.

## Política final

Validade de 60 segundos, revalidação ao montar a consulta ou atualizar explicitamente. Conteúdo em cache permanece visível durante a atualização. Escritas bem-sucedidas invalidam todas as consultas desta camada, preservando dados enquanto são revalidados; escritas que falham não invalidam respostas válidas. Logout, troca de conta e alteração de permissões/papéis limpam as entradas. Alterações de nome/e-mail na mesma sessão preservam o cache. Nenhuma persistência em localStorage/sessionStorage foi adicionada.
