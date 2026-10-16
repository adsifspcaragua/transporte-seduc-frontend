# ROADMAP — SIGTU

**Sistema de Gestão do Transporte Universitário de Caraguatatuba**  
**Módulo:** Vinculação de dispositivo e controle de presença por QR Code, geolocalização e horário  
**Versão do planejamento:** 1.0 — 16/10/2026  
**Estado:** Proposta técnica para validação com o Product Owner (PO) e equipe de desenvolvimento

> **Objetivo:** permitir que estudantes registrem sua própria presença na viagem, usando o SIGTU em um celular, com verificações de dispositivo autorizado, QR Code da van, linha/viagem, janela de horário e localização. A solução deve aproveitar a infraestrutura existente, **sem compra de dispositivos para as vans, sem serviço pago obrigatório e sem exigir interação do motorista**.
>
> **Limite de segurança:** nenhuma combinação de QR Code **fixo**, GPS fornecido pelo navegador e chave criptográfica web comprova, de maneira absoluta, que o estudante entrou na van. O desenho proposto dificulta fraudes comuns e deixa evidências para auditoria, mas não é uma prova física infalível de embarque.

---

## 1. Contexto e decisões já alinhadas

- O SIGTU tem **4 linhas de transporte universitário**, operadas atualmente por **4 vans (uma por linha)**.
- Cada linha possui um **horário específico**; considerar também viagens de **ida/retorno**, dias de operação, feriados e eventuais exceções, conforme confirmação da equipe.
- O aluno deve **ler um QR Code afixado na van** para solicitar sua presença.
- O QR Code deve ser **físico/estático** — não haverá tela gerando códigos dinamicamente no veículo.
- A operação de presença não pode depender do **motorista**.
- A solução deve usar **Next.js + TypeScript (frontend), API Laravel (backend) e MySQL (persistência)**, sem novo serviço pago obrigatório.
- O estudante deve poder registrar presença **somente com uma credencial de navegador previamente autorizada**.
- A presença depende de **horário e geolocalização** compatíveis com a viagem.
- A estratégia de geocerca **ainda não foi decidida**: pontos de embarque específicos, áreas de cobertura ou corredor de rota.
- Se existirem **pontos fixos**, a proposta inicial é associá-los às respectivas linhas e testar um **raio configurável**, podendo avaliar **1.000 metros**, sem definir esse valor como seguro ou definitivo.

### 1.1. Decisões em aberto (não presumir)

| ID | Questão | Opções / observações | Responsável sugerido |
|---|---|---|---|
| D01 | Existem pontos fixos de embarque? | Sim / não / parcialmente | PO + operação |
| D02 | Como validar área geográfica? | Círculo por ponto / polígono por região / corredor da rota / híbrido | PO + equipe |
| D03 | Qual raio por ponto? | **1 km é apenas hipótese de teste**; pode variar por ponto | PO + testes de campo |
| D04 | Há horário de passagem por ponto? | Horário da linha apenas / horário por ponto / faixa aproximada | Operação |
| D05 | Viagem de ida e retorno devem ser registradas separadamente? | Recomendado: **sim**, uma presença por ocorrência de viagem | PO |
| D06 | Quais estudantes podem embarcar em quais linhas/pontos? | Linha fixa / permissões especiais / troca temporária | PO |
| D07 | Quem libera o primeiro dispositivo e as trocas? | Atendimento autorizado, com verificação de identidade | Gestão |
| D08 | Qual procedimento para perda de celular ou GPS indisponível? | Exceção administrativa com justificativa e trilha de auditoria | Gestão + PO |
| D09 | Qual nível de risco residual é aceitável? | GPS falso, QR fotografado, residência próxima ao ponto | PO + gestão |
| D10 | Quais dados de localização serão retidos e por quanto tempo? | Definição de necessidade, acesso, prazo e descarte | Encarregado LGPD + gestão |

---

## 2. Objetivos e critérios de sucesso

1. Evitar que **apenas o conhecimento da senha** permita registrar presença na conta de outro estudante.
2. Relacionar cada leitura de QR Code à **van identificada** e à **linha/viagem efetivamente atribuída**.
3. Limitar a presença às **janelas de tempo** previstas e às **zonas geográficas autorizadas**.
4. Evitar registros duplicados e tentativas de reutilização de desafios/assinaturas.
5. Permitir **substituição controlada de celular/navegador**, com aprovação adequada.
6. Operar sem participação do motorista e sem contratação de serviço externo pago obrigatório.
7. Registrar **motivos de rejeição, tentativas suspeitas e ações administrativas** para auditoria e suporte.
8. Não bloquear definitivamente estudantes legítimos quando houver falha de GPS ou atraso real da van; ter **processo de revisão**.

### Fora do escopo inicial

- Rastreamento em tempo real das vans.
- Aplicativo Android/iOS nativo.
- Leitura de IMEI, serial, MAC ou qualquer identificador físico inacessível a páginas web.
- Garantia absoluta de que dois estudantes não usam o mesmo **celular físico** em navegadores diferentes.
- Garantia absoluta de embarque a partir de QR fixo e localização web.
- Registro de presença offline com sincronização posterior.

---

## 3. Arquitetura proposta

