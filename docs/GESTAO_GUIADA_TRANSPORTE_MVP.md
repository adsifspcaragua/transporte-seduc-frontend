# Gestão Guiada do Transporte — primeira versão para testes internos

**Data:** 06/11/2026. Implementação frontend da estratégia transitória aprovada: seis etapas, endpoints existentes e gravações independentes. Não é homologação para produção.

## O que mudou

- `/transportes` abre uma visão por linha, com período de conferência, motorista, capacidade/ocupação consultada, veículos alocados por data, pontos ativos por sentido, horários, viagens e pendências identificáveis.
- O detalhamento mostra calendário, suspensões gerais/da linha, viagens existentes e possíveis conflitos de veículo entre linhas, inclusive janelas adjacentes que compartilham um limite e datas vizinhas da madrugada. A comparação é de janelas de embarque, não de duração física de trajetos.
- **Configurar transporte** abre Linha → Veículo e motorista → Horários → Pontos de embarque → Calendário e viagens → Revisão. Seleções e formulários permanecem em memória ao voltar entre etapas, visão geral e manutenção dentro da mesma página.
- A linha é fixada nos payloads de alocação, horário, vínculo de ponto, suspensão e geração. Não há seleção/digitação de ID de linha nessas operações.
- Recursos existentes são priorizados. Veículos e pontos podem ser cadastrados pelos mesmos formulários administrativos; motorista reutiliza `UserFormModal`, com perfil motorista fixo e `users.write`. Os campos e a validação de linha são compartilhados com `/linhas`.
- A manutenção anterior foi preservada em **Cadastros e manutenção**, com grupos, funcionalidades e permissões existentes. O menu de ações de cada linha em `/linhas` oferece **Configurar transporte**, quando o perfil já pode acessar `/transportes`.
- Não foram criadas tabelas, migrations, endpoints, permissões, entidades ou mudanças de regras no backend.

## Gravação e recuperação

Abrir/atualizar a visão geral apenas executa leituras. Gerar viagens requer ação explícita e confirmação. Criar/editar por etapa informa o alcance, grava imediatamente e consulta o servidor depois. Criar uma linha pelo assistente omite os horários legados: a programação é feita na etapa própria.

O resumo de revisão separa os cadastros consultados do registro de envios feitos pelo assistente nesta aba. Campos abertos e seleções sem confirmação não são apresentados como salvos. Trocar de linha pede confirmação de descarte da edição local; registros gravados nunca são apagados para desfazer o percurso.

Cadastros equivalentes são conferidos por leitura antes de POST: veículo por identificação/placa, ponto por nome e coordenadas, vínculo de ponto por linha/ponto/sentido, atribuição por linha/veículo/período, suspensão por linha/data e horários equivalentes com dias/vigências sobrepostos. Isso reduz duplicações acidentais; não é uma garantia transacional entre clientes simultâneos. Casos que exigem distinguir cadastros semelhantes podem ser avaliados na manutenção.

Se uma escrita tiver resultado desconhecido, ou se a consulta posterior falhar mesmo após resposta de sucesso, a seção registra **resultado a conferir** e bloqueia novos envios naquela configuração. A consulta é atualizada e a pessoa é encaminhada à manutenção. Não há retentativa automática de POST. Falhas de validação anteriores à gravação continuam corrigíveis no formulário.

A troca de motorista reconsulta a linha e envia somente o responsável e a capacidade atual exigida pelo contrato de update, sem reenviar nome ou horários antigos. A API não possui versão/ETag para impedir uma alteração concorrente entre essa leitura e a escrita.

Uma falha na reconsulta da linha preserva os valores da configuração já aberta, mas bloqueia novas gravações até a leitura ser recuperada. Mudanças de conta/permissões reiniciam o contexto pelo mecanismo de sessão existente.

QR novo só é emitido ao cadastrar deliberadamente um veículo; o código recebido fica no estado temporário do modal de impressão existente. Não há rotação automática ou recuperação de token perdido. Se a leitura de confirmação falhar após emissão, o QR já recebido continua disponível para guardar.

## Limitações que permanecem

