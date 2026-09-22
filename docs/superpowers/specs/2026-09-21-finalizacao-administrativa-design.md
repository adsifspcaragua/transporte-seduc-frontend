# Finalização administrativa — design

## Objetivo

Concluir os pontos restantes da integração entre o backend e o frontend: autorização visível na interface, gestão administrativa de usuários com suporte a motoristas, indicadores reais de frequência nos estudantes de cada linha e estabilização da suíte do backend. A entrega deve manter o backend como autoridade de acesso e evitar duplicar sua matriz de papéis no frontend.

## Escopo

- Corrigir as falhas atuais de tradução das validações e de logout por sessão no backend pela causa raiz.
- Estender `GET /me` com papéis e permissões efetivas do usuário autenticado, preservando os campos já consumidos pelo frontend.
- Usar as permissões retornadas para controlar rotas, itens de navegação e ações administrativas.
- Criar a rota `/usuarios` para listar, cadastrar, editar, ativar, inativar e excluir usuários.
- Permitir o perfil `motorista` no formulário administrativo e manter a seleção de motoristas das linhas pelo endpoint mínimo já criado.
- Acrescentar `faltas` e `ultima_presenca` aos estudantes retornados por `GET /linha/{linha}/estudantes`.
- Substituir os placeholders do modal de linha pelos indicadores retornados pelo backend.

Não fazem parte desta entrega: criação de novos papéis ou permissões, edição da matriz de permissões pela interface, paginação server-side de usuários, recuperação de senha administrativa ou novos indicadores de frequência além dos dois já exibidos.

## Contratos do backend

### Identidade e autorização

`GET /me` continuará retornando o usuário no formato direto já existente e acrescentará:

- `roles: string[]` com os papéis associados.
- `permissions: string[]` com a união das permissões dos papéis.

O papel `admin` continuará usando o bypass do middleware. Para a interface, ele receberá a lista completa de permissões cadastradas, evitando regras especiais espalhadas pelo frontend.

### Gestão de usuários

Serão reutilizados os contratos existentes:

- `GET /users`
- `POST /users`
- `PUT /users/{id}`
- `DELETE /users/{id}`
- `PATCH /users/{id}/ativar`
- `PATCH /users/{id}/inativar`

O frontend normalizará as diferenças atuais de envelope entre criação e atualização. A criação exigirá nome, e-mail, senha e papel. Na edição, a senha vazia não será enviada. CPF, matrícula e data de nascimento permanecerão opcionais conforme as regras do backend.

### Indicadores por linha

Cada item de `GET /linha/{linha}/estudantes` acrescentará:

- `faltas`: total de marcações `Falta` em chamadas fechadas.
- `ultima_presenca`: data da chamada fechada mais recente em que a situação foi `Presente`, ou `null`.

Faltas justificadas não entram em `faltas`. Chamadas abertas não entram em nenhum dos indicadores. A consulta será agregada no banco e terá teste de quantidade de queries para impedir N+1.

## Autorização no frontend

O tipo de usuário autenticado e o estado global passarão a carregar papéis e permissões. Um helper central responderá `can(permission)` e será usado por componentes de guarda e navegação.

O sidebar terá uma permissão opcional por item:

- Estudantes: `estudantes.view`
- Linhas: `linhas.view`
- Frequência, histórico e relatório: `frequencias.view`
- Justificativas: `justificativas.view`
- Solicitações: `solicitacoes.view`
- Recadastramento: `periodos.view` ou `solicitacoes.view`
- Usuários: `users.view`

Dashboard e perfil permanecem disponíveis para qualquer usuário autenticado. Páginas protegidas renderizarão uma mensagem de acesso negado sem iniciar consultas proibidas. Botões de criação, edição, análise, reabertura e exclusão serão ocultados quando a permissão correspondente faltar.

## Gestão de usuários no frontend

A página do App Router será fina e renderizará `UsersWorkspace` em `src/components/ui/users`. A interface seguirá o padrão de tabela, modal global, mensagens de erro e skeleton já usado em justificativas e linhas.

A listagem mostrará nome, e-mail, papel e situação. Ações disponíveis conforme permissão:

- `users.write`: cadastrar, editar, ativar e inativar.
- `users.delete`: excluir.

O formulário usará os componentes globais de input e select. A exclusão terá confirmação explícita. Ativação e inativação não serão oferecidas para o próprio usuário autenticado, evitando encerrar acidentalmente o acesso atual; o backend continuará sendo a autoridade final.

## Detalhes da linha

O modal existente manterá sua paginação. As colunas “Faltas” e “Última presença” passarão a mostrar os valores do recurso, com `0` para ausência de faltas e “Sem presença registrada” quando a data for nula. A data será formatada sem deslocamento de fuso.

## Tratamento de erros

- `401` encerra a sessão pelo interceptor existente.
- `403` em página protegida resulta em estado de acesso negado; ações ocultas não substituem a validação do backend.
- Erros de validação de usuários são associados aos campos quando possível.
- Falhas de listagem e mutação mantêm a mensagem da API e oferecem nova tentativa quando aplicável.
- O diagnóstico das quatro falhas atuais da suíte será separado das features; nenhuma alteração será feita sem reproduzir e identificar a causa.

## Testes e verificação

- Backend: testes de `/me`, permissões efetivas, CRUD/estado de usuários, agregados de frequência por linha, traduções e logout por sessão.
- Frontend: testes dos contratos de autenticação e usuários, helpers de autorização, apresentação dos indicadores e validação do formulário administrativo.
- Verificação final com Pint, suíte completa do backend, Biome, TypeScript, suíte completa do frontend e build de produção.
- Commits separados por escopo e no repositório correspondente, seguindo `feat(escopo): descrição` ou `fix(escopo): descrição` para correções.
