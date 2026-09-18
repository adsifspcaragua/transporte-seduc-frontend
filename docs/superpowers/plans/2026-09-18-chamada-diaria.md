# Chamada Diária Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disponibilizar no frontend o fluxo completo de abrir, preencher, salvar, fechar, visualizar e reabrir a chamada diária de uma linha.

**Architecture:** Uma página fina renderiza um workspace client-side. O workspace carrega as linhas autorizadas e abre a folha; um componente de folha mantém o rascunho e delega regras puras para um módulo testável. Todos os contratos HTTP ficam tipados em um serviço dedicado.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Axios, Tailwind CSS 4, Biome e `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-18-chamada-diaria-design.md`

## Global Constraints

- Reutilizar os componentes globais existentes; não criar novos controles globais.
- Não expor a exclusão destrutiva de chamadas nesta entrega.
- Não implementar fila de justificativas, relatórios ou atribuição de motoristas nesta entrega.
- Manter o backend como autoridade final para autorização e regras de negócio.
- Preservar todas as alterações locais preexistentes no worktree.
- Desenvolver regras novas com TDD e verificar testes, Biome e build antes de concluir.

---

### Task 1: Contratos e serviço de frequência

**Files:**
- Create: `tests/frequencia-service.test.cjs`
- Create: `src/types/frequencia.ts`
- Modify: `src/types/index.ts`
- Modify: `src/services/api/endpoints.ts`
- Create: `src/services/api/modules/frequencia.ts`

**Interfaces:**
- Produces: `FrequenciaLinha`, `Chamada`, `FrequenciaRegistro`, `AbrirChamadaPayload`, `RegistrarFrequenciasPayload`, `DataResponse`, `UpdateChamadaResponse` e `frequenciaService`.
- `frequenciaService.listLinhas(): Promise<FrequenciaLinha[]>`
- `frequenciaService.open(payload): Promise<DataResponse<Chamada>>`
- `frequenciaService.show(id): Promise<DataResponse<Chamada>>`
- `frequenciaService.update(id, payload): Promise<UpdateChamadaResponse>`
- `frequenciaService.close(id): Promise<DataResponse<Chamada>>`
- `frequenciaService.reopen(id): Promise<DataResponse<Chamada>>`

- [ ] **Step 1: Escrever testes que descrevem as URLs, métodos e payloads**

Criar um loader TypeScript igual ao de `tests/pending-request.test.cjs`, substituindo `@/services/api/client` por um cliente espião. Cobrir ao menos:

```js
test("lista as linhas disponíveis para chamada", async () => {
  const { service, calls } = setup({ data: { data: [{ id: 3 }] } });
  assert.deepEqual(await service.listLinhas(), [{ id: 3 }]);
  assert.deepEqual(calls[0], { method: "get", url: "/frequencias/linhas" });
});

test("abre e salva uma chamada com o contrato do backend", async () => {
  const { service, calls } = setup({ data: { data: { id: 9 } } });
  await service.open({ linha_id: 3, data: "2026-09-18" });
  await service.update(9, {
    frequencias: [{ estudante_id: 7, situacao: "Presente" }],
  });
  assert.deepEqual(calls, [
    {
      method: "post",
      url: "/frequencias/chamadas",
      body: { linha_id: 3, data: "2026-09-18" },
    },
    {
      method: "put",
      url: "/frequencias/chamadas/9",
      body: { frequencias: [{ estudante_id: 7, situacao: "Presente" }] },
    },
  ]);
});

test("fecha e reabre a chamada pelos endpoints de ação", async () => {
  const { service, calls } = setup({ data: { data: { id: 9 } } });
  await service.close(9);
  await service.reopen(9);
  assert.deepEqual(calls.map(({ method, url }) => ({ method, url })), [
    { method: "patch", url: "/frequencias/chamadas/9/fechar" },
    { method: "patch", url: "/frequencias/chamadas/9/reabrir" },
  ]);
});

test("carrega uma folha existente pelo id", async () => {
  const { service, calls } = setup({ data: { data: { id: 9 } } });
  await service.show(9);
  assert.deepEqual(calls[0], {
    method: "get",
    url: "/frequencias/chamadas/9",
  });
});
```

