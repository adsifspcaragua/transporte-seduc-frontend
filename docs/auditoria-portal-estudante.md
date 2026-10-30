# Compatibilidade do portal do estudante

Auditoria do código local em 30/10/2026. O Laravel em `../transporte-seduc-backend` é a fonte dos contratos. Nenhum endpoint ou autorização foi acrescentado ao backend nesta implementação.

## Matriz de funcionalidades

| Funcionalidade | Contrato existente | Autorização e limite |
| --- | --- | --- |
| Login por CPF/e-mail e senha | `POST /api/login`, `{login,password}`; sessão e `{user}` | Conta User ativa; não cria vínculo com estudante |
| Conta autenticada | `GET /api/me` | Dados da conta, roles e permissions; sem estudante/inscrição associados na resposta |
| Recuperar/redefinir senha | `POST /api/password/email`, `{email}`; `POST /api/password/reset`, `{token,email,password,password_confirmation}` | CSRF, throttle 5/min, resposta genérica de solicitação, token válido e senha confirmada com mínimo de oito caracteres |
| Próximas viagens | `GET /api/me/viagens` | `auth:sanctum`, `presencas.registrar`, middleware `estudante`; linhas autorizadas, sete dias |
| Comprovantes de presença | `GET /api/me/presencas` | Somente estudante da conta; paginação Laravel |
| Tentativas e revisão | `GET /api/me/presencas/tentativas`, `POST /api/me/presencas/tentativas/{id}/revisao`, `{motivo}` | Somente tentativas próprias; revisão sujeita às regras do backend |
| Vínculo de dispositivo | `GET /api/me/dispositivo`, `POST /api/me/dispositivo/solicitacoes`, etapas desafio/concluir e cancelamento | Conta vinculada; aprovação presencial/atendimento, assinatura ECDSA P-256 |
| Registro de embarque | `POST /api/presencas/resolver-qr`, `/desafios`, `/presencas` | QR, dispositivo autorizado, assinatura, viagem, janela do servidor e geocerca; nenhuma presença simulada pelo frontend |
| Perfil completo, inscrição e situação do benefício autenticados | Sem endpoint próprio | `GET /api/estudantes/{id}` é administrativo (`estudantes.view`); não consultar coleção e filtrar no navegador |
| Correções e documentos autenticados | Sem endpoint próprio | Login não concede acesso aos documentos de inscrição/recadastro |
| Recadastro autenticado | Sem endpoint próprio | Fluxo disponível é público por CPF e token próprio |
| Confirmar/escolher ponto ou alterar linha pelo estudante | Sem endpoint próprio | Ponto de embarque consta no comprovante; edição de cadastro/linha é administrativa |
| Associar conta existente ao estudante | `PUT /api/estudantes/{id}`, `{user_id:number|null}` | `estudantes.write`; backend valida existência e unicidade no update |

Fontes: `routes/api.php:89,99,137,225`; `app/Http/Middleware/ResolveEstudanteDaConta.php:18`; `app/Services/Auth/AuthService.php`; `app/Services/Presenca/RegistroPresencaService.php:201`; `app/Http/Controllers/Api/Dispositivo/MeuDispositivoController.php`; `app/Http/Requests/Presenca/ConfirmarPresencaRequest.php`.

## Provisionamento administrativo

A recuperação de acesso fica em `/recuperar-senha`; a redefinição aceita `/redefinir-senha` e `/reset-password`. Este último é o caminho gerado pelo e-mail do Laravel (`AppServiceProvider.php:44`), com `token` e `email` na query. O link depende de `FRONTEND_URL` configurado corretamente no servidor; nenhum segredo/configuração privada foi consultado. Após redefinir, o usuário retorna ao login para entrar na própria área, sem autenticação automática. Fontes: `ForgotPasswordRequest.php`, `ResetPasswordRequest.php`, `PasswordResetService.php`.

O papel `estudante` existe no `RolePermissionSeeder.php:88` e concede somente `presencas.registrar`. O vínculo autenticado é exclusivamente `estudantes.user_id`: CPF igual na conta e no cadastro não substitui o vínculo. Aprovar inscrição cria o estudante, mas não cria usuário, senha ou associação (`InscricaoService.php:242`). O `PresencaSeeder.php` possui uma conta de demonstração vinculada; não é processo de provisionamento de produção.

**Bloqueio atual:** `StoreUserRequest.php` e `UpdateUserRequest.php` aceitam explicitamente apenas `admin`, `gestor`, `operador`, `motorista` em `Rule::in`. Assim, a UI reconhece e exibe o papel estudante retornado pela API, mas não oferece criar/atribuir esse papel por uma chamada que seria rejeitada com 422. A liberação desse papel exige alteração deliberada no backend.

