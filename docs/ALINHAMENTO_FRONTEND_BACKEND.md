# Alinhamento funcional entre frontend e backend

Auditoria estática em 13/11/2026. Fonte dos contratos: `../transporte-seduc-backend/routes/api.php`, Controllers, FormRequests, Resources e Services do backend local. Fonte do consumo: `src/services/api`, `src/types`, `src/components/ui`, `src/app` e navegação do frontend. Não foram consultados banco ou APIs em execução, nem alterados arquivos do backend. As permissões efetivas dependem dos papéis atribuídos no banco.

**Atualização após sincronização com `origin/main`:** o relatório abaixo registra o estado da auditoria no commit `798b179`. A integração posterior incorporou o fluxo remoto de código por e-mail com espera para reenvio, os métodos `consultar`/`verificarConsulta` com as respostas corretas e o suporte a presença sem internet. Portanto, as referências abaixo à ausência do fluxo offline e à remoção do método `consultar` descrevem o estado anterior à sincronização. As correções de paginação do recadastro e de instituições foram preservadas. Após resolver os conflitos, os 128 testes, o TypeScript e o build passaram novamente.

**Atualização de 13/11/2026 — remoção da chamada legada no frontend:** as rotas `/frequencias`, as quatro telas administrativas, seus serviços, tipos e links foram removidos. O portal do estudante (`/portal-estudante/frequencia`) continua exibindo o histórico de presenças por QR. O backend Laravel permanece inalterado e ainda contém contratos de chamada e o papel `motorista`. `motorista_id` continua opcional no contrato de linhas; o frontend não o envia nem oferece vínculo/cadastro de motorista. Vínculos anteriores continuam representados nos tipos de resposta, sem alteração dos dados no servidor.

## A. Inventário das integrações

Todos os caminhos abaixo são relativos a `/api`. `api` usa sessão Sanctum e CSRF; `publicApi` é usado nas escritas públicas sem sessão. As operações administrativas exigem `auth:sanctum`, conta ativa e as permissões indicadas em `routes/api.php`.

