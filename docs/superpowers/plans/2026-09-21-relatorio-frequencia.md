# Relatório de frequência Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar o relatório consolidado de frequência com filtros, totais e histórico individual.

**Architecture:** Uma rota fina renderiza um workspace client-side. Componentes focados cuidam de filtros, totais, tabela e detalhe; `frequenciaService` permanece como única fronteira HTTP.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Axios, Biome e `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-21-relatorio-frequencia-design.md`

## Global Constraints

- Reutilizar `Button`, `DateInput`, `Input`, `Select`, `DataTable`, `Modal` e skeletons globais.
- Não adicionar dependências nem URLs de API dentro de componentes.
- Manter `page.tsx` como camada fina.
- O intervalo máximo é 366 dias e a resposta do backend é a fonte das métricas.
- Commits seguem `feat(frequencia): descrição`.

## Review Focus

- Resposta vazia deve preservar o período retornado e exibir estado vazio, sem quebrar cartões.
- `percentual_presenca: null` deve aparecer como `—`, não como `0%`.
- Benefício `null` para motorista não deve ocultar o histórico.
- Troca rápida de filtros não deve permitir que resposta antiga substitua a atual.
- Falha ao carregar detalhe não deve apagar ou corromper a listagem principal.

---

### Task 1: Regras de apresentação do relatório

**Files:**
- Modify: `tests/relatorio-frequencia-presentation.test.cjs`
- Modify: `src/components/ui/frequencias/relatorioFrequenciaPresentation.ts`

**Interfaces:**
- Consumes: `RelatorioFrequenciaFilters`, `RelatorioFrequenciaItem`.
- Produces: `validateReportPeriod`, `buildRelatorioParams`, `formatAttendancePercentage`, `getAttendanceTone`, `formatReportPeriod`.

- [ ] **Step 1: Escrever testes falhando para tom e período exibido**

```js
assert.equal(getAttendanceTone({ faltas: 3, faltas_consecutivas: 3 }), "danger");
assert.equal(getAttendanceTone({ faltas: 1, faltas_consecutivas: 0 }), "warning");
assert.equal(getAttendanceTone({ faltas: 0, faltas_consecutivas: 0 }), "success");
assert.equal(formatReportPeriod({ de: "2026-09-01", ate: "2026-09-18" }), "01/09/2026 a 18/09/2026");
```

- [ ] **Step 2: Executar o teste e confirmar RED**

Run: `node --test tests/relatorio-frequencia-presentation.test.cjs`
Expected: FAIL porque as duas funções ainda não existem.

- [ ] **Step 3: Implementar as funções mínimas**

`danger` quando a sequência for pelo menos 3 ou houver pelo menos 5 faltas; `warning` quando houver qualquer falta; caso contrário `success`. Datas são formatadas sem deslocamento de fuso usando o helper já existente `formatCallDate`.

- [ ] **Step 4: Executar testes e Biome**

Run: `node --test tests/relatorio-frequencia-presentation.test.cjs && npx.cmd biome check src/components/ui/frequencias/relatorioFrequenciaPresentation.ts tests/relatorio-frequencia-presentation.test.cjs`
Expected: todos os testes passam e Biome sem diagnósticos.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/frequencias/relatorioFrequenciaPresentation.ts tests/relatorio-frequencia-presentation.test.cjs
git commit -m "feat(frequencia): completar apresentação do relatório"
```

### Task 2: Componentes visuais do relatório

**Files:**
- Create: `src/components/ui/frequencias/RelatorioFrequenciaFilterCard.tsx`
- Create: `src/components/ui/frequencias/RelatorioFrequenciaSummary.tsx`
- Create: `src/components/ui/frequencias/RelatorioFrequenciaTable.tsx`
- Create: `src/components/ui/frequencias/RelatorioFrequenciaSkeleton.tsx`

**Interfaces:**
- Consumes: tipos e helpers da Task 1, `FrequenciaLinha[]`, `RelatorioFrequenciaResponse`.
- Produces: componentes controlados, sem chamadas HTTP.

- [ ] **Step 1: Criar filtro controlado**

Usar `DateInput` para `de/ate`, `Select` para linha, `Input type="number"` para sequência mínima e bloquear Filtrar quando `validateReportPeriod` retornar erro.

- [ ] **Step 2: Criar cartões de totais**

Renderizar estudantes, presenças, faltas, justificadas e pendentes em grid responsivo, usando ícones Lucide e os tokens visuais existentes.

- [ ] **Step 3: Criar tabela e skeleton**

Usar `DataTable`; exibir estudante/CPF, linha, percentual, contagens, sequência e botão `Detalhes`. Aplicar o tom calculado somente ao indicador de presença/risco.

- [ ] **Step 4: Validar componentes**

Run: `npx.cmd biome check src/components/ui/frequencias/RelatorioFrequenciaFilterCard.tsx src/components/ui/frequencias/RelatorioFrequenciaSummary.tsx src/components/ui/frequencias/RelatorioFrequenciaTable.tsx src/components/ui/frequencias/RelatorioFrequenciaSkeleton.tsx`
Expected: sem diagnósticos.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/frequencias/RelatorioFrequencia*.tsx
git commit -m "feat(frequencia): criar visual do relatório"
```

