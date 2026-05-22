Usei a estrutura que você anexou como base: seu projeto tem `src/app`, `src/components`, `src/services`, `src/hooks`, `src/contexts`, `src/types` e `src/utils`, além de componentes globais como `Button`, `Input`, `Textarea`, `Modal`, `Skeleton`, `Pagination`, etc. 

Crie um arquivo na raiz do projeto chamado:

```txt
AGENTS.md
```

E cole isso dentro:

````md
# AGENTS.md

## Objetivo

Este projeto é uma aplicação React/Next.js com TypeScript e Tailwind CSS.  
O Codex deve seguir a arquitetura existente do sistema, respeitando os padrões de organização, componetização, estilização, tipagem, integração com API e reutilização de componentes globais.

Antes de criar, alterar ou remover qualquer arquivo, analise a estrutura atual do projeto e procure exemplos semelhantes já implementados.

---

## Regras principais

- Siga sempre o padrão já existente no projeto.
- Não crie uma nova arquitetura sem necessidade.
- Não duplique lógica, estilos ou componentes que já existem.
- Priorize código limpo, tipado, reutilizável e fácil de manter.
- Use TypeScript corretamente.
- Use Tailwind CSS seguindo o padrão visual atual do sistema.
- Respeite os arquivos e pastas já existentes.
- Não altere arquivos de build, cache ou dependências.
- Nunca edite manualmente `.next`, `node_modules`, arquivos compilados ou arquivos gerados automaticamente.
- Não exponha dados sensíveis, tokens, senhas, `.env` ou informações privadas.

---

## Estrutura base do projeto

A estrutura principal do projeto segue este padrão:

```txt
src/
├── app/
│   ├── (auth)/
│   ├── (sistema)/
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── assets/
├── components/
│   ├── assets/
│   ├── buttons/
│   ├── feedback/
│   ├── form/
│   ├── guard/
│   ├── loading/
│   ├── modal/
│   ├── pagination/
│   └── ui/
├── contexts/
├── hooks/
├── services/
├── types/
└── utils/
````

Ao criar novas features, respeite essa separação.

---

## App Router do Next.js

O projeto usa a estrutura `src/app`.

Use as rotas dentro de `src/app` apenas para organizar páginas, layouts, loadings, erros e rotas do Next.js.

Exemplo:

```txt
src/app/(sistema)/(gestao)/alguma-feature/page.tsx
```

A página não deve concentrar toda a lógica visual e de negócio.

Prefira deixar `page.tsx` como uma camada fina, responsável por chamar um componente principal da feature.

Exemplo:

```tsx
import { MinhaFeatureWorkspace } from "@/components/ui/gestao/minha-feature/MinhaFeatureWorkspace";

export default function MinhaFeaturePage() {
  return <MinhaFeatureWorkspace />;
}
```

---

## Componentização

Sempre priorize componetização quando ela trouxer organização, reaproveitamento ou redução de complexidade.

Crie componentes quando:

* Um bloco visual for reutilizado em mais de um lugar.
* Um trecho da tela estiver grande demais dentro de uma página.
* Um conjunto de elementos representar uma unidade clara da interface.
* O componente tiver responsabilidade própria.
* A separação melhorar a leitura e manutenção do código.
* A feature tiver seções diferentes, como filtros, cards, tabelas, formulários ou modais.

Não crie componentes desnecessários.

Evite criar componente apenas para renderizar algo simples como:

```tsx
<h1>
  Título <span>destaque</span>