| Módulo e tela | Contratos usados e serviço frontend | Estado constatado |
| --- | --- | --- |
| Autenticação (`/login`, recuperação de senha) | `POST /login`, `POST /logout`, `GET /me`, `POST /password/email`, `POST /password/reset`; `auth.ts`, `password.ts` | Métodos, payloads e respostas alinhados estaticamente. Login solicita cookie CSRF. `/auth/token` e revogação de token não são usados pela interface web. |
| Dashboard (`/`) | `GET /dashboard`; `dashboard.ts`; `dashboard.view` | Resumo agregado integrado. O item Dashboard e o logo do menu levam a `/` mesmo para perfil sem `dashboard.view`; ver pendências. |
| Estudantes (`/estudantes`) | `GET /estudantes` (`page`, `per_page`, `search`), `GET/PUT/DELETE /estudantes/{id}`, `GET /contar-estudantes`, `GET /exportar-estudantes/{pdf\|xlsx}`; `estudante.ts`; `estudantes.view/write/delete` | Paginação e busca pelo servidor, detalhe, atualização, exclusão e exportação presentes. A criação administrativa, correção de e-mail e criação de conta pelo estudante existem na API sem interface equivalente. Exclusão com histórico retorna 409; inativação é o caminho indicado pelo backend. |
| Inscrição inicial e solicitações (`/registro`, `/solicitacoes`) | `POST /inscricoes/validar-step`, `POST /inscricoes`, `GET/PUT /inscricoes/{id}`, `GET/POST /inscricoes/{id}/documentos`, `POST/PUT /inscricoes/{id}/instituicoes`, `GET /inscricoes`, `PUT /inscricoes/analise/{id}`; `inscricao.ts`; token `X-Inscricao-Token` no fluxo público, `inscricoes.view/analise` no administrativo | Fluxo de inscrição, documentos e decisões implementado. `GET /inscricoes` retorna coleção completa; `POST /inscricoes` retorna o recurso diretamente, enquanto detalhe/update retornam `{data}`; o serviço respeita essa diferença. Download de documentos é consumido pelas URLs do Resource. Exclusão de inscrição/documento e correção administrativa de e-mail não têm ação correspondente. |
| Instituições, cursos e linhas (`/linhas`, formulários de inscrição) | `GET /instituicao`, `GET /curso`, `GET/POST/PUT/DELETE /linha`, `GET /linha/{id}/estudantes`; `inscricao.ts`, `linha.ts`; `linhas.view/write/delete` e `estudantes.view` para alunos da linha | CRUD de linhas e ocupação integrados. Cursos são apenas leitura. Instituições têm CRUD na área de transporte. O frontend deixou de consultar `/users/motoristas` e de enviar `motorista_id`; o campo permanece opcional na API. `GET /instituicao` usa `paginate(15)` sem metadados úteis no envelope atual; **corrigido** o seletor público para ler páginas sucessivas até a última. |
| Acesso público do estudante (`/area-aluno`, `/recadastro`, `/registro`) | `POST /area-estudante/acesso` e `POST /area-estudante/acesso/verificar`; `recadastro.ts` | **Corrigido:** CPF novo segue para inscrição; CPF existente recebe `fluxo: verificacao` e só após código de seis dígitos recebe `lista_espera` ou `recadastro` com dados e token. A UI agora mostra e valida essa etapa, permite reenvio e alteração do CPF. |
| Recadastro público (`/registro` no fluxo de renovação) | `POST /reecadastro/solicitacoes/{id}/documentos`, `PUT /reecadastro/solicitacoes/{id}/dados`, `POST /reecadastro/solicitacoes/{id}/finalizar`; `recadastro.ts`; token de duas horas no corpo | Upload, dados e finalização integrados. `POST /reecadastro/consulta` e `/consulta/verificar` são outro acesso público oferecido pela API; a UI usa o acesso unificado da área do estudante. O método antigo que interpretava `/consulta` como situação completa foi removido. |
| Recadastro administrativo (`/recadastramento`) | `GET/POST/PUT /reecadastro/periodos`, `PATCH /periodos/{id}/abrir\|fechar`, `GET /periodos/{id}/ausentes`, `POST /periodos/{id}/inativar-ausentes`, `GET /reecadastro/solicitacoes`, `PUT /solicitacoes/{id}/analise`; `recadastro.ts`; `periodos.view/write`, `solicitacoes.view/analise` | **Corrigido:** solicitações usam `page`, `busca`, `status`, `periodo_id` e `meta` da API; antes a UI mostrava só dez registros e filtrava apenas essa página. A lista de períodos é completa. Remoção de período/solicitação e consulta direta de solicitação não estão expostas. |
| Operação do transporte (`/transportes`) | `GET/POST/PATCH/DELETE /veiculos` e atribuições, `POST /veiculos/{id}/qr`, horários, dias sem operação, `GET/POST /viagens`, `POST /viagens/gerar`, pontos e vínculos, autorizações de linha; `transporte.ts`, `transporte-operacao.ts` | Os recursos têm listagem e ações no painel de transporte, com permissões por seção. `viagens` e outros recursos paginados preservam `data/meta`; QR novo só é exibido na resposta da criação/rotação. Geração de viagens apresenta conflitos. |
| Dispositivos autorizados (portal e gestão) | `GET/POST/DELETE /me/dispositivo...`, desafio e conclusão; `GET/PATCH /dispositivos/solicitacoes...`, `GET /dispositivos`, `PATCH /dispositivos/{id}/revogar`; `portal-estudante.ts`, `transporte.ts` | Solicitação, aprovação/rejeição, conclusão do vínculo e revogação estão conectadas. O estudante depende de conta associada ao cadastro e permissão `presencas.registrar`; a gestão usa `dispositivos.view/analise`. |
| Embarque por QR (portal e gestão) | `GET /me/viagens`, `GET /me/presencas`, `GET /me/presencas/tentativas`, `POST /presencas/resolver-qr`, `POST /presencas/desafios`, `POST /presencas`, revisão do aluno; listagens, revisão, exceção manual e indicadores administrativos em `/presencas`; `portal-estudante.ts`, `transporte.ts` | Contratos de token, desafio assinado, localização e tentativas estão modelados. O servidor decide janela, geocerca e duplicidade. O fluxo de presença sem internet também permanece disponível. A chamada administrativa foi retirada do frontend. |
| Administração (`/usuarios`, `/transportes`) | `GET/POST/PUT/PATCH/DELETE /users`, ativar/inativar; `GET/POST /roles`; `GET /auditoria`, `GET /presencas/indicadores`; `user.ts`, `transporte.ts`; permissões de cada recurso | Usuários e auditoria têm UI. Cargos oferecem apenas lista/criação: o Resource de cargos não expõe ID para editar/remover com segurança. `/perfil` é uma página sem integração funcional. |

