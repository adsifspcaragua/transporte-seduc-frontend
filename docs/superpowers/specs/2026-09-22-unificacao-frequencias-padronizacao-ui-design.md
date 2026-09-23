# Unificação de Frequências e Padronização das Telas Novas

## Objetivo

Transformar as quatro experiências de frequência em uma única área coerente do sistema e corrigir a apresentação das telas novas para que Frequências e Usuários sigam o mesmo padrão visual, responsivo e de interação já consolidado em Estudantes, Linhas e Solicitações.

O resultado deve reduzir a fragmentação do menu, preservar todas as funcionalidades e permissões existentes e eliminar campos sobrepostos, variantes de formulário incompatíveis, botões desalinhados e diferenças desnecessárias de bordas, fundos, espaçamentos e tabelas.

## Escopo

- Substituir os quatro itens de frequência do sidebar por uma única entrada `Frequência`.
- Criar uma navegação interna por abas para Chamada diária, Histórico, Justificativas e Relatórios.
- Preservar as rotas atuais para links diretos, recarregamento, histórico do navegador e autorização por URL.
- Compartilhar entre as quatro rotas um cabeçalho e uma navegação visual comuns.
- Mostrar somente as abas permitidas ao usuário autenticado.
- Padronizar todas as telas da área de frequência.
- Padronizar a listagem e o formulário administrativo de usuários.
- Corrigir comportamento responsivo, estados vazios, carregamento, erros, botões, tabelas, filtros e modais dessas telas.

Não fazem parte desta entrega alterações nos contratos do backend, novas regras de frequência, mudanças na matriz de permissões ou redesign das telas antigas usadas como referência.

## Arquitetura da área de frequência

### Navegação global

O sidebar terá apenas um item `Frequência`, apontando para `/frequencias`. Ele ficará ativo em qualquer rota iniciada por `/frequencias`.

Os itens independentes `Histórico de chamadas`, `Justificativas` e `Relatório de frequência` serão removidos do sidebar. Eles continuarão acessíveis pela navegação interna da área.

### Navegação interna

Um componente compartilhado, `FrequenciaLayout`, envolverá o conteúdo das rotas de frequência e será responsável por:

- título geral e descrição curta da área;
- abas responsivas e acessíveis;
- indicação visual da aba ativa;
- filtragem das abas por permissão;
- área de conteúdo com espaçamento consistente.

As abas serão vinculadas a rotas, não a estado local:

| Aba | Rota | Permissão |
| --- | --- | --- |
| Chamada diária | `/frequencias` | `frequencias.view` |
| Histórico | `/frequencias/chamadas` | `frequencias.view` |
| Justificativas | `/frequencias/justificativas` | `justificativas.view` |
| Relatórios | `/frequencias/relatorio` | `frequencias.view` |

Esse desenho mantém cada workspace isolado, evita um componente monolítico e permite que cada aba preserve seus filtros, paginação, modais e carregamento.

### Composição no App Router

A rota `src/app/(dashboard)/frequencias/layout.tsx` renderizará o layout compartilhado e o `children` da rota ativa. Os `page.tsx` continuarão finos e chamarão seus workspaces específicos.

Os workspaces deixarão de repetir o cabeçalho “Controle de frequência”. Cada um exibirá apenas o conteúdo e, quando necessário, um título contextual compacto dentro da área compartilhada.

## Padrão visual

Estudantes, Linhas e Solicitações serão a referência. As telas corrigidas usarão:

- largura de conteúdo, margens e espaçamentos equivalentes às telas existentes;
- fundo branco nos cards e campos administrativos;
- `rounded-lg`, bordas suaves e `shadow-sm` conforme os cards consolidados;
- títulos em `text-brand-600`/`text-brand-700` e hierarquia tipográfica existente;
- componentes globais de formulário e botão sem classes concorrentes;
- tabelas pelo componente global `DataTable` quando o contrato da tela permitir;
- `TableActionButton` para ações compactas de linha;
- mensagens e estados vazios com o mesmo tratamento das telas antigas;
- skeletons com a mesma geometria do conteúdo final.

### Formulários e filtros

Todo campo apresentado sobre fundo branco usará explicitamente a variante `white`. Em especial, `DateInput` não dependerá mais de sua variante escura padrão.

Os filtros terão:

- título `Filtros` com ícone, como em Solicitações;
- grid responsivo sem larguras fixas concorrentes;
- campos com altura e label uniformes;
- ações `Limpar` e `Filtrar` alinhadas ao final do grid;
- uma coluna no mobile, duas no tablet e distribuição proporcional no desktop;
- mensagens de erro abaixo dos campos sem alterar ou sobrepor o conteúdo vizinho.

