# Finalização administrativa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalizar autorização no frontend, gestão de usuários, indicadores de frequência por linha e estabilizar a suíte do backend.

**Architecture:** O backend permanece como autoridade e expõe permissões efetivas em `/me`; o frontend centraliza as decisões em helpers e guards sem duplicar a matriz de papéis. A gestão de usuários reutiliza os endpoints e componentes globais existentes, e os indicadores de linha são agregados no banco para evitar N+1.

**Tech Stack:** Laravel/PHPUnit/Pint no backend; Next.js, React, TypeScript, Zustand, Tailwind, Vitest e Biome no frontend.

**Spec:** `docs/superpowers/specs/2026-09-21-finalizacao-administrativa-design.md`

## Global Constraints

- Preservar o formato direto de `GET /me` e somente acrescentar `roles` e `permissions`.
- Não duplicar a matriz de papéis no frontend; toda decisão usa permissões efetivas.
- Reutilizar componentes globais, serviços e padrões visuais existentes.
- Senha vazia em edição e campos opcionais vazios não são enviados.
- Chamadas abertas e faltas justificadas não entram nos indicadores.
- Commits separados por escopo no formato `feat(escopo): descrição` ou `fix(escopo): descrição`.

## Review Focus

- Um administrador recebe a lista completa de permissões, inclusive quando a tabela de relação não as associa diretamente ao papel.
- Uma URL protegida acessada diretamente mostra acesso negado e não monta a árvore que dispara consultas.
- CPF, matrícula, data e senha vazios não produzem payload inválido na edição.
- Chamadas abertas, faltas justificadas e presenças em chamadas abertas não alteram os agregados.
- O usuário autenticado não recebe ações de ativar, inativar ou excluir a si mesmo.

---

### Task 1: Estabilizar ambiente de testes do backend

**Files:**
- Modify: `../transporte-seduc-backend/phpunit.xml`
- Modify: `../transporte-seduc-backend/tests/Feature/Auth/SessionAuthenticationTest.php`
- Inspect: `../transporte-seduc-backend/app/Services/AuthService.php`

**Interfaces:**
- Consumes: cookie CSRF do Sanctum e sessão regenerada no login.
- Produces: suíte sempre em `pt_BR` e teste de logout fiel ao ciclo real de cookies.

- [ ] **Step 1: Reproduzir as quatro falhas isoladamente**

Run: `php artisan test tests/Feature/Api/MensagensEmPortuguesTest.php tests/Feature/Auth/SessionAuthenticationTest.php`
Expected: três mensagens em inglês e logout HTTP 419.

- [ ] **Step 2: Fixar o locale da suíte e renovar o token antes do logout no teste**

Adicionar ao `phpunit.xml`:

```xml
<env name="APP_LOCALE" value="pt_BR" force="true"/>
<env name="APP_FALLBACK_LOCALE" value="pt_BR" force="true"/>
```

No teste de sessão, obter novamente `/sanctum/csrf-cookie` depois do login usando os cookies autenticados e enviar o novo `X-XSRF-TOKEN` no logout.

- [ ] **Step 3: Executar os testes focados**

Run: `php artisan test tests/Feature/Api/MensagensEmPortuguesTest.php tests/Feature/Auth/SessionAuthenticationTest.php`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add phpunit.xml tests/Feature/Auth/SessionAuthenticationTest.php
git commit -m "fix(testes): estabilizar locale e logout por sessao"
```

### Task 2: Expor identidade e permissões efetivas

**Files:**
- Modify: `../transporte-seduc-backend/routes/api.php`
- Modify: `../transporte-seduc-backend/app/Models/User.php`
- Test: `../transporte-seduc-backend/tests/Feature/Auth/MeTest.php`

**Interfaces:**
- Produces: `GET /me -> AuthUser & { roles: string[]; permissions: string[] }`.
- Consumes later: `AuthUser.roles` e `AuthUser.permissions` no frontend.

- [ ] **Step 1: Criar testes que cubram papel comum e administrador**

Os testes devem verificar preservação de `id`, `name`, `email`, retorno dos nomes de papéis, união sem duplicidade das permissões e todas as permissões cadastradas para `admin`.

- [ ] **Step 2: Confirmar o RED**

Run: `php artisan test tests/Feature/Auth/MeTest.php`
Expected: FAIL porque `roles` e `permissions` não existem.

- [ ] **Step 3: Implementar serialização efetiva**

Adicionar ao modelo métodos tipados para nomes de papéis e permissões; para admin consultar todos os nomes em `permissions`, para os demais usar `roles.permissions`, aplicar `unique()->values()->all()`, e mesclar os dois campos na resposta direta de `/me`.

- [ ] **Step 4: Confirmar o GREEN e formatar**

Run: `php artisan test tests/Feature/Auth/MeTest.php && vendor/bin/pint --dirty`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Models/User.php routes/api.php tests/Feature/Auth/MeTest.php
git commit -m "feat(auth): expor papeis e permissoes efetivas"
```