## B. Problemas encontrados e impacto

| ID | Evidência no código atual | Impacto | Situação |
| --- | --- | --- | --- |
| I01 | `AcessoEstudanteService::solicitar` retorna `fluxo: verificacao` para CPF cadastrado; `AreaEstudanteWorkspace` armazenava essa resposta e redirecionava para `/registro`, que só reconhecia inscrição/lista de espera/recadastro. | Estudante existente não chegava ao próprio fluxo; dados/token só saem após código. | Corrigido no frontend. |
| I02 | `SolicitacaoReecadastroService::index` usa `paginate(10)`; `recadastroService.listSolicitacoes` descartava `meta` e `RecadastroSolicitacoesSection` filtrava a página recebida localmente. | Solicitações após a primeira página eram invisíveis; busca e status davam resultados incompletos. | Corrigido no frontend com filtros e paginação do servidor. |
| I03 | `recadastroService.consultar` tipava `POST /reecadastro/consulta {cpf}` como `{data: SituacaoRecadastro}`, mas o controller apenas envia código; a situação vem de `/consulta/verificar`. | Consumo futuro interpretaria uma resposta inexistente. | Método não utilizado removido. Fluxo atual usa `/area-estudante/acesso/verificar`. |
| I04 | `RoleResource` retorna somente `title`; `PUT/DELETE /roles/{id}` exigem ID. | Edição/exclusão de cargos não podem ser ligadas de forma segura à UI. | Contrato do backend documentado; não alterado. |
| I05 | `StoreUserRequest`/`UpdateUserRequest` aceitam apenas papéis da equipe. O backend já oferece `POST /estudantes/{id}/conta` em `ContaEstudanteService`, que cria conta com papel estudante, vincula ao cadastro e envia convite de senha. | O frontend ainda não oferece essa ação administrativa; tentar fazê-la por `POST /users` receberia 422. | Funcionalidade pronta no backend, interface pendente para a próxima fase. |
| I06 | O menu inclui Dashboard sem `dashboard.view` e o logo também aponta para `/`; a API requer essa permissão. | Perfil sem acesso pode abrir a rota e receber 403. | Pendente de definição de página inicial por perfil; evitar mudança de navegação geral nesta etapa. |
| I07 | `BeneficioFrequenciaService` calcula faltas de `Frequencia` em chamadas fechadas; `RegistroPresencaService` escreve `Presenca`. | Divergência entre comprovante QR e chamada não se concilia sozinha; misturá-los mudaria a regra do benefício. | Decisão de negócio pendente. |
| I08 | `GET /instituicao` usa `paginate(15)` em `InstituicaoService::index`, mas o serviço de inscrição lia apenas uma página. | Instituições após a primeira não apareciam em seletores da inscrição. | Corrigido no frontend: consulta páginas sucessivas até receber menos de 15 itens. |

## C. Correções realizadas no frontend

- `src/services/api/endpoints.ts`, `src/services/api/modules/recadastro.ts`, `src/types/recadastro.ts`: contrato de verificação do acesso por código e tipagem da resposta intermediária; remoção da interpretação incorreta de `/reecadastro/consulta`.
- `src/components/ui/area-estudante/AreaEstudanteWorkspace.tsx`: campo de código de seis dígitos, envio à rota de verificação, reenvio e troca de CPF. O acesso só entra no `sessionStorage` após a verificação ou quando a API confirma CPF novo.
- `src/services/api/modules/recadastro.ts`, `src/services/api/page-queries.ts`, `src/components/ui/recadastro/RecadastroAdminWorkspace.tsx`, `RecadastroSolicitacoesSection.tsx`: busca por nome/CPF, status, período e página no servidor; paginação pelo componente global e uso dos metadados reais.
- `src/services/api/modules/inscricao.ts`: carrega todas as páginas de instituições para os seletores públicos, já que o endpoint entrega 15 por vez sem metadados de paginação no envelope atual.
- `tests/student-access-service.test.cjs`, `tests/instituicao-list-service.test.cjs`: reproduzem os contratos de acesso por código, filtros/paginação administrativa e a continuação da lista de instituições.

## D. Capacidades do backend ainda não aproveitadas

