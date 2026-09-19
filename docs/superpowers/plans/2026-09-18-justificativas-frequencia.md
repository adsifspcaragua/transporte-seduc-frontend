# Fila de Justificativas de Frequência Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a fila administrativa para filtrar, consultar, aprovar e rejeitar justificativas de frequência.

**Architecture:** A rota fina renderiza um workspace client-side que coordena filtros, paginação e análise. Contratos HTTP permanecem no serviço de frequência; regras de parâmetros e validação ficam em um módulo puro testável; tabela, filtros e modal são componentes focados que reutilizam a UI global.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Axios, Tailwind CSS 4, Biome e `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-18-justificativas-frequencia-design.md`

## Global Constraints

- Não implementar relatórios, criação retroativa de justificativa ou atribuição de motoristas.
- Não duplicar `Button`, `Select`, `DateInput`, `Textarea`, `Modal`, `DataTable`, `Pagination` ou skeletons globais.
- Não inferir permissões no cliente; o backend continua sendo a autoridade.
- Rejeição exige parecer não vazio com no máximo 1.000 caracteres.
- Preservar todas as alterações locais preexistentes.
- Desenvolver contratos e regras novas com TDD.

---

### Task 1: Contratos HTTP de justificativas

**Files:**
- Modify: `tests/frequencia-service.test.cjs`
- Modify: `src/types/frequencia.ts`
- Modify: `src/services/api/endpoints.ts`
- Modify: `src/services/api/modules/frequencia.ts`

**Interfaces:**
- Produces: `JustificativaStatus`, `Justificativa`, `ListarJustificativasParams`, `PaginatedJustificativas`, `AnaliseJustificativaPayload`, `AnaliseJustificativaResponse`.
- Produces: `frequenciaService.listJustificativas(params)`, `showJustificativa(id)` e `analyzeJustificativa(id, payload)`.

- [ ] **Step 1: Escrever testes que protegem URLs, filtros e payloads**

Adicionar ao teste do serviço fixtures completas e estes comportamentos:

```js
test("lista justificativas paginadas com filtros", async () => {
  const response = {
    data: [justificativa],
    meta: paginationMeta,
    em_analise: 4,
  };
  const { service, calls } = setup(response);
  assert.deepEqual(
    plain(await service.listJustificativas({
      status: "Em analise",
      linha_id: 3,
      de: "2026-09-01",
      ate: "2026-09-18",
      page: 2,
      per_page: 15,
    })),
    response,
  );
  assert.deepEqual(plain(calls[0]), {
    method: "get",
    url: "/frequencias/justificativas",
    body: { params: {
      status: "Em analise",
      linha_id: 3,
      de: "2026-09-01",
      ate: "2026-09-18",
      page: 2,
      per_page: 15,
    } },
  });
});

test("carrega e analisa uma justificativa", async () => {
  const { service, calls } = setup({
    data: justificativa,
    message: "Justificativa rejeitada: a falta passa a contar",
  });
  await service.showJustificativa(21);
  await service.analyzeJustificativa(21, {
    decisao: "Rejeitada",
    parecer: "Documento sem data legível.",
  });
  assert.deepEqual(calls, [
    { method: "get", url: "/frequencias/justificativas/21" },
    {
      method: "put",
      url: "/frequencias/justificativas/21/analise",
      body: {
        decisao: "Rejeitada",
        parecer: "Documento sem data legível.",
      },
    },
  ]);
});
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `node --test tests/frequencia-service.test.cjs`

Expected: FAIL porque os três métodos ainda não existem.

- [ ] **Step 3: Implementar tipos, endpoints e métodos mínimos**

Definir:

```ts
export type JustificativaStatus = "Em analise" | "Aprovada" | "Rejeitada";

export type Justificativa = {
  id: number;
  status: JustificativaStatus;
  motivo: string;
  parecer: string | null;
  estudante: {
    id: number;
    name: string;
    cpf: string | null;
    email: string | null;
    status: string | null;
  } | null;
  falta: {
    frequencia_id: number;
    situacao: FrequenciaSituacao;
    chamada_id: number;
    data: string;
    linha: FrequenciaPessoa | null;
  };
  enviada_por?: FrequenciaPessoa | null;
  analisada_por?: FrequenciaPessoa | null;
  analisada_em: string | null;
  created_at: string | null;
};

export type AnaliseJustificativaPayload =
  | { decisao: "Aprovada"; parecer?: null }
  | { decisao: "Rejeitada"; parecer: string };