```text
[Celular do estudante — navegador/PWA opcional]
  Next.js + TypeScript
  ├─ Autenticação atual do SIGTU
  ├─ Scanner de QR Code via câmera
  ├─ Geolocation API (mediante permissão)
  ├─ Web Crypto API (ECDSA P-256)
  └─ IndexedDB (chave privada CryptoKey não exportável)
                │ HTTPS
                ▼
[API Laravel]
  ├─ Autenticação / autorização
  ├─ DeviceEnrollmentService / DeviceProofService
  ├─ QrVehicleResolver / TripResolver
  ├─ AttendancePolicy / GeoFenceService
  ├─ Rate limiting / validação de desafio
  └─ AuditLogService
                │
                ▼
[MySQL]
  Estudantes, credenciais, vans, linhas, viagens,
  horários, pontos/áreas, presenças e auditoria
  + tabelas de cache/locks se necessário
```

### Diretrizes de infraestrutura

- **HTTPS é obrigatório** na produção (geolocalização e Web Crypto são APIs de contexto seguro).
- Não exigir **Redis** no MVP: para desafios, expiração e locks, é possível usar o próprio **MySQL** e o cache/locks via banco do Laravel, de acordo com a infraestrutura efetivamente disponível.
- A validação final ocorre **sempre no Laravel**; frontend não é autoridade para liberar presença.
- Separar serviço de localização do serviço de presença para permitir trocar a política de geocerca sem refazer todo o fluxo.
- A instalação como **PWA é opcional**, não equivale a aplicativo nativo nem fornece identidade física imutável.
- Não exigir plataforma de mapas paga: cálculos de distância podem ser executados localmente; visualização cartográfica pode ser acrescentada posteriormente, respeitando as condições de uso da fonte de mapas escolhida.

---

## 4. Vínculo de dispositivo autorizado

### 4.1. Modelo de segurança adotado

Usar **par de chaves assimétricas** por instalação autorizada do SIGTU:

- **Chave privada:** gerada via `crypto.subtle.generateKey()` como **não exportável** e persistida no **IndexedDB** do navegador.
- **Chave pública:** enviada e registrada no Laravel.
- **Prova de posse:** para marcar presença, o navegador assina um desafio emitido pelo backend; o Laravel valida usando a chave pública cadastrada.
- **Uma credencial ativa por estudante:** regra de negócio aplicada transacionalmente no backend.
- **Uma chave pública não pode pertencer a duas contas**: impedir reutilização exata de credencial, sem alegar que isso identifica aparelhos físicos.

> **Ressalva importante:** impedir exportação da chave por APIs comuns de JavaScript não garante proteção por hardware. Um mesmo aparelho pode criar outras credenciais em navegadores/perfis diferentes. Por isso, a política é **“uma instalação de navegador autorizada por estudante”**, não “identificação infalível de um celular único”. XSS ou um ambiente comprometido também pode abusar de uma chave utilizável localmente.

### 4.2. Fluxo de primeira vinculação

1. Estudante autentica-se pelo método normal do SIGTU.
2. API identifica que **não existe credencial ativa** para a conta.
3. Interface mostra: **“Para registrar presença, autorize este dispositivo”**.
4. Inicia-se solicitação **pendente** de vínculo, associada à conta.
5. Atendimento/gestão autorizada confirma **a identidade do estudante** e aprova a solicitação; não confiar apenas na senha da primeira sessão.
6. API entrega um **desafio aleatório, curto e de uso único**, associado à autorização.
7. Navegador gera par de chaves ECDSA P-256; guarda chave privada no IndexedDB; envia chave pública e **assinatura do desafio de cadastro**.
8. Laravel valida a autorização, o desafio e a prova de posse; registra a credencial e ativa o vínculo.
9. Próximas presenças exigem assinatura válida dessa credencial.

**Importante:** não permitir que **quem fizer o primeiro login primeiro** vincule automaticamente seu aparelho à conta alheia. O cadastro exige procedimento institucional de aprovação.

### 4.3. Troca, perda de celular e limpeza do navegador

- Fluxo **“Solicitar troca de dispositivo”** com motivo e status (`pending`, `approved`, `rejected`, `completed`).
- Exigir nova validação confiável de identidade; conhecer a senha não basta.
- A troca aprovada **revoga a credencial antiga** e ativa a nova dentro de operação controlada.
- Manter histórico das revogações, responsável, data/hora e justificativa.
- Não permitir que apagar o IndexedDB, reinstalar o navegador ou trocar de PWA resulte em nova vinculação automática.
- Se um estudante possuir navegador autorizado indisponível, oferecer atendimento e revisão administrativa, com acesso mínimo e rastreabilidade.

### 4.4. Regras de segurança complementares

- Validar sessões e permissões normalmente; prova de dispositivo é **adicional ao login**, não o substitui.
- Proteger a interface contra XSS, manter dependências atualizadas, adotar política CSP compatível e não colocar credenciais em URLs/logs.
- Desafios aleatórios gerados no backend, com expiração curta, vínculo a usuário, credencial e ação, e marcação atômica de **uso único**.
- Bloquear desafios expirados/reutilizados, credenciais inativas/revogadas e excesso de tentativas.
- Não tomar `User-Agent`, nome do dispositivo, endereço IP, fingerprint ou `device_id` enviado pelo browser como prova de identidade do aparelho.
- A exigência de dispositivo móvel pode ser aplicada como **regra de experiência de uso** (câmera, layout e orientações), mas um website não consegue atestar de modo confiável que está em um celular físico e não em um ambiente simulado.
- Considerar **WebAuthn com verificação do usuário** como evolução; passkeys sincronizadas, por si só, não resolvem vínculo a um único aparelho físico.