</h1>
```

Nesse caso, mantenha direto no componente pai.

A regra é: componetizar com inteligência, não por excesso.

---

## Componentes globais

Antes de criar qualquer componente novo, verifique se já existe um componente global que atende à necessidade.

Priorize os componentes existentes em:

```txt
src/components/buttons/
src/components/form/
src/components/form/inputs/
src/components/feedback/
src/components/modal/
src/components/loading/
src/components/pagination/
src/components/guard/
src/components/ui/
```

Exemplos de componentes globais que devem ser priorizados:

```txt
Button
ButtonIcon
Input
InputPassword
InputSearch
InputDate
InputCPF
InputCEP
InputTelefone
InputMoedaBRL
InputValidation
Select
SelectField
Textarea
Label
Form
Alert
Toast
Modal
Skeleton
TextSkeleton
CircleSkeleton
LoadSpinner
Pagination
GuardPage
GuardComponent
```

Se o componente global já existir, use ele.

Não recrie um `Button`, `Input`, `Textarea`, `Select`, `Modal`, `Skeleton`, `Pagination` ou qualquer outro componente que já exista no sistema.

---

## Criação de novos componentes globais

Se for necessário usar um componente global que ainda não existe, crie seguindo o padrão dos componentes globais existentes.

Exemplo:

Se precisar de um `Textarea` e ele não existir, crie em:

```txt
src/components/form/inputs/Textarea.tsx
```

E atualize o arquivo de exportação:

```txt
src/components/form/inputs/index.ts
```

O novo componente deve seguir o mesmo padrão visual, técnico e de API dos outros inputs já existentes.

Antes de criar, abra componentes parecidos, como:

```txt
Input.tsx
InputPassword.tsx
InputSearch.tsx
Select.tsx
SelectField.tsx
```

E replique o padrão de:

* Props.
* Tipagem.
* Classes Tailwind.
* Tratamento de erro.
* Label.
* Estado disabled.
* Estado required.
* Integração com formulário, se aplicável.
* Exportação via `index.ts`.

---

## Componentes específicos de feature

Componentes específicos de uma área do sistema devem ficar dentro de `src/components/ui`.

Exemplos:

```txt
src/components/ui/dashboard/
src/components/ui/gestao/atividades/
src/components/ui/gestao/entrevistas/
src/components/ui/gestao/vincular-funcionarios/
src/components/ui/layout/
```

Ao criar uma nova feature da Gestão, prefira:

```txt
src/components/ui/gestao/nome-da-feature/
```

Exemplo:

```txt
src/components/ui/gestao/alunos/
├── AlunosWorkspace.tsx
├── AlunosFilterCard.tsx
├── AlunosTable.tsx
├── AlunosForm.tsx
└── AlunosRouteSkeletons.tsx
```

Use nomes claros e consistentes com o restante do projeto.

---

## Quando usar componente local na rota

Componentes podem ficar dentro da própria pasta da rota somente quando forem extremamente específicos daquela rota e não fizer sentido reutilizá-los em outro lugar.

Exemplo aceitável:

```txt
src/app/(auth)/login/footer.tsx
src/app/(auth)/login/form.tsx
src/app/(auth)/login/login.tsx
```

Mesmo assim, se o componente começar a crescer ou puder ser reaproveitado, mova para `src/components`.

---

## Padrão de nomes

Use PascalCase para componentes:

```txt
MinhaFeatureWorkspace.tsx
DashboardMetricCard.tsx
VincularSectionCard.tsx
```

Use camelCase para funções e variáveis:

```ts
const selectedSchool = null;

function handleSubmitForm() {}
```

Use kebab-case para nomes de pastas de rota:

```txt
gerenciar-atividades
buscar-entrevistas
vincular-funcionarios
```

Use nomes descritivos. Evite nomes genéricos como:

```txt
Card.tsx
Table.tsx
Form.tsx
PageContent.tsx
Component.tsx
```

Prefira:

```txt
AtividadesSectionCard.tsx
GerenciarAtividadesWorkspace.tsx
EntrevistaFormPage.tsx
VincularFuncionariosWorkspace.tsx
```

---

## Padrão para páginas

As páginas devem ser simples.

Evite colocar muitos JSX, estados e lógicas diretamente em `page.tsx`.

Prefira:

```tsx
import { GerenciarAlunosWorkspace } from "@/components/ui/gestao/alunos/GerenciarAlunosWorkspace";

