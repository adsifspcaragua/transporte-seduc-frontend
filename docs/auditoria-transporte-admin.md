# Auditoria administrativa de transporte

Fonte da verdade: backend Laravel local em `../transporte-seduc-backend`, auditado em 30/10/2026. Nenhum arquivo do backend, dependência ou configuração privada foi alterado.

## Evidências consultadas

- `routes/api.php`: verbos, caminhos e middlewares de permissão.
- Controllers em `app/Http/Controllers/Api/Viagem`, `Presenca/PresencaController.php`, `Dispositivo/AnaliseDispositivoController.php`, `Auditoria/AuditoriaController.php`, `Role/RoleController.php` e `Instituicao/InstituicaoController.php`.
- Todos os FormRequests administrativos de `Viagem`, `PresencaManualRequest`, `AnalisarRevisaoRequest`, `AnalisarSolicitacaoDispositivoRequest`, `MotivoRequest`, requests de cargos e instituições.
- Resources de `Viagem`, `Presenca`, `Dispositivo`, `Auditoria`, `Role` e `Instituicao`.
- Services `VeiculoService`, `ProgramacaoService`, `ViagemService`, `GeradorViagens`, `PontoEmbarqueService`, `AutorizacaoLinhaService`, `PresencaAdminService`, `AnaliseDispositivoService`, `AuditoriaService`, `RoleService` e `InstituicaoService`.
- Migrations `2026_10_16_100001` a `100011`: veículos, atribuições, horários, viagens, dias sem operação, autorizações, pontos/vínculos, dispositivos/desafios, presenças/tentativas e auditoria.
- `tests/Feature/Presenca/GestaoTransporteTest.php`, modelos `SolicitacaoDispositivo`, `Viagem`, `HorarioViagem` e enum `CodigoPresenca`.

## Entrega

A rota `/transportes` usa uma página fina e o `TransportesWorkspace`. Cada área só monta sua consulta com a permissão de leitura correspondente. A interface reutiliza Button, Input, NumberInput, Select, Checkbox, DateInput, TimeInput, Textarea, Modal, DataTable, Skeleton e paginação existentes.

| Área | Leitura | Escrita real disponível |
| --- | --- | --- |
| Veículos | `GET /veiculos`, detalhe individual com atribuições | Criação, edição, ativação/inativação, exclusão e rotação de QR com motivo |
| Veículo × linha | `GET /veiculos/atribuicoes` com linha, veículo e data | Criar; editar somente fim/motivo; remover |
| Horários | `GET /horarios-viagem` com linha/ativo | Criar, editar, excluir; dias 0–6, vigência, janelas opcionais |
| Viagens | `GET /viagens` com paginação e filtros | Gerar período idempotente; ajustar janela local, veículo e status com motivo |
| Dias sem operação | `GET /dias-sem-operacao` por período | Criar e remover; informa cancelamentos e necessidade de reativação manual |
| Pontos de embarque | `GET /pontos-embarque` e detalhe | Criar, editar localização/raio/ativo e excluir |
| Ponto × linha | `GET /pontos-embarque/linhas` com linha/sentido | Vincular; editar ordem/passagem/janelas; desvincular |
| Autorizações de linha | `GET /autorizacoes-linha` com estudante, linha e data | Criar autorização adicional com vigência/motivo; remover |
| Solicitações de dispositivo | Fila paginada, filtros de estudante/tipo/status e detalhe | Aprovar pendentes; rejeitar pendentes/aprovadas; parecer obrigatório |
| Dispositivos | Lista paginada por estudante/status | Revogar somente ativo com motivo; UUID preservado |
| Presenças registradas | Lista paginada, filtros por período, estudante, viagem, linha e método | Registrar exceção manual com estudante, viagem e justificativa |
| Tentativas e revisões | Lista paginada; negativas por padrão; filtro resultado, código, revisão, estudante, linha e período | Analisar revisão pendente; aprovar registra presença manual; rejeitar exige parecer |
| Indicadores | `GET /presencas/indicadores` com período e linha | Leitura: totais, manuais, negativas por motivo, distribuição por linha/dia, GPS e revisões |
| Auditoria | Lista paginada por prefixo de ação, responsável e período | Somente leitura; detalhes apresentam responsável, alvo, antes/depois e justificativa |
| Cargos | `GET /roles` | Criar cargo; limitações abaixo |
| Instituições | `GET /instituicao`, navegação em páginas de 15, consulta direta por ID | Criar, editar nome e linhas vinculadas, excluir respeitando resposta do backend |

Detalhes exibem campos e relações com rótulos, sem textarea de JSON bruto. As opções de linha, veículo e ponto são consultadas somente quando há a permissão de leitura da referência. Sem essa permissão, o campo aceita o identificador numérico. Identificadores de estudante e viagem também podem ser obtidos nas telas e tabelas existentes.

## Permissões para navegação

A rota deve permitir **qualquer uma** de:

`veiculos.view`, `viagens.view`, `geocercas.view`, `estudantes.view`, `dispositivos.view`, `presencas.view`, `auditoria.view`, `roles.view`, `instituicoes.write`, `instituicoes.delete`.

Cada ação tem sua permissão separada:

