# UNIBUS — Auditoria independente do frontend e backend

**Data da análise:** 06/11/2026  
**Insumos:** `transporte-seduc-frontend-main.zip`, `transporte-seduc-backend-main.zip`  
**Método:** leitura estática de código e documentação existente. **Não houve execução de testes, migrations, seeders, consultas a banco, nem validação visual de páginas nesta análise.** Os resultados de testes relatados nos repositórios são identificados como *relatos documentados*, não como ensaios reproduzidos por esta auditoria.

## 1. Parecer executivo

O sistema já possui uma base funcional expressiva para inscrições, gestão de estudantes e linhas, recadastramento, frequência, programação de viagens, dispositivos autorizados e presença por QR Code. O problema mais importante para a operação não é a simples falta de endpoints: é a complexidade de conectar essas capacidades em um fluxo que um servidor da SEDUC consiga executar sem conhecer entidades técnicas e relações internas.

**Recomendação central:** preservar a arquitetura e as regras de negócio, melhorar primeiro as tarefas mais frequentes e as operações de maior consequência; separar claramente *comprovação de embarque por QR* de *chamada diária com efeitos sobre o benefício*. Não fundir os dois mecanismos sem decisão formal da gestão.

## 2. Arquitetura verificada

| Camada | Elementos identificados |
| --- | --- |
| Frontend | Next.js 16.1.6, React 19.2.3, TypeScript, Tailwind 4, Axios, Zustand, Lucide. Fontes em `src/app`, `src/components`, `src/services/api`, `src/types`. |
| Backend | PHP ^8.4, Laravel ^13, Sanctum, Services, Requests, Resources, migrations, seeders; banco configurável, produção/documentação orientadas a MySQL. |
| Autorização | RBAC com permissões operacionais. Perfis semeados: admin, gestor, operador, motorista, estudante. As atribuições reais do banco podem variar. |
| Código de embarque | QR fixo por veículo, rotacionável; dispositivo de navegador aprovado; desafio assinado por chave ECDSA; janela temporal e geocerca; trilha de tentativas e revisões. |
| Documentação recebida | O frontend já inclui `docs/UNIBUS_DOCUMENTACAO_COMPLETA.md` com grande inventário. Os achados abaixo foram confrontados com arquivos-fonte relevantes. |

**Atenção de nomenclatura:** o frontend usa a marca **UNIBUS**, enquanto README e ROADMAP do backend referem-se a **SIGTU** como substituto do UNIBUS legado. Formalizar nome e escopo do produto para documentação, treinamentos e implantação.

## 3. O que significam os módulos (sem jargão)

| Tela/termo | O que resolve na prática | Quem a utiliza principalmente |
| --- | --- | --- |
| **Estudantes** | Cadastro de quem usa/solicita o transporte, dados, situação, instituição e linha principal. | Atendimento/gestão |
| **Solicitações** | Análise da inscrição inicial e documentos; aprovação, devolução para correção ou rejeição. | Atendimento/gestão |
| **Recadastramento** | Renovação de dados e documentos de estudantes atuais em períodos abertos. | Gestão e estudantes |
| **Linhas** | Serviços de transporte com seus estudantes, capacidade e motorista. | Gestão |
| **Frequência** | Chamada administrativa diária (presente, falta, justificada) e suas consequências. | Motorista/gestão |
| **Veículos** | Vans físicas. Cada uma pode ter um QR impresso para leitura pelos alunos. | Gestão operacional |
| **Veículo × linha** | Qual van atenderá qual linha, e durante qual vigência. | Gestão operacional |
| **Horários** | Regras recorrentes de saída por linha, dias da semana e ida/volta. | Gestão operacional |
| **Viagens** | A ocorrência concreta: uma viagem em determinada data e horário, com van e janela de presença. | Gestão operacional |
| **Dias sem operação** | Suspensão da operação em uma data, de uma linha ou de todas. O cadastro cancela viagens afetadas. | Gestão operacional |
| **Pontos de embarque** | Locais cadastrados com coordenadas e raio de proximidade. | Gestão operacional |
| **Ponto × linha** | Define quais pontos servem cada linha/sentido, sua ordem e eventual horário de passagem. | Gestão operacional |
| **Autorizações de linha** | Exceção temporária para estudante usar uma linha além da habitual. | Atendimento/gestão |
| **Solicitações de dispositivo** | Pedidos de autorização ou troca de navegador/celular para registro de presença. | Atendimento autorizado |
| **Dispositivos** | Credenciais já aprovadas; possibilidade de revogação imediata. Não é mera lista de aparelhos físicos. | Atendimento autorizado |
| **Presenças registradas** | Comprovantes de embarque associados a viagens, por QR ou exceção manual. | Gestão/controle |
| **Tentativas e revisões** | Registros aceitos/negados e pedidos de revisão de embarque. | Gestão/atendimento |
| **Auditoria** | Histórico de ações administrativas e responsáveis. | Gestão/auditoria |
| **Indicadores** | Quantitativos agregados de presenças, negativas, revisões e exceções. | Gestão |
| **Cargos** | Papéis de acesso, sem editor completo de permissões na UI atual. | Administração técnica |
| **Instituições** | Faculdades/instituições ligadas ao cadastro e a linhas. | Administração |