1. Não existe rascunho persistente, retomada entre dispositivos, aplicação global, simulação de backend, rollback conjunto ou publicação de operação. Recarregar/fechar a página perde edições não enviadas e o registro local de envios; os cadastros gravados continuam no servidor.
2. O endpoint de horário pode gerar hoje e descartar futuras regeneráveis; atribuições podem sincronizar veículos; gerar viagens pode salvar e depois informar conflitos. O assistente não modifica automaticamente viagens com histórico protegido nem reativa cancelamentos por remoção de suspensão.
3. Exclusões, rotação de QR, edição global de ponto/veículo compartilhado, remoção de vínculo e suspensão geral permanecem na manutenção. Isso permite revisar consequências fora do caminho principal.
4. Consulta de linha ou referência sem permissão é mostrada como indisponível. O perfil operador não ganha poderes de programação; continua consultando o que já é permitido. Motorista continua limitado ao fluxo de frequência conforme o RBAC existente.
5. “Sem pendências identificadas nas consultas” não significa operação pronta: não certifica adesivo afixado, pontos homologados, compatibilidade de todas as passagens/janelas, credenciais dos estudantes, capacidade física do veículo ou escala de motorista. A revisão sempre comunica esse alcance.
6. Passagens continuam pertencendo à linha/sentido, não à regra de horário. Várias saídas no mesmo sentido e passagem em dia seguinte precisam de revisão operacional. Não há vínculo estudante/ponto, capacidade por veículo, reserva de assento ou motorista por viagem.
7. Viagens são lidas com toda a paginação; a conferência consolidada consulta também datas vizinhas para possíveis conflitos de madrugada. Consultas não formam um snapshot transacional. Alto volume pede agregação no servidor.
8. Presença de QR continua separada de frequência/chamada e de seus efeitos no benefício. O MVP não altera essa regra.
9. O histórico local de envios não é auditoria persistente nem garante exclusividade de edição. A auditoria administrativa existente continua disponível a quem possui permissão.

## Verificação realizada

Verificações executadas no frontend, sem chamadas ao backend real:

- Suíte Node: **125 testes**, incluindo diagnóstico com dados indisponíveis, paginação completa, precedência/inatividade de veículos, suspensão global, conflitos entre linhas/madrugada, proteção do escopo, deduplicação e falha de conferência após escrita aceita.
- TypeScript sem emissão e build Next.js passaram. Biome verificado nos arquivos alterados.
- Ensaio Chrome/Playwright com todos os endpoints interceptados e dados sintéticos: visão geral sem escrita, seleção de linha existente, permanência da seleção ao voltar, vínculo de motorista, criação de horário, vínculo de ponto, geração explícita e revisão.
- O mesmo ensaio confirmou que troca de motorista preserva nome/capacidade alterados por outro servidor; que GET 403 após POST aceito bloqueia repetição; que perda de resposta com leitura 429 bloqueia novo cadastro; e que falha na consulta de linha preserva seleção local e bloqueia escrita.
- Conferência visual e ausência de overflow em 1366 × 900 e 375 × 812, incluindo navegação por teclado nos controles de confirmação. Nenhum erro JavaScript observado nesses cenários.

O ensaio de navegador está em `tests/browser/transportes-guided.cjs`. Ele exige Playwright disponível externamente e servidor Next local em execução; não altera os manifests do projeto. Bloqueia endereços de aplicação não locais e intercepta os endpoints antes de navegar.

Exemplo de execução, usando uma instalação já disponível do Playwright:

```powershell
# Terminal 1, depois de npm run build:
npm.cmd run start -- --hostname 127.0.0.1 --port 3123

# Terminal 2: caminho da instalação externa, sem instalar dependências no projeto:
$env:UNIBUS_PLAYWRIGHT_MODULE = 'CAMINHO_ABSOLUTO/node_modules/playwright'
node tests/browser/transportes-guided.cjs
```

Opcionalmente definir `UNIBUS_BROWSER_EXECUTABLE` e `UNIBUS_TEST_BASE_URL` (somente localhost/127.0.0.1). No Windows, o padrão é Chrome em Program Files. As capturas desktop/mobile são gravadas no diretório temporário do sistema, sem dados reais.

**Não validado:** integração efetiva contra Laravel/banco, impressão real de QR, câmera/GPS, pontos em campo, e-mails, todos os perfis reais, tecnologia assistiva, todos os dispositivos ou comportamento sob concorrência no banco. Não foram executados PHPUnit, migrations ou seeders; os resultados históricos problemáticos documentados continuam pendentes de investigação.

## Próximos passos

1. Testar internamente com servidores da SEDUC e registrar onde a linguagem/ordem ainda exige explicação.
2. Decidir critérios bloqueantes, perfis responsáveis, horários múltiplos/madrugada, capacidade e procedimentos de suspensão conforme as questões da [proposta](PROPOSTA_FLUXO_GUIADO_TRANSPORTE.md).
3. Homologar contratos atuais e pontos/QR em ambiente isolado, com dados descartáveis e sem confundir QR com chamada.
4. Evoluir API para rascunhos versionados, simulação sem escrita, validação referencial/deduplicação no servidor, aplicação idempotente coordenada e resumo agregado por linha/período.
5. Tratar escala por viagem, capacidade por veículo e passagens por saída apenas após decisão de negócio e modelagem apropriada.