| Ações | Permissão |
| --- | --- |
| Criar/editar veículo, gerar QR, gerir atribuição | `veiculos.write` |
| Excluir veículo | `veiculos.delete` |
| Horários, geração/ajuste de viagens, dias sem operação | `viagens.write` |
| Pontos e vínculos, inclusive remoção | `geocercas.write` |
| Autorizações adicionais, inclusive remoção | `estudantes.write` |
| Aprovar/rejeitar solicitação e revogar dispositivo | `dispositivos.analise` |
| Presença manual e análise de revisão | `presencas.analise` |
| Criar cargo | `roles.write` |
| Criar/editar instituição e consultar pelo ID | `instituicoes.write` |
| Excluir instituição | `instituicoes.delete` |

Ter somente escrita não autoriza a consulta de uma área cujo backend exige leitura. As abas operacionais exigem a leitura e verificam a autorização de escrita novamente no envio. A lista pública de instituições fica disponível no workspace apenas a quem tem escrita ou exclusão de instituições; o detalhe individual requer escrita no backend.

## Particularidades e limites do backend

1. **QR de veículo**: criação e rotação retornam `data.qr.token` e `data.qr.url` uma única vez. A listagem/detalhe não retornam token. `TransporteQrCode` usa `qrcode@1.5.4` para codificar **o endereço completo retornado pelo backend** em SVG e PNG localmente, com correção M e margem branca de quatro módulos. O modal mostra a imagem com descrição acessível, permite baixar SVG/PNG e imprimir uma folha A4 com código de 110 mm. Cópia de token/endereço e TXT continuam disponíveis. Nenhum token é enviado a geradores externos. Endereço, arte e token permanecem em estado React, saem ao fechar/trocar área/sessão e não entram no cache das listas nem no armazenamento persistente. A impressão usa iframe local com SVG gerado pelo codificador e remove o iframe ao concluir a impressão ou desmontar o componente.
2. **Conflitos**: a atribuição devolve `conflitos` na raiz; a geração devolve `data.conflitos`. Ambos são apresentados com veículo, data e IDs de viagens. Ajuste conflitante retorna 409; sua mensagem original permanece visível.
3. **Janelas locais**: o backend fornece ISO com deslocamento local e exige `AAAA-MM-DD HH:MM` no PATCH. O formulário preserva a hora da operação sem converter para UTC. Atualização envia somente campos alterados; cancelar/ajustar uma viagem sem mudar a van não envia `veiculo_id`, evitando marcar indevidamente `veiculo_substituido`.
4. **Paginação**: viagens, dispositivos, solicitações, presenças, tentativas e auditoria retornam `data`/`meta`. Instituição usa `paginate(15)`, mas embrulha a coleção em JSON sem os metadados. A navegação usa o parâmetro `page` resolvido pelo paginator Laravel e disponibiliza próxima página quando a atual contém 15 registros; o total não é inventado. Cargos/instituições podem retornar somente `message` quando vazios.
5. **Cargos**: `RoleResource` retorna **apenas `title`, sem ID**. As rotas de edição/exclusão exigem um ID que a API não fornece. O frontend oferece consulta/criação e explica o impedimento; não transforma índice, título ou IDs do seeder em identidade. O backend também não oferece endpoint para atribuir permissões a um cargo. Concluir essas operações exige corrigir o contrato no backend, fora do escopo autorizado.
6. **Instituição vinculada**: exclusão impedida pode responder HTTP 200 com mensagem e sem `data`. A UI mantém a mensagem devolvida e recarrega a lista, sem remover otimisticamente um registro que continuou no servidor.
7. **Raio máximo**: vem de configuração do backend, não é exposto em endpoint. A UI exige raio >= 10 m e preserva erro 422 do servidor para o teto efetivo; não fixa um valor de ambiente.
8. Acesso por browser/API em execução não foi validado contra uma sessão real; os testes locais verificam contratos, payloads, transformação de horários, limites e encaminhamento das chamadas.

## Cache e erros

As leituras usam `createCachedQuery`/`useCachedQuery`, com chave por recurso e filtros. Após mutações, a invalidação comum revalida também dados relacionados (viagens, atribuições, indicadores e auditoria). Respostas assíncronas só atualizam estados locais/invalidação se `getQuerySessionVersion()` ainda corresponder à sessão que originou a operação; a troca de sessão também remonta os painéis e remove detalhes/QR transitórios.

Erros de permissão, validação, conflito e limite de requisições permanecem distintos: mensagens originais são priorizadas, os erros 422 são associados aos campos, 409 não fecha o formulário e 429 permite tentar novamente depois. Falha de leitura oferece atualização/tentativa novamente; falha não é convertida em lista vazia. A única normalização de vazio atende os contratos legados de cargos/instituições sem `data`.

## Verificação

- `node --test tests/transporte-service.test.cjs`: 11 testes de serviço/contrato/apresentação.
- `npx.cmd tsc --noEmit --incremental false`.
- `npx.cmd biome check src/components/ui/transportes src/types/transporte.ts src/services/api/modules/transporte.ts src/services/api/transporte-endpoints.ts "src/app/(dashboard)/transportes/page.tsx" tests/transporte-service.test.cjs`.

Sem alterações de backend, arquivos gerados ou dados privados. A biblioteca local `qrcode` e sua tipagem foram adicionadas pela tarefa principal para gerar a arte sem transmitir tokens a serviços externos.