export default function GerenciarAlunosPage() {
  return <GerenciarAlunosWorkspace />;
}
```

A lógica visual da tela deve ficar no componente `Workspace`, `FormPage`, `Section`, `Card`, `Table` ou equivalente.

---

## Padrão para formulários

Ao criar formulários:

* Use os componentes globais de formulário.
* Reaproveite `Input`, `Select`, `Textarea`, `Label`, `Button` e componentes já existentes.
* Mantenha validações tipadas.
* Evite duplicar estilos de campos manualmente.
* Siga o padrão visual dos inputs globais.
* Separe formulários grandes em componentes menores quando fizer sentido.
* Não crie um componente para cada campo isolado sem necessidade.

Exemplo de separação aceitável:

```txt
AlunoForm.tsx
AlunoDadosPessoaisSection.tsx
AlunoEnderecoSection.tsx
AlunoResponsaveisSection.tsx
```

Mas não crie componentes minúsculos sem ganho real.

---

## Padrão para serviços e API

A camada de API deve seguir a estrutura existente em:

```txt
src/services/api/
src/services/api/endpoints/
src/services/api/errors/
src/services/api/modules/
```

Ao criar nova integração:

1. Verifique se já existe endpoint em `endpoints.ts` ou na pasta `endpoints`.
2. Crie ou atualize o arquivo de endpoint do módulo.
3. Crie ou atualize o módulo em `src/services/api/modules`.
4. Mantenha as chamadas de API fora dos componentes visuais sempre que possível.
5. Trate erros usando o padrão já existente em `src/services/api/errors`.
6. Use os interceptors e cliente API já configurados.

Não espalhe URLs soltas dentro de componentes React.

Evite isto:

```tsx
await axios.get("/api/alunos");
```

Prefira usar o módulo de serviço existente ou criar um novo seguindo o padrão do projeto.

---

## Hooks

Hooks globais devem ficar em:

```txt
src/hooks/
```

Crie hooks apenas quando houver reaproveitamento real ou quando a lógica de estado/efeito estiver deixando o componente complexo.

Exemplos de hooks existentes:

```txt
useApi
useAuth
useAuthz
useFocus
useMinimumVisibleLoading
useNavigation
usePersistedState
useRedirectTo
```

Não crie hook para lógica trivial que só é usada uma vez e que não prejudica a leitura do componente.

---

## Contextos

Contextos devem ficar em:

```txt
src/contexts/
```

Use contexto apenas para estado global real, como autenticação, autorização, tema ou dados compartilhados por várias partes do sistema.

Não use contexto para estado local simples de uma tela.

---

## Tipagens

Tipos globais devem ficar em:

```txt
src/types/
```

Tipos específicos de módulos devem ficar em subpastas correspondentes.

Exemplo:

```txt
src/types/gestao/
src/types/permissions/
src/types/user/
```

Evite usar `any`.

Use tipos explícitos e reaproveite tipos existentes antes de criar novos.

Quando criar novos tipos, exporte pelo `index.ts` correspondente, se esse for o padrão da pasta.

---

## Utils

Funções utilitárias genéricas devem ficar em:

```txt
src/utils/
```

Crie utils apenas para funções realmente genéricas e reutilizáveis.

Não coloque regra de negócio específica de uma tela dentro de `utils`.

---

## Estilização

O projeto usa Tailwind CSS.

Siga o padrão visual existente:

* Use as classes já utilizadas no sistema.
* Respeite cores, espaçamentos, bordas, sombras e estados visuais.
* Não introduza uma nova identidade visual sem solicitação.
* Não misture padrões visuais diferentes.
* Priorize consistência.

Se existir uma classe, padrão ou helper visual já usado em componentes semelhantes, reutilize.

Para ícones, prefira seguir o padrão já utilizado no sistema, especialmente `lucide-react` quando aplicável.

---

## Acessibilidade

Sempre que criar componentes interativos:

* Use elementos semânticos.
* Use `button` para ações.
* Use `a` ou `Link` para navegação.
* Adicione `aria-label` quando necessário.
* Preserve foco visível.
* Não remova acessibilidade dos componentes globais.
* Garanta que inputs tenham label ou identificação acessível.

---

## Client Components e Server Components

Não adicione `"use client"` sem necessidade.

Use `"use client"` apenas quando o componente precisar de:

* Estado com `useState`.
* Efeitos com `useEffect`.
* Eventos de clique, input, submit etc.
* Hooks de navegação/client-side.
* Contextos client-side.
* Bibliotecas que dependem do browser.

Mantenha componentes como Server Components sempre que possível.

Ao passar dados de Server Component para Client Component, passe apenas objetos serializáveis.

Não passe funções, classes ou objetos complexos não serializáveis entre server e client.

---

## Loading, erro e skeleton

Ao criar telas novas, considere os padrões existentes:

```txt
loading.tsx
error.tsx
not-found.tsx
Skeleton
TextSkeleton
CircleSkeleton
LoadSpinner
```

Se a tela tiver carregamento relevante, crie skeleton seguindo o padrão existente da feature.

Para features da Gestão, siga o padrão dos arquivos:

```txt
AtividadeRouteSkeletons.tsx
```

ou equivalente.

---

## Modais

Para modais, use a estrutura global de modal existente em:

```txt
src/components/modal/
```

Evite criar modal do zero.

Use os subcomponentes existentes, como:

```txt
ModalRoot
ModalContent
ModalHeader
ModalMain
ModalFooter
ModalClose
ModalIconClose
ModalOverlay
ModalPortal
ModalMaximize
```

Se for necessário criar uma variação, siga a composição atual.

---

## Dashboard e UI da Gestão

Para componentes de dashboard, siga os padrões existentes em:

```txt
src/components/ui/dashboard/
```

Para funcionalidades da Gestão, siga:

```txt
src/components/ui/gestao/
```

Ao criar novas telas da Gestão:

* Use cards consistentes.
* Reaproveite filtros existentes quando possível.
* Use componentes de métrica, se aplicável.
* Mantenha o mesmo padrão de espaçamento.
* Organize ações rápidas como links ou botões conforme o padrão existente.
* Preserve a identidade visual do sistema.

---

## Navegação e permissões

Rotas e navegação devem respeitar a estrutura existente em:

```txt
src/services/navigation/
src/services/navigation/routes/
src/types/permissions/
```

Ao criar nova rota:

1. Verifique se já existe arquivo de rotas para o módulo.
2. Adicione a rota no local correto.
3. Configure permissões quando necessário.
4. Atualize os itens de sidebar se a tela precisar aparecer no menu.
5. Respeite o padrão de `sidebar-items.ts` do módulo.

Não adicione links soltos no layout sem verificar o sistema de navegação existente.

---

## Guards e autorização

Use os componentes e hooks existentes para autenticação e autorização:

```txt
GuardPage
GuardComponent
PublicPage
useAuth
useAuthz
AuthContext
AuthzContext
```

Não implemente uma nova lógica de autenticação ou permissão sem necessidade.

---

## Imports

Use aliases do projeto quando disponíveis.

Prefira:

```tsx
import { Button } from "@/components/buttons";
```

Evite caminhos relativos longos:

```tsx
import { Button } from "../../../../components/buttons";
```

Mantenha imports organizados e remova imports não utilizados.

---

## Organização dos arquivos

Ao criar uma nova feature, siga um padrão previsível.

Exemplo para uma feature de alunos:

```txt
src/app/(sistema)/(gestao)/alunos/page.tsx

