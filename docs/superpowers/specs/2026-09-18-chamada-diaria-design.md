# Chamada Diária de Frequência

## Objetivo

Entregar no frontend o fluxo operacional de chamada diária já disponível no backend: selecionar uma linha e uma data, abrir ou retomar a folha, marcar cada estudante como presente, falta ou falta justificada, salvar o andamento e fechar ou reabrir a chamada.

Esta é a primeira fatia do subsistema de frequência. A fila administrativa de justificativas, os relatórios consolidados e a atribuição de motoristas às linhas ficam fora deste escopo.

## Contratos do backend

O frontend consumirá somente as rotas autenticadas e autorizadas já existentes:

- `GET /frequencias/linhas`: linhas acessíveis ao usuário e situação da chamada de hoje.
- `GET /frequencias/chamadas`: histórico paginado de chamadas, com filtros por linha, status e período.
- `POST /frequencias/chamadas`: abre a folha de uma linha/data ou retoma a existente.
- `GET /frequencias/chamadas/{id}`: carrega a folha completa.
- `PUT /frequencias/chamadas/{id}`: salva uma ou várias marcações.
- `PATCH /frequencias/chamadas/{id}/fechar`: fecha uma folha sem pendências.
- `PATCH /frequencias/chamadas/{id}/reabrir`: reabre uma folha fechada para correção.

A exclusão de chamada existe no backend, mas não será exposta nesta primeira entrega porque é uma operação destrutiva e não é necessária para o fluxo diário.

## Arquitetura

A rota `src/app/(dashboard)/frequencias/page.tsx` permanecerá fina e renderizará `FrequenciasWorkspace`. A feature ficará em `src/components/ui/frequencias`, seguindo o padrão das áreas de estudantes, linhas e solicitações.

Os contratos serão centralizados em `src/types/frequencia.ts`; as URLs entrarão em `src/services/api/endpoints.ts`; e toda comunicação ficará em `src/services/api/modules/frequencia.ts`. Componentes visuais não chamarão Axios diretamente.

A tela terá duas áreas:

1. Entrada da chamada: cards das linhas autorizadas, com indicação de chamada não iniciada, aberta ou fechada. O usuário escolhe a data, respeitando o limite de hoje, e abre ou retoma a folha.
2. Folha da chamada: cabeçalho com linha, data, status e contadores; lista de estudantes; seleção de situação; motivo obrigatório para falta justificada; ações de salvar, fechar e reabrir.

O histórico completo e seus filtros paginados não serão uma terceira tela nesta entrega. Os contratos de listagem serão tipados no serviço para evitar retrabalho, mas a interface inicial será orientada à operação diária.

## Componentes

- `FrequenciasWorkspace.tsx`: carrega linhas, controla seleção de data e alterna entre entrada e folha.
- `FrequenciaLinhaCard.tsx`: apresenta horários, motorista e estado da chamada de hoje.
- `ChamadaSheet.tsx`: mantém o rascunho das marcações, valida justificativas e coordena salvar/fechar/reabrir.
- `FrequenciaRouteSkeletons.tsx`: skeletons da entrada e da folha usando os componentes globais.
- `frequenciaPresentation.ts`: funções puras para datas, rótulos, contadores e transformação de marcações, permitindo testes sem renderizador React adicional.

Os componentes globais `Button`, `DateInput`, `Input`, `Textarea`, `Modal`, `Skeleton` e tokens do Tailwind serão reutilizados. Não serão criados novos controles globais.

## Fluxo de dados e estados

Ao entrar na rota, `FrequenciasWorkspace` busca as linhas autorizadas. A data inicia em hoje e nunca pode ser futura. Para hoje, um card usa `chamada_hoje` para oferecer “Iniciar”, “Continuar” ou “Visualizar”. Para outra data, a ação sempre chama a abertura idempotente do backend, que devolve a folha já existente quando aplicável.

Ao receber a folha, o frontend cria um rascunho local indexado por `estudante_id`. Salvar envia somente as marcações alteradas. Depois de uma resposta bem-sucedida, a folha retornada pelo backend substitui o estado local, mantendo servidor e interface sincronizados.

Uma falta justificada exige motivo não vazio antes do envio. Marcações cuja justificativa já foi analisada serão exibidas como bloqueadas, conforme o campo `justificativa.status`; a interface não permitirá alterá-las. Ao fechar, a ação fica desabilitada enquanto houver pendentes. O backend continua sendo a autoridade final para todas as regras.

Folhas fechadas são somente leitura e exibem a ação “Reabrir chamada”. Reabrir atualiza a folha com a resposta da API e restaura os controles editáveis.

## Erros e acessibilidade

Erros de carregamento terão alerta e ação de tentar novamente. Erros de validação ou conflito usarão a mensagem em português devolvida pela API. O salvamento preservará o rascunho quando falhar.

Os estados serão selecionados por botões semânticos agrupados com rótulos acessíveis e `aria-pressed`. Alertas usarão `role="alert"`; estados de carregamento desabilitarão ações duplicadas; todos os campos de justificativa terão label explícito. Foco visível e contraste seguirão os componentes globais existentes.

## Navegação e autorização

Será adicionado o item “Frequência” à sidebar. A autorização real continuará no backend, como já ocorre nas demais áreas do frontend. O endpoint `/me` atualmente não inclui cargos nem permissões; por isso, ocultar itens por perfil não faz parte desta fatia. Essa limitação será registrada como dependência para uma etapa posterior de navegação por permissão.

## Testes e verificação

As funções puras de apresentação e geração de payload serão desenvolvidas com TDD usando o test runner nativo do Node, no mesmo estilo dos testes existentes. Serão cobertos:

- normalização do rascunho a partir da folha;
- detecção das marcações alteradas;
- exigência de motivo para situação `Justificada`;
- bloqueio de marcações com justificativa analisada;
- cálculo do rótulo e da ação de cada card.

Depois da implementação serão executados os testes, `npm run lint` e `npm run build`. Nenhum arquivo já modificado pelo usuário será revertido; alterações em arquivos compartilhados serão mínimas e preservando o conteúdo atual.

## Critérios de aceite

- A nova rota aparece na navegação e carrega apenas as linhas permitidas pela API.
- É possível abrir ou retomar uma chamada de hoje ou de uma data passada.
- É possível marcar todos os estudantes, justificar uma falta com motivo e salvar alterações.
- Não é possível fechar a folha com pendências no frontend, e erros do backend continuam visíveis.
- É possível visualizar uma folha fechada e reabri-la.
- O layout é responsivo, acessível e consistente com o design atual.
- Testes, Biome e build passam sem regressões introduzidas pela feature.