- [ ] **Step 2: Executar os testes e confirmar a falha RED**

Run: `node --test tests/frequencia-service.test.cjs`

Expected: FAIL porque `@/services/api/modules/frequencia` e os endpoints ainda não existem.

- [ ] **Step 3: Criar os tipos e o serviço mínimo**

Definir os contratos sem `any`:

```ts
export type FrequenciaSituacao =
  | "Pendente"
  | "Presente"
  | "Falta"
  | "Justificada";
export type ChamadaStatus = "Aberta" | "Fechada";

export type FrequenciaRegistro = {
  id: number;
  estudante: { id: number; name: string; cpf: string | null } | null;
  estudante_id: number;
  situacao: FrequenciaSituacao;
  observacao: string | null;
  marcada_em: string | null;
  justificativa: {
    id: number;
    status: "Em analise" | "Aprovada" | "Rejeitada";
    parecer: string | null;
  } | null;
};

export type Chamada = {
  id: number;
  data: string;
  status: ChamadaStatus;
  observacoes: string | null;
  fechada_em: string | null;
  linha: { id: number; name: string; motorista?: { id: number; name: string } | null };
  registrada_por?: { id: number; name: string } | null;
  contadores: {
    total: number;
    presentes: number;
    faltas: number;
    justificadas: number;
    pendentes: number;
  };
  frequencias: FrequenciaRegistro[];
};

export type DataResponse<T> = { data: T; message?: string };
export type UpdateChamadaResponse = DataResponse<Chamada> & {
  ignorados?: number[];
  bloqueados?: number[];
};
```

Adicionar em `API_ENDPOINTS`:

```ts
FREQUENCIAS: {
  LINHAS: "/frequencias/linhas",
  CHAMADAS: "/frequencias/chamadas",
  CHAMADA_BY_ID: (id: number | string) => `/frequencias/chamadas/${id}`,
  FECHAR: (id: number | string) => `/frequencias/chamadas/${id}/fechar`,
  REABRIR: (id: number | string) => `/frequencias/chamadas/${id}/reabrir`,
},
```

Implementar `frequenciaService` com `api.get/post/put/patch`, retornando o envelope completo nas mutações e apenas `data` em `listLinhas`.

- [ ] **Step 4: Executar os testes e confirmar GREEN**

Run: `node --test tests/frequencia-service.test.cjs`

Expected: todos os testes PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/frequencia-service.test.cjs src/types/frequencia.ts src/types/index.ts src/services/api/endpoints.ts src/services/api/modules/frequencia.ts
git commit -m "feat(frequencia): adicionar contratos e servico de chamada"
```

---

### Task 2: Regras puras do rascunho da chamada

**Files:**
- Create: `tests/frequencia-presentation.test.cjs`
- Create: `src/components/ui/frequencias/frequenciaPresentation.ts`

**Interfaces:**
- Consumes: `Chamada`, `FrequenciaRegistro`, `FrequenciaSituacao`, `RegistrarFrequenciaItem`.
- Produces: `ChamadaDraft`, `createChamadaDraft`, `getChangedEntries`, `validateDraft`, `isRegistroLocked`, `hasPendingEntries`, `getLinhaCallAction`, `localDateIso`, `formatCallDate`.

- [ ] **Step 1: Escrever testes das regras do rascunho**

```js
test("cria o rascunho preservando marcação e observação", () => {
  const draft = createChamadaDraft(chamada([
    registro(1, "Presente"),
    registro(2, "Justificada", "Atestado"),
  ]));
  assert.deepEqual(plain(draft), {
    1: { situacao: "Presente", observacao: "" },
    2: { situacao: "Justificada", observacao: "Atestado" },
  });
});