src/components/ui/gestao/alunos/
├── AlunosWorkspace.tsx
├── AlunosFilterCard.tsx
├── AlunosTable.tsx
├── AlunosForm.tsx
├── AlunosRouteSkeletons.tsx
└── alunoPresentation.ts

src/types/gestao/aluno.ts

src/services/api/endpoints/alunoEndpoints.ts
src/services/api/modules/aluno.ts
```

Crie apenas os arquivos necessários para a tarefa solicitada.

Não crie estrutura vazia ou arquivos sem uso.

---

## Refatoração

Ao refatorar:

* Preserve o comportamento existente.
* Não altere regras de negócio sem solicitação.
* Não mude layout além do que foi pedido.
* Remova duplicações quando encontrar.
* Extraia componentes apenas quando melhorar a manutenção.
* Mantenha os nomes coerentes com o padrão atual.
* Evite grandes reescritas desnecessárias.

---

## Qualidade de código

Antes de finalizar uma tarefa:

* Verifique se não há imports quebrados.
* Verifique se não há componentes duplicados.
* Verifique se os componentes globais foram reaproveitados.
* Verifique se os arquivos foram criados nas pastas corretas.
* Verifique se os nomes seguem o padrão do projeto.
* Verifique se a tela continua consistente visualmente.
* Verifique se a tipagem está correta.
* Verifique se não foi usado `any` sem necessidade.
* Verifique se não foram alterados arquivos gerados.

---

## Biome e formatação

O projeto possui configuração do Biome.

Siga a formatação do projeto.

Não troque a ferramenta de lint/format sem solicitação.

Não introduza Prettier, ESLint ou outra ferramenta se o projeto já está usando Biome, a menos que seja explicitamente solicitado.

---

## Regras para alterações

Ao receber uma tarefa:

1. Entenda o objetivo.
2. Procure arquivos semelhantes.
3. Reaproveite componentes globais.
4. Crie novos componentes apenas quando necessário.
5. Siga a arquitetura existente.
6. Faça a menor alteração segura e completa.
7. Garanta consistência visual e técnica.
8. Não mexa em arquivos fora do escopo.
9. Explique resumidamente o que foi alterado.

---

## O que evitar

Evite:

* Criar componente para tudo sem critério.
* Criar componente para um simples `h1`, `span` ou bloco mínimo sem reaproveitamento.
* Duplicar `Button`, `Input`, `Textarea`, `Select`, `Modal` ou `Skeleton`.
* Colocar toda a tela dentro de `page.tsx`.
* Espalhar chamadas de API dentro de componentes visuais.
* Usar `any` sem necessidade.
* Criar pastas vazias.
* Criar arquivos que não serão usados.
* Alterar identidade visual sem pedido.
* Mexer em `.next`, `node_modules`, arquivos compilados ou gerados.
* Criar nova arquitetura paralela.
* Ignorar os padrões já existentes.

---

## Regra final

Sempre siga primeiro o padrão do sistema.

Se já existe um jeito de fazer no projeto, replique esse jeito.

Se não existe, crie uma solução nova mantendo a mesma organização, estilo, tipagem e qualidade dos arquivos existentes.

````
