# Gestão Guiada do Transporte — plano de implementação MVP

> **For agentic workers:** executar com superpowers:executing-plans nesta sessão; revisar o conjunto ao final.

**Goal:** entregar visão por linha e assistente de seis etapas para testes internos.

**Architecture:** compor leituras autorizadas dos serviços existentes, com paginação completa de viagens e diagnóstico derivado. Reutilizar o painel/formulários administrativos em contexto de linha, com escopo fixo, confirmação dos efeitos e bloqueio de repetição após resultado incerto. Nenhuma nova infraestrutura de backend.

**Tech Stack:** Next.js, React, TypeScript, Tailwind, Biome e node:test existentes.

**Spec:** `docs/PROPOSTA_FLUXO_GUIADO_TRANSPORTE.md`, recortado pela solicitação aprovada de MVP (gravações independentes, sem rascunho persistente).

## Restrições globais

- Preservar rotas, permissões, design system, serviços e alterações locais anteriores.
- Não executar banco, migrations, seeders ou testes PHP; não ler `.env`.
- Não gerar viagens em leitura; sem publicação/aplicação global; sem QR automático.
- Trabalhar no checkout compartilhado atual para tornar a entrega revisável no IDE, sem commits automáticos.

## Foco de revisão

- Falha ou falta de permissão não pode parecer ausência de cadastro nem operação pronta.
- Paginação, conflitos entre linhas e janelas próximas da meia-noite não podem sumir no resumo.
- Linha fixa não pode ser trocada no payload de associação ou geração.
- POST com resposta perdida não pode ser repetido silenciosamente.
- Voltar etapas deve preservar edição local; sair não promete persistência.

## Tarefas

- [x] 1. Leituras e diagnóstico: criar `src/types/transporte-operacao.ts`, `src/services/api/modules/transporte-operacao.ts`, `src/components/ui/transportes/transporteOperacaoPresentation.ts`. Testar cobertura, precedência, conflitos e leitura paginada em `tests/transporte-operacao.test.cjs`, primeiro RED e depois GREEN.
- [x] 2. Reuso contextual: estender `TransporteResourcePanel` para contexto guiado, escopo fixo, confirmação/leitura após escrita e recuperação conservadora. Compartilhar campos da linha com seu workspace; reutilizar formulário de usuário quando autorizado. Testar limites de gravação e renderização.
- [x] 3. Experiência: visão geral, ficha/resumo e seis etapas com recursos existentes, manutenção secundária e acesso contextual de `/linhas`. Preservar valores em memória e revalidar dados após mutações, com revisão de gravações confirmadas/incertas.
- [x] 4. Verificação e documentação: node:test completo, TypeScript sem emissão, Biome nos alterados, build quando disponível; revisão independente; registrar limitações e roteiro de teste interno. Sem chamadas ao banco real.

## Registro de execução

- Escopo decidido: resumo estrutural não declara prontidão; cadastro de motorista depende de `users.write`; cadastros/ajustes inseguros ficam encaminhados à manutenção.
- Implementação no checkout atual, preservando documentos locais anteriores e sem commits automáticos. Não houve alteração no repositório backend.
- Validação final: 125/125 testes Node; TypeScript sem emissão; build Next.js; Biome nos 19 arquivos de código/teste alterados; ensaio Chrome com API totalmente interceptada em desktop e 375px.
- Revisão independente: dois achados corrigidos. Falha de GET após escrita aceita agora exige reconciliação independentemente do status; troca de motorista não reenvia nome e reconsulta capacidade. Ambos possuem testes de regressão e ensaio em navegador. O cenário de conferência 403 falhou contra o build anterior e passou após correção.
- Cenário adicional: reconsulta indisponível da linha preserva valores em memória e bloqueia escrita até recuperação. Link contextual de `/linhas` foi exercitado no navegador.
- Limites deliberadamente mantidos conforme o MVP: sem concorrência transacional, simulação, rascunho persistente ou validação física de pontos. Integração real de autorização, QR, GPS e banco não foi ensaiada; permanece homologação futura, detalhada em `docs/GESTAO_GUIADA_TRANSPORTE_MVP.md`.
- Relatório de entrega e execução reproduzível do ensaio: `docs/GESTAO_GUIADA_TRANSPORTE_MVP.md`; `tests/browser/transportes-guided.cjs`. Nenhuma dependência adicionada ao projeto.