Na edição administrativa do estudante, a seleção de conta aparece apenas com `users.view` e `estudantes.write`, carregando a lista pelo serviço/cache já existentes. Oferece contas ativas com papel estudante. Associação atual ausente/inativa/com outro papel é preservada como referência; salvar outros campos não envia `user_id` inalterado. Selecionar “Sem conta vinculada” envia `user_id:null`. A unicidade definitiva é validada pelo servidor (`UpdateEstudanteRequest.php:85`), inclusive quando duas pessoas tentarem associar a mesma conta simultaneamente. A API de usuários não fornece uma lista de associações para antecipar essa validação no navegador.

## Fluxos públicos por CPF e tokens

`POST /api/area-estudante/acesso {cpf}` retorna um de três fluxos (`AcessoEstudanteService.php:18`):

- `inscricao`: CPF desconhecido; inicia inscrição.
- `lista_espera`: inscrição existente ainda não aprovada/rejeitada; retorna cadastro, instituição, documentos, campos pendentes, `pode_editar` e novo token.
- `recadastro`: estudante ativo e período aberto; cria/retoma solicitação e emite token de duas horas.

Inscrição: `GET /api/inscricoes/{id}`, atualização `PUT/PATCH`, instituição e documentos usam `X-Inscricao-Token` ou campo `token`. O token não possui prazo de expiração. Usuário administrativo ativo com `inscricoes.view` pode ler sem token. O update de dados rejeita inscrições em análise/aprovadas/rejeitadas. Upload/delete de documentos não possui o mesmo bloqueio de status no serviço atual — lacuna no backend, não autorização para a UI ignorar estado.

- Lista de documentos: `{documento:[...]}`.
- Upload: multipart `{name,type,file_path}`, PDF/PNG/JPG/JPEG até 5 MB; resposta `{documento,message}`.
- Tipos `name`: `foto`, `identidade`, `residencia`, `historico`, `matricula`, `declaracao`, `cronograma`.
- Download/preview: `GET /api/inscricoes/{id}/documentos/{documento}/download?inline=1`; valida pertencimento à inscrição e token/permissão.
- Campos pendentes são `{campo,label}`; motivo da devolução vem em `observation`.

Fontes: `VerifyInscricaoToken.php`; `InscricaoResource.php`; `InscricaoDocumentoService.php`; `StoreDocumentoRequest.php`; `InscricaoService.php:83`.

Recadastro: `POST /api/reecadastro/consulta {cpf}` retorna `{data:SituacaoResource,message}`. A resposta inclui cadastro completo, estudante resumido, período, status, observações, campos pendentes, disponibilidade de envio, documentos e token.

- Upload: `POST /api/reecadastro/solicitacoes/{id}/documentos`, multipart `{token,type,arquivo}`, até 5 MB. Tipos: `declaracao_matricula`, `cronograma_aulas`, `comprovante_residencia`.
- Atualizar dados: `PUT .../{id}/dados`, token e cadastro pessoal/endereço/acadêmico completos, conforme `AtualizarDadosRequest.php`. CPF não é editável nessa chamada.
- Finalizar: `POST .../{id}/finalizar`, `{token,possui_matricula,possui_cronograma,aceite_veracidade:true,aceite_ciencia:true,prazo_matricula?,prazo_cronograma?}`. Prazos exigidos quando o documento correspondente falta; residência sempre obrigatória.
- Token, validade, período aberto e estado que aceita envio são verificados no servidor. Em pendência, reenvio somente de documento ausente/rejeitado. Finalização revoga token e retorna `Em analise`.
- Não existe download de documento de recadastro autorizado ao próprio estudante. O download existente exige a permissão administrativa `documentos.view`.

Fontes: `ReecadastroPublicoService.php:33,86,144,209,275`; `Http/Resources/Reecadastro/Publico/SituacaoResource.php`; `Http/Requests/Reecadastro/Publico/*`.

## Lacunas de segurança e próximos contratos necessários

As consultas públicas entregam dados pessoais e tokens de edição a partir do CPF, sem senha ou comprovação de identidade. O throttle reduz volume, mas não comprova identidade. Reconsultar gira o token e pode invalidar o acesso anterior. Não usar essas consultas para simular a autorização de um portal autenticado, mesmo preenchendo o CPF com dados de `/me`.

Para disponibilizar cadastro, benefício, inscrição, documentos, correções e recadastro dentro da sessão, o backend precisa expor contratos próprios que resolvam o estudante por `user_id`, validem pertencimento de cada documento/solicitação e mantenham regras de período/status. Também precisa oferecer provisionamento deliberado de conta/papel estudante. O frontend deve manter essas funcionalidades indisponíveis no portal até esses contratos existirem; o fluxo público existente continua separado.