### Task 3: Criar fundação de autorização no frontend

**Files:**
- Modify: `src/types/auth.ts`
- Create: `src/utils/authz.ts`
- Create: `src/hooks/useAuthz.ts`
- Create: `src/components/guard/PermissionBoundary.tsx`
- Modify: `src/components/guard/index.ts`
- Modify: `src/components/ui/layout/AppShell.tsx`
- Modify: `src/services/navigation/sidebar-items.ts`
- Modify: `src/components/ui/layout/AppSidebar.tsx`
- Test: `src/utils/authz.test.ts`

**Interfaces:**
- Produces: `can(permission: string): boolean`, `canAny(permissions: string[]): boolean`, `hasRouteAccess(pathname, permissions): boolean`.
- Produces: `AuthUser.roles: string[]` e `AuthUser.permissions: string[]`.

- [ ] **Step 1: Testar helpers e mapeamento de rotas**

Cobrir permissão individual, alternativa para recadastramento, dashboard/perfil livres e negação de rota protegida sem permissão.

- [ ] **Step 2: Confirmar o RED**

Run: `npm test -- src/utils/authz.test.ts`
Expected: FAIL porque os helpers ainda não existem.

- [ ] **Step 3: Implementar tipos, helpers, hook, guard e filtro do sidebar**

`PermissionBoundary` usa `usePathname` e retorna uma mensagem acessível de acesso negado antes de renderizar `children`. Itens do sidebar recebem `permissions?: string[]` e são filtrados por `canAny`.

- [ ] **Step 4: Confirmar o GREEN e tipagem**

Run: `npm test -- src/utils/authz.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/auth.ts src/utils/authz.ts src/utils/authz.test.ts src/hooks/useAuthz.ts src/components/guard src/components/ui/layout src/services/navigation/sidebar-items.ts
git commit -m "feat(auth): aplicar permissoes na navegacao e rotas"
```

### Task 4: Calcular indicadores dos estudantes por linha

**Files:**
- Modify: `../transporte-seduc-backend/app/Services/LinhaService.php`
- Modify: `../transporte-seduc-backend/app/Http/Resources/LinhaEstudanteResource.php`
- Modify: `../transporte-seduc-backend/tests/Feature/Linha/LinhaEstudantesTest.php`

**Interfaces:**
- Produces: cada estudante com `faltas: int` e `ultima_presenca: ?string`.

- [ ] **Step 1: Testar agregados e limite de queries**

Criar chamada fechada com Falta, fechada com FaltaJustificada, fechada com Presente e chamadas abertas com Falta/Presente. Esperar `faltas = 1`, data da presença fechada e `null` quando nunca houve presença fechada; manter assertiva de quantidade de queries constante.

- [ ] **Step 2: Confirmar o RED**

Run: `php artisan test tests/Feature/Linha/LinhaEstudantesTest.php`
Expected: FAIL nos campos ausentes.

- [ ] **Step 3: Implementar consultas agregadas**

Usar `withCount` filtrando `situacao = Falta` e `chamada.status = Fechada`; usar subconsulta correlacionada ordenada por `chamadas.data desc` para a última situação `Presente` em chamada fechada. Serializar inteiro e data nullable no resource.