### 4.5. Nota de implementação criptográfica

- Algoritmo sugerido: **ECDSA com curva P-256 e SHA-256**.
- Para exportar a chave pública, usar `spki`; a privada permanece não exportável.
- Assinar **bytes definidos canonicamente pelo servidor** (ex.: string codificada com versão, ação, desafio, usuário, viagem e expiração), e não JSON montado independentemente por cliente e servidor sem padronização.
- A assinatura ECDSA entregue pela Web Crypto API costuma estar em **formato P1363 (`r || s`)**; `openssl_verify()` no PHP normalmente espera **ASN.1/DER**. Implementar e testar a conversão ou utilizar verificador interoperável.
- Nunca enviar a chave privada ou confiar em uma assinatura fornecida sem conferir no backend sua relação com o desafio armazenado.

---

## 5. QR Code fixo e relação van × linha

### 5.1. Modelo recomendado

- Cada van tem um **QR Code próprio**, **impresso/afixado** em local acessível.
- O QR contém somente uma URL SIGTU ou identificador opaco, aleatório, não sequencial, que permite ao backend localizar o **veículo** (ex.: `https://sigtu.../presenca/scan?t=TOKEN_ALEATORIO`).
- O token/identificador do QR **não autoriza presença sozinho**; ele é um identificador público na prática, pois pode ser fotografado.
- O Laravel resolve **qual linha e ocorrência de viagem** estão atribuídas ao veículo no dia e horário do registro.
- Uma **troca excepcional de van** entre linhas pode ser cadastrada pela administração sem necessidade de imprimir novamente um QR por linha.
- Um QR pode servir para **ida e retorno**; a ocorrência de viagem é identificada conforme programação, sentido e contexto do estudante.

### 5.2. Política de troca e revogação do QR

- Permitir desativar/rotacionar o identificador de um QR que foi danificado, substituído indevidamente ou comprometido.
- Rotacionar QR fixo exige **reimpressão** e instalação no veículo por equipe administrativa, não motorista.
- O risco de foto/compartilhamento **não é eliminado** por QR fixo: outras verificações reduzem, mas não eliminam, a possibilidade de fraude.
- O scanner do frontend deve aceitar somente conteúdo/URLs esperadas do domínio do SIGTU; evitar redirecionamentos para sites arbitrários. Orientar equipe a inspecionar adesivos substituídos para reduzir golpes de phishing.

---

## 6. Linhas, viagens, horários e autorizações

### 6.1. Estrutura lógica

- **Linha:** um dos quatro serviços de transporte atualmente existentes (`lines`).
- **Veículo:** a van física identificada pelo QR (`vehicles`).
- **Atribuição:** relação veículo/linha válida durante certo período ou viagem (`vehicle_assignments`).
- **Programação:** dia da semana, sentido (ida/retorno), horário e eventuais exceções (`trip_schedules`).
- **Ocorrência de viagem:** execução programada para uma **data concreta**, com linha, sentido, veículo e janela efetiva (`trips`).
- **Autorização do estudante:** linhas e, se definido, pontos onde pode registrar presença (`student_line_authorizations` / `student_stop_authorizations`).

**Exemplo meramente ilustrativo (não representa horários reais):**

| Linha | Veículo normalmente atribuído | Saída prevista | Janela de presença ilustrativa |
|---|---|---|---|
| 01 | Van 01 | 17h30 | 17h15–17h45 |
| 02 | Van 02 | 18h00 | 17h45–18h15 |
| 03 | Van 03 | 18h30 | 18h15–18h45 |
| 04 | Van 04 | 19h00 | 18h45–19h15 |

### 6.2. Regras obrigatórias da API

Ao registrar presença, verificar **todas** as condições aplicáveis:

1. Conta autenticada e estudante habilitado.
2. Credencial autorizada **ativa**, assinatura válida e desafio não reutilizado.
3. QR corresponde a veículo cadastrado e em operação.
4. Há viagem compatível com **veículo + data + horário + sentido + linha**.
5. Estudante está autorizado naquela **linha/viagem**.
6. Tentativa está dentro da **janela permitida**, baseada no relógio do **servidor**.
7. Localização passou nas regras de geocerca, precisão e integridade operacional definidas.
8. Não existe presença já registrada para o par **estudante × ocorrência de viagem**.
9. Requisição passa por limites de taxa, integridade transacional e validações de entrada.

### 6.3. Atrasos e exceções

- Horários são **janelas configuráveis**, não segundos exatos.
- Se houver horários de passagem por ponto, preferir **janela por ponto**, mais específica do que a hora de saída da linha.
- Para atrasos, manutenção, alteração de veículo ou rota, equipe autorizada pode ajustar o cronograma ou abrir exceção **auditada**, sem solicitar operação ao motorista.
- **Atenção:** sem telemetria da van ou relato operacional, o SIGTU não sabe automaticamente onde a van está ou se está atrasada. Horários previstos não são posição em tempo real.

---

## 7. Geolocalização e geocercas — DECISÃO PENDENTE

### 7.1. Objetivo e limites

Solicitar **uma leitura de localização no momento da confirmação da presença** com a **Geolocation API** do navegador, sempre com consentimento de permissão da plataforma.

Dados típicos da leitura:

```ts
interface AttendanceLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestampMs: number;
}
```

Opções sugeridas para a chamada:

```ts
navigator.geolocation.getCurrentPosition(onSuccess, onError, {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
});
```