### Task 3: Detalhe individual do estudante

**Files:**
- Create: `src/components/ui/frequencias/RelatorioEstudanteModal.tsx`

**Interfaces:**
- Consumes: `RelatorioEstudanteResponse`, `formatCallDate`, `formatAttendancePercentage`.
- Produces: modal controlado por `open`, `loading`, `error`, `report` e `onClose`.

- [ ] **Step 1: Criar modal com estados de loading e erro**

Usar `Modal`; o loading mostra skeletons e o erro usa `role="alert"`. O modal deve permanecer utilizável quando `beneficio` for `null`.

- [ ] **Step 2: Renderizar resumo, benefício e histórico**

Exibir limites e contagens mensais somente quando disponíveis. O histórico lista data, linha, situação e observação, com estado vazio quando necessário.

- [ ] **Step 3: Validar componente**

Run: `npx.cmd biome check src/components/ui/frequencias/RelatorioEstudanteModal.tsx`
Expected: sem diagnósticos.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/frequencias/RelatorioEstudanteModal.tsx
git commit -m "feat(frequencia): adicionar histórico do estudante"
```

### Task 4: Workspace, rota e navegação

**Files:**
- Create: `src/components/ui/frequencias/RelatorioFrequenciaWorkspace.tsx`
- Create: `src/app/(dashboard)/frequencias/relatorio/page.tsx`
- Modify: `src/components/ui/layout/AppSidebar.tsx`

**Interfaces:**
- Consumes: `frequenciaService.report`, `frequenciaService.studentReport`, componentes das Tasks 2 e 3.
- Produces: rota `/frequencias/relatorio` integrada à sidebar.

- [ ] **Step 1: Coordenar filtros e consulta principal**

Carregar linhas uma vez. Consultar relatório ao montar e ao aplicar filtros. Usar contador incremental em `useRef` para ignorar respostas antigas. Limpar filtros restaura o período padrão do backend.

- [ ] **Step 2: Coordenar detalhe individual**

Abrir o modal imediatamente, consultar o estudante com os parâmetros de período aplicados e manter erros isolados da listagem.

- [ ] **Step 3: Publicar rota e item de menu**

Página fina retorna `RelatorioFrequenciaWorkspace`; sidebar recebe “Relatório de frequência” em `/frequencias/relatorio`, sem marcar simultaneamente o item de chamada.

- [ ] **Step 4: Verificação completa**

Run: `node --test tests/*.test.cjs && npx.cmd biome check src/components/ui/frequencias src/components/ui/layout/AppSidebar.tsx 'src/app/(dashboard)/frequencias/relatorio/page.tsx' src/services/api/modules/frequencia.ts src/services/api/endpoints.ts src/types/frequencia.ts tests && npm.cmd run build`
Expected: testes verdes, Biome sem diagnósticos nos arquivos da entrega e build listando `/frequencias/relatorio`.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(dashboard)/frequencias/relatorio/page.tsx' src/components/ui/frequencias/RelatorioFrequenciaWorkspace.tsx src/components/ui/layout/AppSidebar.tsx
git commit -m "feat(frequencia): publicar relatório de frequência"
```
