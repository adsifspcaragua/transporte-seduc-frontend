# UNIBUS — plano de auditoria e padronização

**Objetivo:** corrigir inconsistências preservando componentes, identidade visual, contratos e permissões.
**Arquitetura:** manter App Router, workspaces, painel de transporte configurável, serviços Axios e cache por sessão. Nenhuma biblioteca nova.
**Referência:** solicitação de auditoria UNIBUS fornecida em 06/11/2026 e AGENTS.md.

## Proposta de navegação, registrada antes da implementação

Manter `/transportes`, com dois níveis de botões existentes: cinco áreas e apenas as seções da área selecionada. Filtrar seções pelas permissões atuais; ocultar áreas vazias. Não modificar os guards nem as permissões. O painel continua sendo montado por seção; mudanças entre seções continuam reiniciando filtros locais como antes.

| Seção atual | Área proposta |
| --- | --- |
| Veículos; Veículo × linha; Pontos de embarque; Ponto × linha | Estrutura |
| Horários; Viagens; Dias sem operação | Operação |
| Autorizações de linha; Dispositivos; Presenças registradas | Embarque |
| Solicitações de dispositivo; Tentativas e revisões; Auditoria | Conferência |
| Cargos; Instituições; Indicadores | Administração |

A alternativa de novas rotas aumentaria o escopo e mudaria os endereços; manter todas as abas planas não atende à redução de opções simultâneas. Dois níveis preservam a estrutura atual.

## Etapas

- [x] Auditar campos, ações, navegação, rotas, serviços e regras do backend.
- [x] Corrigir DateInput na origem: variante administrativa branca, calendário de 288px, preservar limites e popover na camada superior.
- [x] Reaproveitar TableActionButton no painel; preservar confirmações e ordem visualizar, editar, adicionais, excluir.
- [x] Implementar agrupamento acima sem remover seções ou permissões.
- [x] Substituir seleção numérica de estudante por pesquisa paginada por nome; reaproveitar Input, Select, Button e cache com isolamento de sessão.
- [x] Revisar mensagens técnicas e documentar limitações reais.
- [x] Documentar arquitetura, inventário, perfis, API, fluxos, relacionamentos e validação em UNIBUS_DOCUMENTACAO_COMPLETA.md.
- [x] Executar testes Node, Biome, TypeScript e build; registrar restrições de validação visual e integração.

## Integração de busca de estudantes

Confirmado: `EstudanteService::index` oferece paginação, mas não pesquisa por nome. Necessidade registrada antes da alteração: adicionar parâmetro opcional `search` ao GET existente `/estudantes`, com validação de tamanho e filtro por nome no servidor. Preservar resposta, paginação e middleware `estudantes.view`; nenhuma migração ou alteração de banco. Não carregar toda a base nem tratar busca apenas na página atual como busca global.

## Pontos de revisão

Datas mínimas/máximas, calendário dentro de modal e viewport pequeno; pesquisa vazia/erro/sem resultados e troca rápida de consulta; permissões sem acesso ao cadastro; seções únicas por grupo; estados após mutação. Alterações locais preexistentes devem ser preservadas. Não ler arquivos .env.

## Validacao e revisao

Implementacao revisada por agente independente somente leitura. Corrigidos os achados sobre limpeza dos seletores opcionais e reinicio da pesquisa de indicadores. Ver evidencias e limitacoes em `docs/UNIBUS_DOCUMENTACAO_COMPLETA.md` (arquivo principal em docs/). Validacao visual nos sete tamanhos permanece pendente por bloqueio do controle do navegador. O lint global fora do escopo permanece pendente; nenhuma dependencia ou permissao foi alterada.