**Limitação:** coordenadas, horário do aparelho e precisão declarados pelo navegador podem ser adulterados ou simulados. A API web não fornece prova confiável de GPS autêntico. Assinar esses valores com chave do dispositivo não transforma dados adulterados em verdadeiros.

### 7.2. Alternativa A — pontos de embarque fixos (preferência se existirem)

1. Cadastrar cada ponto (`stops`) com nome, latitude e longitude.
2. Vincular o ponto a uma ou mais linhas via `line_stops`, inclusive ordenação e horários previstos se conhecidos.
3. Configurar uma **geocerca circular em metros por ponto**: `allowed_radius_m`.
4. O Laravel calcula distância entre posição do estudante e ponto autorizado.
5. Aceitar localização somente se cumprir distância, qualidade mínima da leitura e janela de horário.

**Hipótese em avaliação: raio de até 1.000 m** em torno do ponto. **Não aprovar 1 km como padrão sem testes**: esse raio é amplo e pode incluir residências, ruas e estabelecimentos sem relação com embarque, possibilitando presença de quem nem sequer está no ponto. Comparar faixas mais restritas — por exemplo, 100 m, 200 m, 300 m e 1.000 m — com erros e falsos aceites observados em campo. O raio final pode variar por ponto, densidade urbana e condições reais de GPS.

### 7.3. Alternativa B — áreas/regiões autorizadas

- Cadastrar uma região como **polígono geográfico** associada a uma linha e a uma janela de horário.
- Aceitar estudantes em regiões administrativamente permitidas.
- Adequado quando não existem pontos fixos, porém potencialmente permissivo demais.
- Não considerar **“qualquer ponto da região durante o horário da viagem”** equivalente à presença na van.

### 7.4. Alternativa C — corredor da rota

- Cadastrar traçado geográfico da rota; aplicar tolerância ao redor do percurso.
- Verificar distância até trechos relevantes da rota em vez de apenas um ponto.
- É mais complexo e também pode autorizar residências/comércios ao longo da via.
- Manter como evolução ou alternativa caso haja embarque variável.

### 7.5. Abordagem híbrida (se necessário)

- Pontos oficiais com geocercas específicas **onde existem**.
- Áreas pontuais de exceção para locais sem ponto fixo.
- Janela temporal sempre aplicada por linha/viagem e, quando disponível, por ponto.
- Controle de permissões para estudante que tenha mais de um ponto permitido.

### 7.6. Algoritmo de verificação de distância

Para **ponto circular**, o backend pode usar fórmula de Haversine ou `ST_Distance_Sphere()` no MySQL. Neste último, usar **longitude antes de latitude** na construção do `POINT`.

```sql
SELECT ST_Distance_Sphere(
  POINT(:longitude_estudante, :latitude_estudante),
  POINT(:longitude_ponto, :latitude_ponto)
) AS distancia_metros;
```

Pseudocódigo da política, **a parametrizar com PO**:

```text
se latitude/longitude/accuracy forem inválidos -> rejeitar
se não houver viagem/ponto/região autorizado -> rejeitar
se precisão declarada for pior que limite configurado -> pedir nova leitura ou revisão
calcular distância ao ponto ou checar região configurada
se distância > raio configurado -> rejeitar
senão continuar demais validações
```

**Cuidados:**

- Nunca confiar apenas na precisão do GPS como garantia de localização verdadeira.
- Guardar a hora em que a **API recebeu** a tentativa e expirar rapidamente o desafio; timestamp enviado pelo cliente é apenas dado auxiliar, não relógio confiável.
- `accuracy` é uma estimativa horizontal **em metros**, não uma prova contra GPS falso.
- Evitar conceder tolerância ilimitada apenas porque `accuracy` veio alta.
- Em perda de sinal, permitir **nova tentativa**; depois, solicitar revisão administrativa, sem criar uma brecha de aprovação automática.
- Testar dentro da van, em pontos cobertos, com dados móveis lentos e em aparelhos Android/iPhone diferentes.

---

## 8. Fluxo completo da presença

```text
01. Estudante faz login no SIGTU pelo celular
02. Next.js consulta status da credencial autorizada
    ├─ Ausente/pendente -> iniciar vinculação e/ou orientar atendimento
    └─ Ativa -> liberar fluxo de presença
03. Estudante abre scanner e lê QR físico da van
04. Frontend envia token QR à API (identificação de veículo)
05. Laravel valida token e resolve viagem, linha, sentido e horário
06. Laravel verifica autorização preliminar do estudante
07. Frontend solicita localização atual e informa precisão
08. Laravel emite desafio curto, de uso único, associado à ação
09. Frontend assina desafio com chave privada armazenada no IndexedDB
10. Frontend envia assinatura + dados de localização + id do desafio
11. Laravel, transacionalmente:
    ├─ autentica a sessão e valida a chave autorizada
    ├─ valida desafio e marca-o como consumido
    ├─ confere QR, veículo, linha, sentido, viagem e janela de horário
    ├─ confere geocerca/precisão conforme política
    ├─ verifica se já existe presença do estudante nessa viagem
    └─ registra presença ou rejeita com motivo controlado
12. Next.js apresenta resultado claro e orientação em caso de erro
```

**Atenção à ordem:** identificação preliminar da van e da viagem pode ocorrer antes da localização e da assinatura para UX; a **verificação definitiva de todas as regras precisa ser repetida na confirmação**. Nunca considerar o `trip_id` ou coordenadas enviadas pelo frontend como autoridade isolada.

### Cenários típicos