test("envia apenas marcações alteradas", () => {
  const source = chamada([registro(1, "Pendente"), registro(2, "Falta")]);
  const draft = createChamadaDraft(source);
  draft[1] = { situacao: "Presente", observacao: "" };
  assert.deepEqual(plain(getChangedEntries(source, draft)), [
    { estudante_id: 1, situacao: "Presente" },
  ]);
});

test("exige motivo apenas para falta justificada", () => {
  assert.deepEqual(validateDraft({ 4: { situacao: "Justificada", observacao: " " } }), {
    4: "Informe o motivo da falta justificada.",
  });
});

test("bloqueia justificativa que já recebeu decisão", () => {
  assert.equal(isRegistroLocked(registro(1, "Justificada", "x", "Aprovada")), true);
  assert.equal(isRegistroLocked(registro(2, "Justificada", "x", "Em analise")), false);
});

test("define ação do card de hoje", () => {
  assert.equal(getLinhaCallAction(null, true), "Iniciar");
  assert.equal(getLinhaCallAction({ id: 1, status: "Aberta" }, true), "Continuar");
  assert.equal(getLinhaCallAction({ id: 1, status: "Fechada" }, true), "Visualizar");
  assert.equal(getLinhaCallAction(null, false), "Abrir chamada");
});

test("formata datas sem deslocamento de fuso", () => {
  assert.equal(localDateIso(new Date(2026, 8, 8)), "2026-09-08");
  assert.equal(formatCallDate("2026-09-08"), "08/09/2026");
});
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `node --test tests/frequencia-presentation.test.cjs`

Expected: FAIL porque o módulo ainda não existe.

- [ ] **Step 3: Implementar o mínimo para passar**

Usar um `Record<number, ChamadaDraftEntry>` para o rascunho. `getChangedEntries` deve omitir `observacao` quando vazia e comparar situação mais observação normalizada. `validateDraft` deve retornar `Partial<Record<number, string>>`. `isRegistroLocked` só retorna `true` para status `Aprovada` ou `Rejeitada`. `localDateIso` recebe uma data opcional para continuar determinístico em teste.

```ts
export type ChamadaDraftEntry = {
  situacao: FrequenciaSituacao;
  observacao: string;
};
export type ChamadaDraft = Record<number, ChamadaDraftEntry>;

export function getLinhaCallAction(
  chamadaHoje: FrequenciaLinha["chamada_hoje"],
  isToday: boolean,
) {
  if (!isToday) return "Abrir chamada";
  if (!chamadaHoje) return "Iniciar";
  return chamadaHoje.status === "Aberta" ? "Continuar" : "Visualizar";
}
```

- [ ] **Step 4: Executar e confirmar GREEN**

Run: `node --test tests/frequencia-presentation.test.cjs`

Expected: todos os testes PASS.

- [ ] **Step 5: Refatorar sem mudar o comportamento**

Remover duplicação de normalização de observação e ordenar o payload pela ordem original da folha, não pelas chaves do objeto.

- [ ] **Step 6: Executar os dois testes da feature**

Run: `node --test tests/frequencia-service.test.cjs tests/frequencia-presentation.test.cjs`