- Administração de estudantes: `POST /estudantes`, `POST /estudantes/{id}/conta`, `PATCH /estudantes/{id}/email`; também há `PATCH /inscricoes/{id}/email` para correção no atendimento. A interface atual privilegia atualização de registros existentes.
- Inscrições: remoção administrativa de inscrição, remoção de documento público com token e remoção de vínculo institucional. Essas operações requerem cuidado com histórico e não foram acrescentadas automaticamente.
- Recadastro: rotas administrativas de detalhe/remoção de solicitação, remoção de período, listagem/detalhe/remoção de documentos e download administrativo existem; o fluxo atual usa principalmente os documentos incorporados à solicitação e o link de download.
- Transporte: o backend oferece `POST /presencas/offline` para comprovante sem conexão, mas não há captura/sincronização de comprovante no portal. Demais operações de veículos, horários, viagens, pontos, autorizações, revisões, indicadores e auditoria estão presentes, agrupadas na tela `/transportes`.
- Administração: edição/exclusão de cargos existem como rotas, mas a resposta de listagem não fornece ID; perfil do usuário não possui ação ou dados próprios na página `/perfil`.
- Autenticação: API de token (`/auth/token`, `/auth/token/revoke`) existe para outro tipo de cliente e não é usada pelo frontend de sessão.

## E. Pendências

### Frontend

1. Rever a navegação inicial de perfis sem `dashboard.view` e a página `/perfil` sem conteúdo funcional.
2. Testar visualmente e com contas reais os fluxos de código por e-mail, recadastro paginado, permissões, sessão expirada, 403, 409, 422 e 429 em homologação.
3. Considerar uma busca com espera curta na lista de recadastro para evitar uma requisição por tecla em bases grandes.

### Possíveis ajustes de contrato no backend, apenas recomendados

1. Expor ID estável no `RoleResource` se edição/exclusão de cargos for requisito.
2. Se a gestão precisar consultar o resultado do convite depois da criação da conta, avaliar um contrato de acompanhamento; `POST /estudantes/{id}/conta` já provisiona e vincula a conta.
3. Fornecer listagem de instituições completa para seletores, ou metadados de paginação e filtros consistentes.
4. Se o comprovante offline for exigido operacionalmente, definir o contrato e a política de segurança para captura, armazenamento temporário e envio posterior no navegador.

### Decisões de negócio

1. Definir a fonte oficial da frequência e o procedimento quando chamada e QR discordarem. O benefício é afetado pela chamada fechada, não pelo QR automaticamente.
2. Confirmar responsáveis, prazos e evidências para aprovar/revogar dispositivos e analisar revisões de embarque.
3. Definir se cargos, correção de e-mail, criação de contas e remoções administrativas precisam de interface nesta fase do produto.

## F. Próxima etapa de fluxos e experiência

Priorizar, sem implementar agora: entrada pública com código e retomada de inscrição/recadastro; preparação da linha (veículo, horários, viagens, pontos); tratamento de negativas e revisões de QR; comparação operacional entre chamada e comprovantes; acesso por perfil e ações de atendimento. As capacidades da API já permitem examinar esses fluxos com usuários, exceto as pendências de contrato acima. Não fundir chamada e QR sem decisão formal.

## Verificação e limite

Os contratos acima foram conferidos no código, sem chamadas HTTP reais. Verificações executadas nesta auditoria:

- `node --test` nos arquivos `tests/*.test.cjs`: **128 testes aprovados, 0 falhas**.
- `npx.cmd tsc --noEmit --incremental false`: **aprovado**.
- `npm.cmd run build`: **aprovado**, com 28 páginas estáticas geradas.
- `npx.cmd biome check` nos dez arquivos de código/teste alterados: **aprovado**.
- `npx.cmd biome check --formatter-enabled=false`: **aprovado** nos 236 arquivos analisados.
- `npm.cmd run lint`: **falhou com 66 diagnósticos de formatação** em arquivos preexistentes, principalmente diferenças de fim de linha CRLF; não foi feita uma reformatação geral fora do escopo.
- `git diff --check` no frontend: **aprovado**. `git status --short` no backend: **sem alterações**.

Nenhum teste de banco, migration, seeder ou operação destrutiva foi executado. Os fluxos de API, câmera, GPS e e-mail ainda precisam de homologação com ambiente e contas de teste seguros.