| Tentativa | Resultado desejado |
|---|---|
| Conta correta, credencial ativa, QR correto, horário e local válidos | Registrar |
| Amigo acessa outra conta apenas com senha | Bloquear ausência da credencial correta |
| QR de outra linha não autorizada | Bloquear |
| QR correto fora do período | Bloquear ou disponibilizar revisão |
| QR compartilhado com pessoa longe da geocerca | Bloquear com GPS normal |
| QR compartilhado com pessoa dentro de raio muito amplo | **Risco residual** |
| GPS falsificado de modo convincente no navegador | **Risco residual** |
| Reenvio da mesma assinatura/desafio | Bloquear (uso único) |
| Tentativas simultâneas de presença | Impedir duplicidade no banco |
| GPS negado/indisponível | Não aprovar automaticamente; orientar/revisar |
| Troca de van operacional | Resolver veículo × viagem conforme atribuição atualizada |

---

## 9. Modelagem inicial do banco (sugestão)

Ajustar nomes conforme o schema existente. As tabelas e chaves abaixo são **proposta**, não migrações definitivas.

### `student_devices`

- `id` (UUID), `student_id` (FK), `public_key_spki` (TEXT/BLOB), `public_key_sha256` (UNIQUE)
- `status` (`pending`, `active`, `revoked`), `device_label` (apenas informativo)
- `approved_by` (FK operador), `approved_at`, `last_used_at`, `revoked_at`, `revoke_reason`, timestamps
- Constraint/regra transacional que garante **no máximo uma credencial ativa por estudante**. Em MySQL, definir estratégia robusta de unicidade condicional (por exemplo, coluna gerada que recebe `student_id` apenas quando `status='active'`, com `UNIQUE`) além de transações/locks apropriados.

### `device_enrollment_requests`

- `id`, `student_id`, `status`, `requested_at`, `approved_at`, `approved_by`, `reason`, `expires_at`, `completed_at`
- Associar a aprovação **a uma tentativa concreta e expiração curta**, não deixar autorizações abertas indefinidamente.

### `device_challenges`

- `id`, `student_id`, `device_id` (nullable no cadastro), `purpose`, `challenge_hash`, `payload_version`, `trip_id` (nullable), `expires_at`, `used_at`, timestamps
- Usar nonce CSPRNG, bytes canônicos e consumo atômico de desafio. Podem ser persistidos em cache compartilhado/DB com TTL e auditoria resumida.

### `lines` e `vehicles`

- `lines`: `id`, `name`, `active`
- `vehicles`: `id`, `label`, `active`, `qr_token_hash`, `qr_rotated_at`
- **Não guardar o token QR em claro** se o identificador opaco puder ser verificado por hash; prever mecanismo seguro para geração/reimpressão.

### `vehicle_assignments`

- `id`, `vehicle_id`, `line_id`, `starts_at`, `ends_at`, `created_by`, `reason`
- Evitar atribuições conflitantes de um mesmo veículo para viagens simultâneas.

### `trip_schedules` e `trips`

- `trip_schedules`: `id`, `line_id`, `direction`, `days_of_week`, `departure_time`, parâmetros de janela e status
- `trips`: `id`, `schedule_id`, `line_id`, `vehicle_id`, `service_date`, `direction`, `window_starts_at`, `window_ends_at`, `status`
- **Ocorrência datada**: distinguir a ida e o retorno, mesmo que usem o mesmo veículo e QR.

### `stops`, `line_stops` e/ou `geofences` (dependem de D01/D02)

- `stops`: `id`, `name`, `latitude`, `longitude`, `allowed_radius_m`, `active`
- `line_stops`: `line_id`, `stop_id`, `sequence`, `expected_time`, `window_before_min`, `window_after_min`
- `geofences` (se regiões/corredor): `id`, `line_id`, `type`, `geometry`, `status`, parâmetros

### `student_line_authorizations` / `student_stop_authorizations`

- Relacionar estudante a linhas habilitadas e pontos específicos se aplicável.
- Considerar validade temporal para remanejamentos autorizados.

### `attendances`

- `id`, `student_id`, `trip_id`, `vehicle_id`, `status`, `recorded_at`, `device_id`
- `geo_policy_version`, `geo_result`, `distance_meters` (quando aplicável), `accuracy_meters`, `verification_method`
- **UNIQUE (`student_id`, `trip_id`)** para barrar presença dupla numa viagem.
- Guardar coordenadas exatas somente se a finalidade, a base legal e a retenção foram justificadas; considerar armazenar somente resultado/distância aproximada quando suficiente.

### `attendance_attempts` / `audit_logs`

- `student_id`, `trip_id` (se identificável), `device_id`, `result`, `failure_code`, `received_at`
- Origem administrativa, ator, valor alterado (mínimo necessário), justificativa e referência da operação
- Restringir acesso e implementar retenção/expurgo; evitar expor coordenadas e chaves em logs gerais.

---

## 10. Contrato inicial da API (proposto)

Todos os endpoints devem exigir autenticação e autorização adequadas, exceto endpoints estritamente públicos de configuração que venham a ser necessários. Validar CSRF conforme o modelo de sessão/SPA usado atualmente pelo SIGTU e aplicar limitação de requisições.