**Observação:** os itens de Transporte aparecem agrupados na versão enviada; as seções permanecem implementadas na mesma rota `/transportes`.

## 4. Processos principais e dependências

### A. Solicitar transporte pela primeira vez

Candidato → formulário público `/registro` → validações e documentos → análise administrativa em `/solicitacoes` → aprovação pode gerar cadastro de estudante → vinculação de conta, quando aplicável. A aprovação não equivale necessariamente à criação automática de credencial de login.

### B. Renovar cadastro

Gestão abre um período → estudante passa por verificação de acesso via CPF **mais código** → revisa dados e documentos → finaliza → gestão analisa solicitação e decide. Não é a mesma operação que a primeira inscrição.

### C. Preparar a operação de uma linha

Linha e estudantes elegíveis → veículo cadastrado com QR válido → atribuição de veículo à linha → horários recorrentes por sentido → geração de viagens concretas → pontos de embarque vinculados à linha/sentido → autorização adicional quando o estudante necessitar usar outra linha. Sem viagem e geocerca compatíveis, a presença automática por QR pode ser recusada.

### D. Autorizar o navegador de um estudante

Estudante solicita vínculo/troca → equipe autorizada verifica identidade, aprova ou rejeita → estudante conclui desafio de vinculação no próprio navegador dentro do prazo → credencial fica ativa. Troca pode revogar a anterior. Revogação administrativa bloqueia novas presenças.

### E. Registrar presença por QR

Estudante autenticado → lê QR da van → API identifica veículo e viagem elegível → browser obtém localização e assina desafio com credencial autorizada → servidor confere permissões, janela, geocerca e duplicidade → registra **presença de viagem** ou tentativa negada. Certas negativas permitem pedido de revisão; a equipe pode aprovar presença manual com justificativa.

### F. Fazer chamada diária

Motorista/gestão abre chamada da linha e data → marca presente, falta ou justificativa → salva e fecha → relatório de frequência/benefício é reavaliado. **A entidade `Frequencia` desta rotina é separada da entidade `Presenca` do QR.** O código consultado não demonstra que a presença do QR substitua automaticamente a marcação da chamada.

## 5. Achados priorizados com evidências