- [ ] **Step 4: Confirmar o GREEN e formatar**

Run: `php artisan test tests/Feature/Linha/LinhaEstudantesTest.php && vendor/bin/pint --dirty`
Expected: PASS sem aumento por estudante na contagem de queries.

- [ ] **Step 5: Commit**

```bash
git add app/Services/LinhaService.php app/Http/Resources/LinhaEstudanteResource.php tests/Feature/Linha/LinhaEstudantesTest.php
git commit -m "feat(linhas): adicionar indicadores de frequencia"
```

### Task 5: Exibir indicadores reais no detalhe da linha

**Files:**
- Modify: `src/types/linha.ts`
- Modify: `src/components/ui/linhas/LinhaDetailsModal.tsx`
- Modify: `src/components/ui/linhas/linhaPresentation.ts`
- Test: `src/components/ui/linhas/linhaPresentation.test.ts`

**Interfaces:**
- Consumes: `LinhaEstudante.faltas` e `LinhaEstudante.ultima_presenca`.
- Produces: `formatLastPresence(value: string | null): string`.

- [ ] **Step 1: Testar apresentação sem deslocamento de fuso**

Esperar `formatLastPresence("2026-09-21")` no formato brasileiro e `formatLastPresence(null) === "Sem presença registrada"`.

- [ ] **Step 2: Confirmar o RED**

Run: `npm test -- src/components/ui/linhas/linhaPresentation.test.ts`
Expected: FAIL porque o formatador/campos não existem.

- [ ] **Step 3: Implementar tipo e substituir placeholders**

Renderizar `estudante.faltas ?? 0` e o formatador de data baseado nas partes da string ISO, sem `new Date("YYYY-MM-DD")`.

- [ ] **Step 4: Verificar e commitar**

Run: `npm test -- src/components/ui/linhas/linhaPresentation.test.ts && npm run typecheck`
Expected: PASS.

```bash
git add src/types/linha.ts src/components/ui/linhas
git commit -m "feat(linhas): exibir indicadores de frequencia"
```

### Task 6: Integrar contratos de gestão de usuários

**Files:**
- Modify: `src/services/api/endpoints/userEndpoints.ts`
- Modify: `src/services/api/modules/user.ts`
- Create: `src/types/user.ts`
- Create: `src/components/ui/users/userPresentation.ts`
- Test: `src/services/api/modules/user.test.ts`
- Test: `src/components/ui/users/userPresentation.test.ts`

**Interfaces:**
- Produces: `SystemUser`, `UserFormValues`, `UserPayload`, `validateUserForm(values, mode)` e `buildUserPayload(values, mode)`.
- Produces: `userService.list/create/update/activate/inactivate/remove` com respostas normalizadas.

- [ ] **Step 1: Testar serviço, validação e payload**

Cobrir URLs/métodos, normalização da criação direta, obrigatórios, e-mail, senha mínima na criação, CPF com 11 dígitos, matrícula inteira e omissão de todos os opcionais vazios na edição.

- [ ] **Step 2: Confirmar o RED**

Run: `npm test -- src/services/api/modules/user.test.ts src/components/ui/users/userPresentation.test.ts`
Expected: FAIL nos contratos ausentes.

- [ ] **Step 3: Implementar contratos tipados**

Adicionar opções de papel `admin`, `gestor`, `operador`, `motorista`, `estudante`; retirar caracteres não numéricos do CPF; converter matrícula preenchida para número; omitir `password`, `cpf`, `matricula` e `data_nascimento` vazios.

- [ ] **Step 4: Confirmar o GREEN**

Run: `npm test -- src/services/api/modules/user.test.ts src/components/ui/users/userPresentation.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/api/endpoints/userEndpoints.ts src/services/api/modules/user.ts src/services/api/modules/user.test.ts src/types/user.ts src/components/ui/users/userPresentation.ts src/components/ui/users/userPresentation.test.ts
git commit -m "feat(usuarios): integrar contratos administrativos"
```

### Task 7: Criar interface administrativa de usuários