| Método | Rota sugerida | Responsabilidade |
|---|---|---|
| `GET` | `/api/me/device` | Situação da credencial do estudante |
| `POST` | `/api/device-enrollments` | Solicitar primeira vinculação/troca |
| `POST` | `/api/admin/device-enrollments/{id}/approve` | Aprovação por operador autorizado |
| `POST` | `/api/device-enrollments/{id}/challenge` | Emitir desafio do cadastro |
| `POST` | `/api/device-enrollments/{id}/complete` | Validar posse e vincular chave pública |
| `POST` | `/api/attendance/resolve-qr` | Resolver QR e viagem candidata |
| `POST` | `/api/attendance/challenges` | Emitir desafio por tentativa/viagem |
| `POST` | `/api/attendance` | Confirmar assinatura e registrar presença |
| `GET` | `/api/me/attendances` | Histórico do estudante |
| `POST` | `/api/me/device-replacement-requests` | Solicitar troca/revogação |
| `GET` | `/api/admin/attendance-attempts` | Auditoria e revisão |

### Exemplo conceitual de confirmação (não contrato fechado)

```json
{
  "qr_token": "token-aleatorio-lido",
  "challenge_id": "uuid-do-desafio",
  "device_id": "uuid-da-credencial",
  "signature_base64url": "assinatura-criptografica",
  "location": {
    "latitude": -23.0,
    "longitude": -45.0,
    "accuracy_meters": 24.0,
    "timestamp_ms": 1790000000000
  }
}
```

A API **não deve confiar** no `device_id`, `trip_id`, horário nem na localização enviados pelo frontend sem realizar suas próprias verificações. O exemplo usa coordenadas fictícias.

### Códigos de erro funcionais para UX

- `DEVICE_NOT_ENROLLED`, `DEVICE_PENDING_APPROVAL`, `DEVICE_REVOKED`, `DEVICE_PROOF_INVALID`
- `QR_INVALID`, `NO_MATCHING_TRIP`, `LINE_NOT_AUTHORIZED`, `OUTSIDE_TIME_WINDOW`
- `LOCATION_PERMISSION_DENIED`, `LOCATION_UNAVAILABLE`, `LOCATION_INACCURATE`, `OUTSIDE_GEOFENCE`
- `CHALLENGE_EXPIRED`, `CHALLENGE_ALREADY_USED`, `ATTENDANCE_ALREADY_RECORDED`
- `MANUAL_REVIEW_REQUIRED`, `RATE_LIMITED`

Não expor detalhes que ajudem terceiros a enumerar contas ou chaves.

---

## 11. UX sugerida para Next.js

### Estudante

1. **Dashboard:** mostrar linha autorizada, próximas viagens previstas e status do dispositivo.
2. **Vinculação:** explicar por que a autorização é necessária, exibir solicitação/pendência e local de atendimento.
3. **Registrar presença:** botão para abrir câmera; solicitar autorização para câmera e localização de forma contextual.
4. **Validação em andamento:** feedback visual discreto para cada fase (QR → localização → confirmação).
5. **Sucesso:** indicar linha, sentido, data/hora e comprovante da presença (sem expor coordenadas exatas).
6. **Falha recuperável:** explicar ação possível: habilitar localização, tentar novamente ou pedir revisão.
7. **Meu dispositivo:** exibir status, data da autorização, última utilização e solicitação de substituição.
8. **Histórico:** exibir presenças, viagens e contestações.

### Gestão / administração

1. CRUD de **linhas, vans, atribuições, horários e datas excepcionais**.
2. CRUD de **pontos/geocercas**, raio e regras específicas — após definição do PO.
3. Aprovação/rejeição de dispositivos com registro de responsável e justificativa.
4. Painel de **tentativas negadas e solicitações de revisão**.
5. Alteração administrativa de viagens em caso de atraso/troca de van, com auditoria.
6. Indicadores de presença por linha, dia, viagem, motivos de bloqueio e qualidade de GPS.

### Acessibilidade e operação

- Mensagens claras, contraste adequado, suporte a leitores de tela e botões amplos no celular.
- Alternativa acessível se a câmera não funcionar, **sem dispensar** validações de veículo/viagem/dispositivo/localização sem justificativa administrativa.
- Não prometer que instalação PWA recupera chave após limpeza de dados do site.
- Sem conexão com a API, não confirmar presença localmente; permitir nova tentativa ou revisão.

---

## 12. Ameaças e riscos residuais

| Ameaça | Mitigação | Risco restante |
|---|---|---|
| Amigo sabe login e senha | Desafio assinado por credencial previamente aprovada | Phishing/conta comprometida durante cadastro |
| Dois estudantes no mesmo celular | Uma chave não pode ser usada em duas contas | **Outros navegadores/perfis geram outras chaves** |
| QR compartilhado por foto | Linha + viagem + horário + geocerca + credencial | Pessoa na área autorizada pode usá-lo |
| GPS simulado/falso | Precisão mínima, validação de regras, indicadores de anomalia | **Web não atesta GPS real** |
| Presença registrada de casa perto do ponto | Janelas mais estreitas e raio ajustado | Não há comprovação de embarque |
| Requisição reaproveitada | Nonce/desafio curto, único, consumido no backend | Dispositivo comprometido pode gerar novas assinaturas |
| Troca de dispositivo fraudulenta | Aprovação presencial/institucional e auditoria | Erro humano ou processo fraco |
| Duplicidade/race condition | `UNIQUE(student_id, trip_id)` + transação/lock | Tratar corretamente mensagens de conflito |
| QR falsificado/adesivo malicioso | Scanner restrito ao domínio, identificação visual e inspeção periódica | Adesivos podem ser trocados fisicamente |
| GPS de baixa precisão ou indisponível | Nova tentativa + análise administrativa | Falso bloqueio de aluno legítimo |