```

Adicionar endpoints:

```ts
JUSTIFICATIVAS: "/frequencias/justificativas",
JUSTIFICATIVA_BY_ID: (id) => `/frequencias/justificativas/${id}`,
ANALISAR_JUSTIFICATIVA: (id) =>
  `/frequencias/justificativas/${id}/analise`,
```

Os métodos devem usar `sharePendingRequest` apenas para listagem e detalhe; análise usa `api.put` diretamente.

- [ ] **Step 4: Executar e confirmar GREEN**

Run: `node --test tests/frequencia-service.test.cjs`

Expected: todos os testes PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/frequencia-service.test.cjs src/types/frequencia.ts src/services/api/endpoints.ts src/services/api/modules/frequencia.ts
git commit -m "feat(frequencia): adicionar contratos de justificativas"
```

---

### Task 2: Regras puras de filtros e análise

**Files:**
- Create: `tests/justificativa-presentation.test.cjs`
- Create: `src/components/ui/frequencias/justificativaPresentation.ts`

**Interfaces:**
- Produces: `JustificativaFilters`, `EMPTY_JUSTIFICATIVA_FILTERS`, `buildJustificativaParams`, `validateAnalysis`, `canAnalyzeJustificativa`, `getJustificativaStatusTone`, `formatJustificativaDateTime`.

- [ ] **Step 1: Escrever testes das decisões da interface**