Expected: todos os testes PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/frequencia-presentation.test.cjs src/components/ui/frequencias/frequenciaPresentation.ts
git commit -m "feat(frequencia): modelar rascunho da chamada"
```

---

### Task 3: Entrada da chamada por linha e data

**Files:**
- Create: `src/components/ui/frequencias/FrequenciaLinhaCard.tsx`
- Create: `src/components/ui/frequencias/FrequenciaRouteSkeletons.tsx`
- Create: `src/components/ui/frequencias/FrequenciasWorkspace.tsx`

**Interfaces:**
- Consumes: `frequenciaService.listLinhas`, `frequenciaService.open`, `frequenciaService.show`, `FrequenciaLinha`, helpers da Task 2.
- Produces: `FrequenciasWorkspace` e callback `onOpenChamada(chamada: Chamada)` para a folha.

- [ ] **Step 1: Implementar cards e skeletons**

`FrequenciaLinhaCard` deve receber:

```ts
type FrequenciaLinhaCardProps = {
  actionLoading: boolean;
  date: string;
  linha: FrequenciaLinha;
  onOpen: (linha: FrequenciaLinha) => void;
};
```

O card exibe nome, horários, motorista, badge de estado e um `Button`. Para hoje, usa `chamada_hoje`; para outra data, informa que a API abrirá ou retomará a folha. `FrequenciaRouteSkeletons` replica a grade com `Skeleton` e `TextSkeleton`.

- [ ] **Step 2: Implementar o workspace de entrada**

O workspace deve:

```ts
const [date, setDate] = useState(localDateIso());
const [linhas, setLinhas] = useState<FrequenciaLinha[]>([]);
const [chamada, setChamada] = useState<Chamada | null>(null);
const [loading, setLoading] = useState(true);
const [openingLineId, setOpeningLineId] = useState<number | null>(null);
```

Se a data for hoje e existir `chamada_hoje`, chamar `show(id)`; nos demais casos chamar `open({ linha_id, data })`. Usar `DateInput max={localDateIso()}`, mostrar erros Axios em português e preservar a seleção de data após falha.

- [ ] **Step 3: Verificar tipos e formatação dos novos componentes**

Run: `npx biome check src/components/ui/frequencias src/services/api/modules/frequencia.ts src/types/frequencia.ts`

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add tests/frequencia-service.test.cjs src/components/ui/frequencias/FrequenciaLinhaCard.tsx src/components/ui/frequencias/FrequenciaRouteSkeletons.tsx src/components/ui/frequencias/FrequenciasWorkspace.tsx
git commit -m "feat(frequencia): adicionar entrada da chamada diaria"
```

---

### Task 4: Folha editável, salvamento e fechamento

**Files:**
- Modify: `tests/frequencia-presentation.test.cjs`
- Create: `src/components/ui/frequencias/ChamadaSheet.tsx`
- Modify: `src/components/ui/frequencias/FrequenciasWorkspace.tsx`

**Interfaces:**
- Consumes: `Chamada`, `frequenciaService.update/close/reopen`, helpers da Task 2.
- Produces: `ChamadaSheet({ chamada, onBack, onChamadaChange })`.

- [ ] **Step 1: Adicionar testes de pendências, mudanças e bloqueios**

```js
test("não inclui registro bloqueado no payload mesmo se o rascunho mudar", () => {
  const source = chamada([registro(1, "Justificada", "Atestado", "Aprovada")]);
  const draft = { 1: { situacao: "Falta", observacao: "" } };
  assert.deepEqual(plain(getChangedEntries(source, draft)), []);
});

test("identifica folha com pendências", () => {
  assert.equal(hasPendingEntries({ 1: { situacao: "Pendente", observacao: "" } }), true);
  assert.equal(hasPendingEntries({ 1: { situacao: "Presente", observacao: "" } }), false);
});
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `node --test tests/frequencia-presentation.test.cjs`

Expected: FAIL em `hasPendingEntries` ausente ou no filtro de bloqueados.

- [ ] **Step 3: Implementar as regras mínimas e confirmar GREEN**

Run: `node --test tests/frequencia-presentation.test.cjs`

Expected: PASS.

- [ ] **Step 4: Implementar `ChamadaSheet`**

O componente deve criar o rascunho quando `chamada.id` mudar, renderizar um cartão por estudante e agrupar os três botões de situação com `aria-pressed`. Ao escolher `Justificada`, exibir `Textarea` com label `Motivo da falta de {nome}`. Registros analisados devem mostrar o resultado e permanecer desabilitados.

As ações seguem este fluxo:

```ts
async function handleSave() {
  const errors = validateDraft(draft);
  if (Object.keys(errors).length > 0) return setFieldErrors(errors);
  const frequencias = getChangedEntries(chamada, draft);
  if (frequencias.length === 0) return;
  const response = await frequenciaService.update(chamada.id, { frequencias });
  onChamadaChange(response.data);
}