**Regra de comunicação:** nunca anunciar o recurso como antifraude infalível ou rastreamento real de vans. O objetivo é aumentar confiança e auditabilidade dentro das restrições municipais.

---

## 13. Privacidade, LGPD e governança

- Documentar finalidade, hipótese legal apropriada ao serviço público, necessidade e proporcionalidade da geolocalização.
- Solicitar localização **apenas quando o aluno pretende registrar a presença**, sem rastreamento contínuo por padrão.
- Informar claramente o uso da localização e a consequência de negar a permissão; oferecer fluxo de revisão acessível.
- Definir quem acessa tentativas, coordenadas (se armazenadas) e vínculos, usando RBAC e auditoria.
- Definir **prazo de retenção** e rotina de descarte dos dados de localização e logs.
- Guardar o **mínimo necessário**: para muitos relatórios, resultado da geocerca, identificador do ponto e hora são mais úteis que histórico de coordenadas exatas.
- Não armazenar biometria do estudante: eventual biometria via WebAuthn fica a cargo do dispositivo.
- Submeter desenho e política a responsáveis por proteção de dados e à gestão municipal antes de produção.

---

## 14. Roadmap de execução

### Fase 0 — Levantamento e decisões com PO

- [ ] Mapear oficialmente as **4 linhas e 4 vans**.
- [ ] Levantar **horários de ida/retorno**, dias de operação e regras de exceção.
- [ ] Identificar estudantes por linha e regras de remanejamento.
- [ ] Verificar se existem **pontos fixos** e, se sim, coletar suas coordenadas.
- [ ] Decidir entre pontos, regiões, corredor ou híbrido (**D01/D02**).
- [ ] Testar geocerca de **1.000 m** como hipótese, comparando alternativas menores.
- [ ] Definir janelas de presença e tolerância a atrasos.
- [ ] Definir aprovação institucional do primeiro dispositivo e de troca.
- [ ] Definir critérios LGPD e operação de revisão.
- [ ] Formalizar risco residual aceito pelo PO/gestão.

**Entrega:** especificação funcional aprovada e parâmetros de geocerca/tempo documentados.

### Fase 1 — Modelagem de dados e regras de viagem

- [ ] Revisar schema e autenticação atuais do SIGTU.
- [ ] Criar/adaptar migrations de linhas, veículos, atribuições, horários e ocorrências de viagem.
- [ ] Garantir suporte a **ida/retorno, datas, feriados e troca de van**.
- [ ] Implementar serviço `TripResolver` que determina a viagem a partir do QR e do horário de servidor.
- [ ] Implementar autorização estudante × linha/viagem.
- [ ] Criar testes de conflito, troca de veículo e viagens sobrepostas.

**Entrega:** API identifica inequivocamente a viagem candidata a partir do veículo, estudante e horário.

### Fase 2 — Vinculação criptográfica do dispositivo

- [ ] Implementar geração de chave ECDSA P-256 no Next.js.
- [ ] Persistir `CryptoKey` privada não exportável no IndexedDB.
- [ ] Criar fluxo de solicitação, aprovação e revogação.
- [ ] Implementar prova de posse e validação de assinatura no Laravel.
- [ ] Testar interoperabilidade de assinatura **P1363 ↔ DER**.
- [ ] Restringir a **uma credencial ativa por estudante** e uma chave pública única.
- [ ] Testar falha de armazenamento, troca de navegador, perda e revogação.
- [ ] Reforçar CSP, validações, rate limits e logs.

**Entrega:** aluno só consegue confirmar operação protegida com sua credencial autorizada.

### Fase 3 — QR fixo e fluxo de presença

- [ ] Criar identificador opaco aleatório por van.
- [ ] Gerar arte de QR para impressão/afixação.
- [ ] Implementar scanner via câmera no Next.js.
- [ ] Implementar endpoints de resolução e confirmação de presença.
- [ ] Implementar desafios de curta duração, com expiração e consumo único.
- [ ] Implementar validação definitiva de credencial, linha, viagem e horário.
- [ ] Garantir **uma presença por estudante × ocorrência de viagem**.
- [ ] Implementar tela de sucesso, erros e histórico.

**Entrega:** presença com QR + dispositivo + linha/viagem + horário, ainda sem liberar produção até validação geográfica.

### Fase 4 — Geocerca configurável

- [ ] Implementar abstração `GeoFencePolicy` independente do tipo de área.
- [ ] Caso pontos fixos: cadastro de `stops`, vínculos com linhas, raios e horários.
- [ ] Caso regiões/corredores: geometrias e consultas adequadas.
- [ ] Implementar coleta da localização no momento da tentativa.
- [ ] Validar latitude/longitude, precisão informada e política de geocerca.
- [ ] Implementar cálculo de distância via Haversine ou `ST_Distance_Sphere()`.
- [ ] Tornar raio e limites de precisão **configuráveis**, não hardcoded.
- [ ] Criar mensagens de correção e protocolo de análise de exceções.
- [ ] Testar situações reais de GPS e raio de **1 km versus valores menores**.

**Entrega:** validação integrada de horário + geocerca definida pelo PO.

### Fase 5 — Painel de gestão e auditoria