```js
test("remove filtros vazios e mantém paginação", () => {
  assert.deepEqual(plain(buildJustificativaParams({
    status: "Em analise",
    linhaId: "",
    de: "",
    ate: "2026-09-18",
  }, 2, 15)), {
    status: "Em analise",
    ate: "2026-09-18",
    page: 2,
    per_page: 15,
  });
});

test("rejeição exige parecer e aprovação não exige", () => {
  assert.equal(validateAnalysis("Rejeitada", " "), "Informe o parecer da rejeição.");
  assert.equal(validateAnalysis("Rejeitada", "Documento inválido."), "");
  assert.equal(validateAnalysis("Aprovada", ""), "");
});

test("somente pendente pode receber decisão", () => {
  assert.equal(canAnalyzeJustificativa({ status: "Em analise" }), true);
  assert.equal(canAnalyzeJustificativa({ status: "Aprovada" }), false);
  assert.equal(canAnalyzeJustificativa({ status: "Rejeitada" }), false);
});
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `node --test tests/justificativa-presentation.test.cjs`

Expected: FAIL porque o módulo ainda não existe.

- [ ] **Step 3: Implementar regras mínimas**

`buildJustificativaParams` deve converter `linhaId` não vazio em número, omitir strings vazias e manter `page/per_page`. `validateAnalysis` deve também rejeitar texto com mais de 1.000 caracteres. `getJustificativaStatusTone` retorna `pending`, `approved` ou `rejected`, sem classes Tailwind no teste. `formatJustificativaDateTime` usa `Intl.DateTimeFormat("pt-BR")` e retorna `"Não informado"` para valor ausente.

- [ ] **Step 4: Executar e confirmar GREEN**

Run: `node --test tests/justificativa-presentation.test.cjs`

Expected: todos os testes PASS.

- [ ] **Step 5: Executar a suíte acumulada**

Run: `node --test tests/*.test.cjs`

Expected: todos os testes PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/justificativa-presentation.test.cjs src/components/ui/frequencias/justificativaPresentation.ts
git commit -m "feat(frequencia): modelar filtros e analise de justificativas"
```

---

### Task 3: Filtros, tabela e modal de análise

**Files:**
- Create: `src/components/ui/frequencias/JustificativasFilterCard.tsx`
- Create: `src/components/ui/frequencias/JustificativasTable.tsx`
- Create: `src/components/ui/frequencias/JustificativaAnalysisModal.tsx`
- Create: `src/components/ui/frequencias/JustificativasSkeleton.tsx`

**Interfaces:**
- `JustificativasFilterCard({ filters, linhas, disabled, onChange, onApply, onClear })`.
- `JustificativasTable({ data, loading, errorMessage, pagination, onRetry, onView, onApprove, onReject })`.
- `JustificativaAnalysisModal({ justificativa, mode, loading, error, onClose, onConfirm })`.

- [ ] **Step 1: Implementar o card de filtros com componentes globais**

Usar `Select` para status e linha, dois `DateInput` para período e botões “Filtrar”/“Limpar”. O intervalo inválido (`ate < de`) deve bloquear a aplicação e mostrar erro no campo final. As opções de status são literais do backend.

```ts
const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "Em analise", label: "Em análise" },
  { value: "Aprovada", label: "Aprovada" },
  { value: "Rejeitada", label: "Rejeitada" },
];
```

- [ ] **Step 2: Implementar a tabela responsiva**

Usar `DataTable<Justificativa>` com colunas estudante, linha/data, motivo, status e ações. Renderizar linhas em grid no desktop e com labels visíveis no mobile. Motivo usa `line-clamp-2`; o botão “Detalhes” permanece disponível para todos; aprovar/rejeitar aparecem somente se `canAnalyzeJustificativa` retornar `true`.

- [ ] **Step 3: Implementar o modal de análise**

No modo `approve`, exibir resumo e confirmação. No modo `reject`, renderizar `Textarea` controlado, `maxLength={1000}`, contador e erro de `validateAnalysis`. O callback envia exatamente:

```ts
mode === "approve"
  ? { decisao: "Aprovada" }
  : { decisao: "Rejeitada", parecer: parecer.trim() };
```

O modo `view` oculta o botão salvar e mostra motivo, parecer, solicitante, responsável e datas.

- [ ] **Step 4: Implementar skeletons da tabela**

Criar cabeçalho e cinco linhas com `Skeleton`/`TextSkeleton`, sem índices como keys.

- [ ] **Step 5: Verificar componentes isolados**

Run: `npx.cmd biome check src/components/ui/frequencias/JustificativaAnalysisModal.tsx src/components/ui/frequencias/JustificativasFilterCard.tsx src/components/ui/frequencias/JustificativasTable.tsx src/components/ui/frequencias/JustificativasSkeleton.tsx`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/frequencias/JustificativaAnalysisModal.tsx src/components/ui/frequencias/JustificativasFilterCard.tsx src/components/ui/frequencias/JustificativasTable.tsx src/components/ui/frequencias/JustificativasSkeleton.tsx
git commit -m "feat(frequencia): criar interface de justificativas"
```

---

### Task 4: Workspace, rota e navegação

**Files:**
- Create: `src/components/ui/frequencias/JustificativasWorkspace.tsx`
- Create: `src/app/(dashboard)/frequencias/justificativas/page.tsx`
- Modify: `src/components/ui/layout/AppSidebar.tsx`

**Interfaces:**
- Consumes: componentes da Task 3 e métodos da Task 1.
- Produces: página `/frequencias/justificativas`.

- [ ] **Step 1: Implementar o workspace**

Estados obrigatórios:

```ts
const [filters, setFilters] = useState(EMPTY_JUSTIFICATIVA_FILTERS);
const [appliedFilters, setAppliedFilters] = useState(EMPTY_JUSTIFICATIVA_FILTERS);
const [page, setPage] = useState(1);
const [perPage, setPerPage] = useState(15);
const [response, setResponse] = useState<PaginatedJustificativas | null>(null);
const [selected, setSelected] = useState<Justificativa | null>(null);
const [modalMode, setModalMode] = useState<"view" | "approve" | "reject" | null>(null);
```

Carregar linhas uma vez; carregar justificativas quando `appliedFilters`, `page` ou `perPage` mudar. Em `403`, mostrar mensagem de acesso sem renderizar dados. Depois de analisar, exibir `message` e `alerta`, fechar o modal e recarregar. Se a página atual ficar vazia e for maior que 1, decrementar `page`.

- [ ] **Step 2: Criar a página fina**

```tsx
import { JustificativasWorkspace } from "@/components/ui/frequencias/JustificativasWorkspace";

export default function JustificativasPage() {
  return <JustificativasWorkspace />;
}
```

- [ ] **Step 3: Publicar na sidebar**

Importar `FileCheck2` e adicionar após Frequência:

```ts
{
  label: "Justificativas",
  icon: FileCheck2,
  href: "/frequencias/justificativas",
},
```

- [ ] **Step 4: Executar testes, Biome e build**

Run: `node --test tests/*.test.cjs`

Run: `npx.cmd biome check src/app/(dashboard)/frequencias src/components/ui/frequencias src/services/api/modules/frequencia.ts src/services/api/endpoints.ts src/types/frequencia.ts tests/frequencia-service.test.cjs tests/justificativa-presentation.test.cjs`

Run: `npm.cmd run build`

Expected: testes sem falhas, Biome sem diagnósticos nos arquivos da entrega e build com a rota `/frequencias/justificativas`.

- [ ] **Step 5: Revisar o diff e commit**

Run: `git diff --check`

Run: `git status --short`

```bash
git add 'src/app/(dashboard)/frequencias/justificativas/page.tsx' src/components/ui/frequencias/JustificativasWorkspace.tsx src/components/ui/layout/AppSidebar.tsx
git commit -m "feat(frequencia): publicar fila de justificativas"
```