| ID | Nível | Achado e evidência | Decisão/ação sugerida |
| --- | --- | --- | --- |
| P01 | **Crítico para regra de negócio** | `app/Services/Frequencia/BeneficioFrequenciaService.php` inativa estudante com **3 faltas seguidas** ou **5 no mês** usando chamadas fechadas. Registro QR segue `RegistroPresencaService` e outra entidade. | A SEDUC deve decidir qual evidência determina frequência oficial e quem pode corrigir divergências. Não integrar automaticamente sem regras formalizadas e testes. |
| P02 | **Alto** | Backend ROADMAP D01–D10 deixa decisões de embarque/geocerca/prazo/privacidade para o PO; `config/presenca.php` contém limites provisórios (ex.: precisão 100 m, teto do raio 1 km). | Validar pontos reais, raio, horários, procedimentos de exceção, retenção de localização e risco aceitável antes de piloto. |
| P03 | **Alto** | O documento do repositório relata que testes PHPUnit anteriores ocorreram sem isolamento confirmado do banco por cache Laravel; poderiam ter recriado uma base que o usuário declarou descartável. `tests/TestCase.php` passou a bloquear cenário inadequado. | Não executar suites, `migrate:fresh` ou seeders em base real. Verificar ambiente de testes isolado e backup. **Nesta auditoria nenhum teste de banco foi executado.** |
| P04 | **Alto para liberação** | `docs/UNIBUS_DOCUMENTACAO_COMPLETA.md` relata suíte PHP isolada com 399 testes, **2 erros e 3 falhas**; UI visual não foi certificada. | Corrigir falhas; depois validar componentes em navegador e cenários de campo. Não tomar relato de build como homologação. |
| P05 | **Alto para UX** | `TransporteResourcePanel.tsx` + `transporteConfig.ts` compartilham o mesmo CRUD genérico para ações muito diferentes. | Transformar os 3–5 fluxos críticos em experiências orientadas por tarefa, com instruções, estados e consequências, sem jogar fora componentes reutilizáveis. |
| P06 | **Médio** | `TransporteEstudanteField.tsx` usa Input para busca **mais** Select paginado; a API `/estudantes?search=` já filtra por nome. | Evoluir para **um autocomplete pesquisável** com opções, paginação/scroll, debounce e distinção de homônimos. |
| P07 | **Médio** | `RoleResource.php` retorna apenas `title`, sem `id`, embora haja rotas HTTP de atualizar/excluir; tela `Cargos` só lista/cria. | Escolher: tirar cargos dessa área operacional ou completar a gestão com recursos de autorização e preservação de papéis essenciais. Mudar o Resource só após revisar consumidores. |
| P08 | **Médio** | `/perfil` (`src/app/(dashboard)/perfil/page.tsx`) renderiza apenas `<h1>Perfil</h1>`. | Implementar dados e ações reais ou retirar o acesso à página até estar pronta. |
| P09 | **Médio** | `TransporteResourcePanel.tsx` ainda tem formulário **Consultar pelo ID** para Instituições. | Remover da interface principal e permitir consulta/edição por nome e ações da lista. |
| P10 | **Médio** | `TransportesWorkspace.tsx` guarda grupo e seção ativos só em `useState`, e troca de seção remonta o painel; sem URL por seção. | Permitir deep link e histórico via parâmetros, preservando filtros quando for útil. |
| P11 | **Médio** | `TransporteReferenceField.tsx` procura itens em listas paginadas localmente; não são buscas globais para veículos, pontos e viagens. | Buscar no servidor quando o universo crescer; mostrar claramente quando os resultados são somente da página atual. |
| P12 | **Médio** | `TransporteResourcePanel.tsx` apresenta IDs internos secundários em listagens e metadados. | Exibir IDs somente quando ajudarem atendimento/auditoria, nunca como campo obrigatório de busca operacional. |
| P13 | **Médio** | A navegação atual coloca **Indicadores** no grupo Administração e separa **Dispositivos** de **Solicitações de dispositivo**. | Reorganizar por intenção do usuário: visão geral, operação, embarque, atendimento e configurações. |
| P14 | **Melhoria** | `DateInput.tsx` usa variante administrativa `white` e popover de largura `18rem` (288 px), mas testes visuais de posicionamento não estão confirmados. | Homologar com zoom, teclado, modal, coluna estreita e dispositivo móvel. Não alterar somente por suposição. |
| P15 | **Governança** | README/backend chama o produto **SIGTU** em substituição ao UNIBUS, mas interface usa **UNIBUS**. | Unificar marca/nome nos materiais e fluxos de treinamento. |

### Sobre as correções já presentes no ZIP