- [ ] Configurar horários, vans, linhas, pontos/geocercas e exceções.
- [ ] Aprovar/revogar dispositivos com justificativa.
- [ ] Criar painel de tentativas negadas e revisão de presença.
- [ ] Auditar trocas de veículo, sobreposições, alterações e acessos sensíveis.
- [ ] Criar relatórios por linha, viagem, data e motivo de falha.
- [ ] Aplicar política de retenção e acesso aos dados de localização.

**Entrega:** operação independente de motorista, com suporte administrativo.

### Fase 6 — Piloto, segurança e liberação

- [ ] Executar piloto controlado com alunos de pelo menos uma linha e expandir para as quatro.
- [ ] Testar aparelhos Android/iPhone, Chrome/Safari e modo PWA (quando aplicável).
- [ ] Testar conexão instável, GPS lento, localização negada, raio de borda, chuva/cobertura, horário de atraso.
- [ ] Testar leitura de QR fotografado, GPS simulado e tentativas em área ampla.
- [ ] Testar senha compartilhada, credencial de navegador diferente e troca de dispositivo.
- [ ] Validar que um celular físico com dois navegadores **continua sendo limitação conhecida**.
- [ ] Testar ataque de replay, expiração, duplicidade, concorrência e tentativas automatizadas.
- [ ] Definir indicadores de falso bloqueio e fraude suspeita para ajuste de raio/horário.
- [ ] Fazer revisão de segurança, privacidade e aceite formal de riscos residuais.
- [ ] Liberar produção em etapas, com procedimento claro de suporte e reversão.

**Entrega:** MVP em produção com controles documentados, parâmetros calibrados e risco residual aceito.

### Evoluções futuras (não obrigatórias para o MVP)

- [ ] WebAuthn com verificação do usuário como confirmação adicional.
- [ ] Regras antifraude por sinais de anomalia (sem bloquear automaticamente sem análise).
- [ ] Geocercas mais refinadas por ponto/linha, com calibração baseada no piloto.
- [ ] Ferramenta visual para desenhar regiões no painel administrativo.
- [ ] Considerar app nativo com integridade/atestação **somente se** a exigência de segurança futura justificar custo e manutenção.

---

## 15. Critérios de aceite mínimos

- [ ] Apenas estudante autenticado e **credencial ativa** registra presença.
- [ ] Senha correta sem chave autorizada **não é suficiente**.
- [ ] Leitura de QR aponta a van correta, com atribuição válida a uma viagem específica.
- [ ] Linha não autorizada **não gera presença**.
- [ ] Fora da janela de horário, não ocorre aprovação normal.
- [ ] Fora da geocerca definida, não ocorre aprovação normal.
- [ ] GPS indisponível ou impreciso gera mensagem útil e revisão; **não passa silenciosamente**.
- [ ] Uma tentativa não pode consumir o mesmo desafio duas vezes.
- [ ] Requisições concorrentes não geram presenças duplicadas.
- [ ] Revogação do dispositivo bloqueia novas presenças imediatamente.
- [ ] Administração pode tratar troca de van, atraso e exceção sem motorista.
- [ ] Nenhum serviço de mapas, telemetria ou equipamento pago é necessário para o fluxo essencial.
- [ ] Equipe reconhece e documenta que **QR fixo + GPS web não comprova embarque absoluto**.
- [ ] Parâmetros de geocerca (incluindo possível 1 km), precisão e horários foram **testados e aprovados** antes de habilitar estudantes em produção.

---

## 16. Ordem sugerida de implementação (resumo)

```text
LEVANTAMENTO PO
  → LINHAS / VANS / VIAGENS / HORÁRIOS
  → AUTORIZAÇÃO DE DISPOSITIVOS
  → QR FIXO POR VAN
  → DESAFIO E ASSINATURA
  → REGISTRO DE PRESENÇA
  → GEOCERCA CONFIGURÁVEL (PONTO OU REGIÃO)
  → AUDITORIA E EXCEÇÕES
  → PILOTO NAS 4 LINHAS
  → PRODUÇÃO
```

### Próxima reunião com PO — pauta objetiva

1. Confirmar existência de pontos fixos e a **lista de coordenadas** disponíveis.
2. Validar janelas de horário (por linha e, se possível, por ponto) e ida/retorno.
3. Definir política de **raio**, avaliando o **1 km proposto** versus raios menores.
4. Definir responsáveis e procedimento de **aprovação inicial do dispositivo** e trocas.
5. Definir quem decide revisões quando GPS/horário impedirem a marcação legítima.
6. Formalizar aceitação dos riscos de **QR estático fotografável** e **GPS falsificável**.

---

## 17. Referências técnicas

- MDN — Geolocation API (`getCurrentPosition`): https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
- MDN — Web Crypto API / CryptoKey: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- MDN — `CryptoKey.extractable`: https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey/extractable
- W3C — Web Authentication (WebAuthn): https://www.w3.org/TR/webauthn-3/
- MySQL 8 — `ST_Distance_Sphere()`: https://dev.mysql.com/doc/refman/8.0/en/spatial-convenience-functions.html
- Laravel — Cache e Atomic Locks (consultar versão efetivamente utilizada): https://laravel.com/docs/cache
- ANPD — Portal institucional e orientações de proteção de dados: https://www.gov.br/anpd/pt-br

---

**Status final deste documento:** pronto para discussão técnica e levantamento com o PO. **Ainda não foi escolhido** se a geolocalização será validada por **pontos fixos** ou **regiões**; a hipótese de **1 km** é um parâmetro a experimentar e pode ser reduzido de acordo com os resultados do piloto e o risco aceito.
