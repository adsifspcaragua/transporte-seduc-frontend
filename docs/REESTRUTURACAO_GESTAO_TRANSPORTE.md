# Reestruturação da Gestão do Transporte e Embarques

Implementação inicial no frontend em 13/11/2026. O backend Laravel, os endpoints e as regras de negócio não foram alterados.

## Navegação e rotas

O menu principal agora separa **Gestão do transporte** (`/transportes`) de **Embarques e presenças** (`/embarques`). Cargos, instituições e auditoria geral ficam em **Administração** (`/administracao`), com visibilidade por permissão.

| Área | Rotas | Função |
| --- | --- | --- |
| Gestão do transporte | `/transportes`, `/transportes/linhas/nova`, `/transportes/linhas/[id]` | Visão das linhas, cadastro básico e gestão individual por cinco abas |
| Gestão do transporte | `/transportes/calendario`, `/transportes/recursos` | Viagens e dias sem operação; veículos e pontos compartilhados |
| Embarques e presenças | `/embarques`, `/embarques/presencas`, `/embarques/ocorrencias`, `/embarques/dispositivos` | Indicadores, registros, tentativas, revisões, solicitações e credenciais |
| Administração | `/administracao` | Cargos, instituições e auditoria geral |

`/linhas` redireciona para `/transportes`. O link legado `/transportes?linha=ID&configurar=1` redireciona para a página individual da linha. O atalho do dashboard aponta para `/transportes`.

## Fluxos disponíveis

- A visão geral consulta linhas reais, mostra ocupação, situação da programação no dia e abre a página própria da linha. A contagem de veículos refere-se a **veículos cadastrados**, sem afirmar que estão em operação.
- O cadastro inicial grava a linha com o serviço existente e segue para a aba **Veículo e QR**. Cada etapa posterior é uma operação persistida separadamente.
- Cada linha tem as abas **Resumo**, **Veículo e QR**, **Programação**, **Pontos de embarque** e **Estudantes**. A aba é identificada por `?aba=` e permanece após recarregar. A edição dos dados básicos usa o formulário e serviço de linha existentes.
- Atribuições de veículo, QR do veículo físico, horários recorrentes, geração explícita e ajuste de viagens, dias sem operação, vínculos de pontos e autorizações temporárias usam `TransporteResourcePanel` e os contratos atuais. A criação de veículos e pontos compartilhados continua disponível na linha e em Recursos.
- Calendário geral usa a lista paginada de viagens com filtro de período e linha, mais dias sem operação e horários. A consulta não gera viagens. A geração continua sendo uma ação explícita com as confirmações existentes.
- Embarques usa os indicadores atuais e as listagens paginadas do servidor. Revisões, presença manual justificada, aprovação/rejeição de solicitações e revogação de dispositivos permanecem nos painéis existentes.
- A área de Administração mantém cargos, instituições e auditoria acessíveis conforme as permissões. Não há fluxo de motorista nem chamada administrativa `/frequencias` nas novas páginas.

## Reuso e remoção

Foram reutilizados `TransporteResourcePanel`, `TransporteIndicadores`, `TransporteLinhaResumo`, `TransporteLinhaStep`, `LinhaFormFields`, `transporteConfigs`, os serviços de linha/transporte, `useCachedQuery`, os componentes globais de formulário, botão, modal e loading, além dos guards do layout.

Foram removidos os componentes exclusivos da navegação anterior: `TransporteConfiguracaoWorkspace`, `TransporteManutencao`, `transporteNavigation`, `LinhasWorkspace`, `LinhaCard`, `LinhaDetailsModal` e `LinhasSkeleton`. Nenhum serviço de API foi removido.

## Pendências e limites

- A busca de estudantes na aba da linha filtra a página atual, pois `GET /linha/{id}/estudantes` não oferece busca por nome no serviço existente. A paginação do servidor foi preservada. O link abre o cadastro do estudante na área geral por `?id=`, usando `GET /estudantes/{id}`.
- A primeira versão usa lista de viagens como calendário. Não há mapa geográfico de pontos nem detecção adicional de conflitos nessa tela; o resumo da linha mantém a detecção de possíveis conflitos já implementada.
- As operações de configuração ainda usam os formulários e modais do painel genérico; uma próxima rodada de UX pode reduzir o número de campos por tarefa sem alterar os contratos.
- A criação e edição de cargos seguem limitadas pelo `RoleResource`, que não fornece ID estável para editar ou excluir. A API de linhas mantém `motorista_id` opcional; o frontend não o envia.
- Não houve teste com servidor/API e contas reais. É necessário homologar permissões, QR, geolocalização, câmera, geração/cancelamento de viagens e decisões administrativas em ambiente seguro.

## Verificação

- `npx.cmd tsc --noEmit --incremental false`: aprovado.
- `node --test tests/*.test.cjs`: 83 testes aprovados, nenhuma falha.
- `npm.cmd run build`: aprovado; 32 páginas geradas na etapa de pré-renderização.
- `npx.cmd biome check` nos arquivos alterados: aprovado.
- `npm.cmd run lint`: falha em arquivos preexistentes devido principalmente a diferenças CRLF/LF, inclusive `biome.json`, `next.config.ts` e `tsconfig.json`; não foi feita formatação global fora do escopo.
- `git diff --check`: aprovado. O workspace do backend permaneceu sem alterações.

## Próxima rodada de UX

Validar a navegação com operadores reais; priorizar pesquisa de estudantes em todas as páginas, acesso direto ao cadastro, visualização cronológica mais rica das viagens e formulários por tarefa para vínculos e revisões. Manter as confirmações de ações com efeitos em múltiplas viagens e a regra de QR vinculado ao veículo físico.