- O menu lateral possui tratamento de texto multilinha e versão móvel baseada em `<dialog>`: `AppSidebar.tsx`.
- As ações de cada registro usam `TableActionButton` com Lucide, tooltips e `aria-label`: `TransporteResourcePanel.tsx`.
- O calendário compartilhado é `DateInput.tsx`; largura e tema administrativo foram alterados em relação ao problema original relatado na documentação.
- A navegação do transporte foi agrupada em cinco áreas: `transporteNavigation.ts`.
- A busca do estudante passou a aceitar `search` no backend, com `GET /api/estudantes`, e a interface foi adaptada para usar resultados por página.

**Limite:** o ZIP é uma fotografia de código. Não prova sozinho que todas essas telas foram abertas e conferidas em navegador real, sobretudo quanto a posicionamento de calendário, botões em 375 px e fluxos de modal.

## 6. Navegação recomendada (proposta, não implementação)

A implementação atual tem cinco grupos. Para a próxima revisão de produto, proponho:

1. **Visão geral:** indicadores de operação, pendências de revisão, viagens do dia, solicitações abertas.
2. **Programação:** veículos, alocação de veículos a linhas, horários, viagens, dias sem operação, pontos por linha.
3. **Embarques:** presenças registradas, negativas, revisões, QR e autorizações temporárias de linha.
4. **Atendimento:** solicitações de dispositivo, vínculos ativos e revogações, dúvidas de estudantes.
5. **Configurações (acesso restrito):** instituições, cargos/permissões, auditoria e parâmetros avançados.

**Antes de implementar:** decidir com os operadores reais se o acesso principal deve ser por tarefa ("Preparar amanhã", "Ver ocorrências", "Autorizar aparelho") ou por entidade. Provavelmente ambos: resumo de tarefas e páginas de consulta detalhada.

Renomeações recomendadas no **texto** da interface, sem mudar rotas/API: "Veículo × linha" → "Alocação de veículos"; "Ponto × linha" → "Pontos por linha"; "Tentativas e revisões" → "Ocorrências de embarque"; "Dispositivos" → "Aparelhos autorizados" (explicando que a credencial é de navegador).

## 7. Critérios de UX para a próxima etapa

- Campos de relacionamento: selecionar **nome/rótulo**, não digitar ID; autocomplete único nos conjuntos grandes.
- Ações por registro: ícones consistentes, rótulos acessíveis e dicas; confirmar operações irreversíveis.
- Evitar telas que pareçam logs de API. Erros 401/403/409/422/429 devem ter mensagens claras e ações recuperáveis.
- Calendários compactos e campo com altura padronizada; selecionar data digitando ou no popover, respeitando DD/MM/AAAA.
- Tabelas: densidade equilibrada, layout mobile adequado, filtros coerentes, status com apresentação consistente.
- Operações de risco: **Rotacionar QR** invalida o impresso anterior; **Dia sem operação** cancela viagens e remoção não as reativa automaticamente; **Revogar dispositivo** bloqueia registros; **Aprovar revisão** pode gerar presença manual. Mostrar a consequência antes de confirmar.
- Não inventar funcionalidades que API não oferece, nem dados fictícios para contornar 403/404.

## 8. Decisões que a SEDUC precisa responder antes do piloto

1. Qual é a **fonte oficial da frequência**: chamada, QR, ambas, ou regras para conciliar? Como tratar falta na chamada com presença QR na mesma data e a viagem de ida/volta?
2. Os limites de **3 faltas consecutivas / 5 mensais** e a inativação automática são regras aprovadas e oficialmente comunicadas?
3. Os quatro serviços atuais têm **pontos fixos**? Quais, em ida e volta, com horário aproximado de passagem?
4. Qual **raio de geocerca** funciona no mundo real e minimiza falsos positivos? Quem calibra/revisa?
5. Qual procedimento se o estudante **não tiver internet, GPS, ou perder o aparelho**? Quem pode lançar presença manual?
6. Quem pode **aprovar o primeiro vínculo e a troca** de aparelho? Como verificar identidade?
7. Há necessidade de **remanejamento temporário** de linha? Quem autoriza e como a SEDUC registra a justificativa?
8. Quais registros de **localização e tentativa** serão guardados por quanto tempo e acessados por quem (LGPD)?
9. É desejável manter **Cargos/Instituições** junto à tela de transporte, ou colocá-los em Administração separada?
10. Quais telas serão operadas diariamente pelo motorista e pelo atendimento? Isso define o ponto de partida dos menus.