### Botões

Os botões usarão exclusivamente o componente global `Button`, com altura, ícones, loading e variantes já existentes. Não haverá fundo escuro aplicado diretamente a inputs ou pseudo-botões que simulem campos.

### Tabelas

Histórico, Justificativas, Relatórios e Usuários terão cabeçalho, linhas, ações, estado vazio, erro, loading e paginação coerentes com a tabela de Solicitações. Quando for necessário manter uma tabela específica, ela reproduzirá as mesmas primitivas visuais sem alterar seu contrato funcional.

## Fluxos por aba

### Chamada diária

- Data da chamada em campo branco integrado ao cabeçalho operacional.
- Cards de linha preservados, com dimensões consistentes e botão de ação global.
- Abertura, continuação e visualização permanecem condicionadas às permissões atuais.
- A folha de chamada abre dentro da mesma área, mantendo a navegação de retorno.

### Histórico

- Filtros padronizados para status, linha e intervalo de datas.
- Datas com variante branca e calendário global.
- Tabela e paginação no padrão do sistema.
- Ações de visualizar e excluir preservadas conforme permissão.

### Justificativas

- Filtros padronizados para status, linha e intervalo de datas.
- Contador de itens em análise mantido como indicador secundário.
- Visualização e análise continuam em modal e respeitam `justificativas.analise`.

### Relatórios

- Filtros de período, linha e mínimo de faltas padronizados.
- Métricas mantidas em cards compactos e responsivos.
- Tabela de estudantes e modal de histórico preservados.

## Gestão de usuários

A rota `/usuarios` continuará independente da área de frequência, mas será revisada pelo mesmo padrão visual:

- cabeçalho simples igual ao de Estudantes/Linhas;
- botão `Novo usuário` no padrão global;
- listagem usando a estrutura visual de tabela consolidada;
- estado vazio, erro e skeleton compatíveis com a tabela final;
- formulário modal com grid responsivo e todos os campos em variante branca;
- ações de editar, ativar, inativar e excluir usando `TableActionButton`;
- preservação da autoproteção e das permissões já implementadas.

## Responsividade e acessibilidade

- As abas terão rolagem horizontal controlada em telas estreitas, sem truncar o conteúdo principal.
- Nenhum campo dependerá de largura fixa maior que o contêiner.
- Grids se reorganizarão sem sobreposição de labels, valores ou mensagens.
- Links de abas usarão estado ativo perceptível e `aria-current="page"`.
- Campos manterão associação entre label e controle.
- Botões manterão foco visível, nomes acessíveis e estados disabled/loading.
- Tabelas poderão rolar horizontalmente apenas quando suas colunas não puderem ser condensadas com segurança.

## Dados, erros e permissões

Os serviços e contratos atuais serão preservados. A unificação é de navegação e apresentação, não de carregamento conjunto.

Cada workspace continuará fazendo apenas suas próprias consultas. O layout não antecipará dados de abas inativas. Erros permanecerão locais à aba e as ações continuarão ocultas conforme as permissões efetivas retornadas por `/me`.

Uma URL sem permissão continuará sendo bloqueada por `PermissionBoundary` antes da montagem do workspace. A lista de abas também ocultará destinos indisponíveis.

## Testes e verificação

- Testar a lista e a seleção das abas por rota e permissão.
- Testar que o sidebar contém uma única entrada de frequência.
- Testar helpers de apresentação extraídos durante a padronização.
- Manter os testes de serviços, filtros, validações e autorização existentes.
- Verificar visualmente as cinco rotas em larguras mobile e desktop: quatro rotas de frequência e Usuários.
- Executar a suíte frontend completa, TypeScript, Biome e build de produção.

## Critérios de aceite

- O sidebar exibe apenas uma entrada de frequência.
- As quatro funcionalidades são acessíveis como abas de uma única área.
- Links diretos das rotas antigas continuam funcionando.
- Campos de data, selects e inputs não se sobrepõem e usam o fundo branco correto.
- Filtros e botões seguem o padrão de Solicitações.
- Tabelas, modais, mensagens e skeletons são visualmente coerentes com o restante do sistema.
- Usuários deixa de parecer uma tela paralela e passa a seguir o mesmo padrão administrativo.
- O layout funciona sem estouros em mobile e desktop.
- Nenhuma funcionalidade ou restrição de permissão existente é perdida.