async function handleClose() {
  await handleSave();
  const response = await frequenciaService.close(chamada.id);
  onChamadaChange(response.data);
}
```

Para evitar fechar após falha no salvamento, `handleSave` deve retornar `true` somente quando não houver erro; `handleClose` prossegue apenas nesse caso. A ação de fechar fica desabilitada se `hasPendingEntries(draft)` ou se houver justificativa inválida. Folha fechada é somente leitura e oferece `reopen`.

- [ ] **Step 5: Integrar a folha no workspace**

Quando `chamada` existir, renderizar:

```tsx
<ChamadaSheet
  chamada={chamada}
  onBack={() => setChamada(null)}
  onChamadaChange={setChamada}
/>
```

Ao voltar, recarregar as linhas para atualizar `chamada_hoje`.

- [ ] **Step 6: Rodar os testes e o Biome da feature**

Run: `node --test tests/frequencia-service.test.cjs tests/frequencia-presentation.test.cjs`

Run: `npx biome check src/components/ui/frequencias src/services/api/modules/frequencia.ts src/types/frequencia.ts`

Expected: ambos exit 0.

- [ ] **Step 7: Commit**

```bash
git add tests/frequencia-presentation.test.cjs src/components/ui/frequencias/ChamadaSheet.tsx src/components/ui/frequencias/FrequenciasWorkspace.tsx src/components/ui/frequencias/frequenciaPresentation.ts
git commit -m "feat(frequencia): implementar preenchimento e fechamento da chamada"
```

---

### Task 5: Rota, navegação e verificação final

**Files:**
- Create: `src/app/(dashboard)/frequencias/page.tsx`
- Modify: `src/components/ui/layout/AppSidebar.tsx`

**Interfaces:**
- Consumes: `FrequenciasWorkspace`.
- Produces: rota `/frequencias` e item “Frequência” na navegação.

- [ ] **Step 1: Criar a página fina**

```tsx
import { FrequenciasWorkspace } from "@/components/ui/frequencias/FrequenciasWorkspace";

export default function FrequenciasPage() {
  return <FrequenciasWorkspace />;
}
```

- [ ] **Step 2: Adicionar a navegação**

Importar `ClipboardCheck` de `lucide-react` e acrescentar após “Linhas”:

```ts
{ label: "Frequência", icon: ClipboardCheck, href: "/frequencias" },
```

Modificar apenas o bloco de importação e o array `sidebarItems`, preservando alterações locais existentes.

- [ ] **Step 3: Executar todos os testes automatizados**

Run: `node --test tests/*.test.cjs`

Expected: todos os testes PASS sem warnings inesperados.

- [ ] **Step 4: Executar o lint completo**

Run: `npm run lint`

Expected: exit 0. Se o Biome reportar problemas preexistentes fora dos arquivos alterados, registrar separadamente e garantir que `npx biome check` nos arquivos da feature passe.

- [ ] **Step 5: Executar o build de produção**

Run: `npm run build`

Expected: exit 0 e rota `/frequencias` compilada.

- [ ] **Step 6: Revisar o diff e confirmar preservação do worktree**

Run: `git status --short`

Run: `git diff --check`

Run: `git diff -- src/components/ui/layout/AppSidebar.tsx src/services/api/endpoints.ts src/types/index.ts`

Expected: nenhuma alteração não intencional, nenhum whitespace error e mudanças compartilhadas restritas às inserções da feature.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(dashboard)/frequencias/page.tsx' src/components/ui/layout/AppSidebar.tsx
git commit -m "feat(frequencia): publicar rota de chamada diaria"
```