## 9. Plano de execução recomendado

### Fase 0 — Segurança e decisões

- Criar backup e ambiente de homologação separado.
- Investigar e corrigir 5 resultados problemáticos da suíte reportada (2 erros e 3 falhas), distinguindo diferenças SQLite/MySQL de defeitos de aplicação.
- Formalizar as decisões sobre frequência oficial, regras do benefício e geocerca, antes de automatizar interações entre módulos.

### Fase 1 — Operação diária e clareza

- Fazer mapa de tarefas de gestão, motorista e estudante.
- Melhorar seleções de estudante, linha, van e viagem; retirar consultas obrigatórias por ID.
- Padronizar status, calendários, tabelas, botões, textos e confirmações.
- Conferir manualmente 1440/1280/1024/768/430/375px e zoom 125/150%.

### Fase 2 — Fluxos críticos

- Assistente de programação: linha → veículo → horários → geração de viagens → pontos/geocercas → revisão de conflitos.
- Fila de análise de vínculo/troca de aparelho com comprovantes, identidade e decisão.
- Ocorrências de embarque com explicação do motivo e decisão de revisão.
- Visão de frequência capaz de comparar fontes sem alterar nenhuma delas automaticamente até aprovação da regra.

### Fase 3 — Homologação

- End-to-end para cadastro, recadastro, QR e chamada; testes com backend e dados descartáveis.
- Testes de campo em pelo menos um ponto por linha, aparelhos/navegadores distintos, GPS de baixa precisão, falha de rede, atraso de van e QR expirado.
- Rever acessibilidade, permissões, auditoria, proteção de dados e instruções para atendimento.

## 10. Restrições e verificações pendentes

**Não realizado:** `npm run build`, PHPUnit, migrations, navegação real, testes de câmera e GPS, conexão de banco e verificação de permissão com contas reais. Não havia `node_modules`, `vendor` ou configuração de ambiente em execução; não se instalou dependências ou criou ambiente para este parecer. Os resultados de testes mencionados na documentação foram apenas lidos.

**Fonte adicional detalhada:** `frontend/docs/UNIBUS_DOCUMENTACAO_COMPLETA.md` reúne rotas, campos, Requests, Resources e matriz de permissões. A presente auditoria não substitui esse inventário; organiza decisões e prioridades.

**Arquivos-fonte particularmente importantes para próximas rodadas:**

- `frontend/src/components/ui/transportes/{TransportesWorkspace,TransporteResourcePanel,TransporteFields,TransporteEstudanteField,TransporteReferenceField,transporteConfig,transporteNavigation}.tsx` (os dois últimos terminam `.ts`).
- `frontend/src/components/form/inputs/DateInput.tsx`.
- `frontend/src/components/ui/layout/AppSidebar.tsx`.
- `backend/routes/api.php`.
- `backend/app/Services/{Frequencia/BeneficioFrequenciaService,Presenca/RegistroPresencaService,Viagem/ProgramacaoService,Viagem/GeradorViagens}.php`.
- `backend/config/presenca.php`; `backend/database/seeders/RolePermissionSeeder.php`.
- `backend/app/Http/Resources/Role/RoleResource.php`.
- `backend/tests/TestCase.php`, `backend/tests/README.md`.

---

**Síntese:** já há material suficiente para uma evolução criteriosa. Priorizar a segurança das regras que afetam o estudante, depois simplificar tarefas e unificar o design. A decisão sobre como a chamada e o QR se relacionam é a mais importante para evitar mudanças de UI que escondam um problema de processo.
