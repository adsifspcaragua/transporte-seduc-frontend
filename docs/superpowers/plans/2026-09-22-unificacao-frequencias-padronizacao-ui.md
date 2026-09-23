# Unificação de Frequências e Padronização da UI — Plano de Implementação

**Objetivo:** reunir Chamada, Histórico, Justificativas e Relatórios em uma única área navegável e alinhar Frequências e Usuários ao padrão visual de Estudantes, Linhas e Solicitações.

**Especificação:** `docs/superpowers/specs/2026-09-22-unificacao-frequencias-padronizacao-ui-design.md`

## 1. Estrutura e navegação

- Criar o layout compartilhado da rota `/frequencias`.
- Criar abas tipadas, filtradas por permissão e vinculadas às rotas existentes.
- Manter somente uma entrada `Frequência` no sidebar.
- Cobrir seleção, permissões e item único com testes.
- Commit: `feat(frequencias): unificar navegacao da area`.

## 2. Primitivas visuais e filtros

- Comparar os componentes novos com os padrões de Solicitações e Linhas.
- Padronizar cards de filtros, grids responsivos, variantes brancas de campos e ações.
- Corrigir sobreposição de labels e valores sem criar componentes globais duplicados.
- Commit: `fix(frequencias): padronizar filtros e campos`.

## 3. Conteúdo das quatro abas

- Remover cabeçalhos duplicados dos workspaces.
- Padronizar Chamada diária, Histórico, Justificativas e Relatórios.
- Alinhar cards, métricas, tabelas, estados vazios, erros, skeletons e modais.
- Preservar serviços, rotas, permissões e comportamento funcional.
- Commit: `fix(frequencias): alinhar telas ao padrao visual`.

## 4. Gestão de usuários

- Padronizar cabeçalho, tabela, vazio, erro e skeleton.
- Padronizar modal e grid do formulário com campos brancos.
- Preservar permissões, autoproteção e atualização da sessão.
- Commit: `fix(usuarios): alinhar gestao ao padrao visual`.

## 5. Verificação

- Executar testes focados durante cada etapa.
- Executar todos os testes CJS, TypeScript, Biome e build.
- Inspecionar as cinco rotas em viewport desktop e mobile quando o ambiente local permitir.
- Corrigir somente regressões desta entrega e commitar por escopo.
- Confirmar worktree limpa e histórico separado por escopo.