**Files:**
- Create: `src/app/(dashboard)/usuarios/page.tsx`
- Create: `src/components/ui/users/UsersWorkspace.tsx`
- Create: `src/components/ui/users/UsersTable.tsx`
- Create: `src/components/ui/users/UserFormModal.tsx`
- Create: `src/components/ui/users/UsersSkeleton.tsx`
- Modify: `src/services/navigation/sidebar-items.ts`

**Interfaces:**
- Consumes: serviço e helpers da Task 6, `can("users.write")`, `can("users.delete")` e ID do usuário autenticado.
- Produces: rota fina `/usuarios` e fluxo completo de CRUD/estado.

- [ ] **Step 1: Implementar workspace no padrão de linhas/justificativas**

Carregar lista com skeleton, erro e tentativa novamente; mostrar nome, e-mail, papel e situação; abrir modal global para criar/editar; confirmar exclusão; atualizar lista após mutações; mapear erros de validação por campo.

- [ ] **Step 2: Aplicar autorização e autoproteção**

Exibir criar/editar/ativar/inativar apenas com `users.write`, excluir apenas com `users.delete`, e ocultar ativar/inativar/excluir quando `row.id === authenticatedUser.id`.

- [ ] **Step 3: Verificar o fluxo estático**

Run: `npm run typecheck && npm run check`
Expected: PASS sem imports ou JSX inválidos.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/(dashboard)/usuarios/page.tsx' src/components/ui/users src/services/navigation/sidebar-items.ts
git commit -m "feat(usuarios): criar gestao administrativa"
```

### Task 8: Ocultar ações sem permissão nas features existentes

**Files:**
- Modify: `src/components/ui/estudantes/*`
- Modify: `src/components/ui/linhas/*`
- Modify: `src/components/ui/frequencias/*`
- Modify: `src/components/ui/justificativas/*`
- Modify: `src/components/ui/solicitacoes/*`
- Modify: `src/components/ui/recadastramento/*`

**Interfaces:**
- Consumes: `useAuthz().can(permission)`.
- Produces: UI sem ações proibidas, mantendo o backend como validação final.

- [ ] **Step 1: Mapear cada ação ao contrato da feature**

Aplicar: estudantes criar/editar=`estudantes.write`, excluir=`estudantes.delete`; linhas criar/editar=`linhas.write`, excluir=`linhas.delete`; chamada/reabertura=`frequencias.write`, exclusão=`frequencias.delete`; justificativa=`justificativas.analise`; inscrição=`inscricoes.analise`; período=`periodos.write`; solicitação de recadastro=`solicitacoes.analise`.

- [ ] **Step 2: Implementar ocultamento sem alterar leitura**

Usar condicionais no workspace ou props `canEdit/canDelete/canAnalyze`; preservar detalhes, paginação, filtros e exportações de leitura.

- [ ] **Step 3: Rodar testes e verificações do frontend**

Run: `npm test && npm run typecheck && npm run check && npm run build`
Expected: todas as etapas PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui
git commit -m "feat(auth): restringir acoes por permissao"
```

### Task 9: Verificação integral e fechamento

**Files:**
- Modify somente arquivos exigidos por falhas causadas pelas Tasks 1–8.

**Interfaces:**
- Produces: dois repositórios limpos e verificáveis.

- [ ] **Step 1: Verificar backend completo**

Run: `vendor/bin/pint --test && php artisan test`
Expected: formatação limpa e toda a suíte PASS.

- [ ] **Step 2: Verificar frontend completo**

Run: `npm test && npm run typecheck && npm run check && npm run build`
Expected: toda a suíte, tipagem, Biome e build PASS.

- [ ] **Step 3: Auditar escopo e histórico**

Run em ambos os repositórios: `git status --short` e `git log --oneline -12`.
Expected: worktrees limpas e commits separados por escopo.

- [ ] **Step 4: Corrigir apenas regressões encontradas e commitar por escopo**

Para qualquer falha causada por este plano, escrever/reter teste de regressão, aplicar a menor correção e usar `fix(<escopo>): <descrição>`.
