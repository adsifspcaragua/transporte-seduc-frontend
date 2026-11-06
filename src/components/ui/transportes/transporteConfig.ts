import type { TransporteResource } from "@/types/transporte";

export type TransporteField = {
  key: string;
  label: string;
  type?:
    | "number"
    | "date"
    | "time"
    | "datetime-local"
    | "textarea"
    | "boolean"
    | "days"
    | "ids";
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  step?: number;
  options?: string[];
  hint?: string;
  createOnly?: boolean;
  omitEmpty?: boolean;
};
export type TransporteConfig = {
  key: TransporteResource;
  label: string;
  view: string[];
  write?: string;
  remove?: string;
  create?: boolean;
  edit?: boolean;
  fields: TransporteField[];
  filters: TransporteField[];
  columns: { key: string; label: string }[];
  notice?: string;
};
const id = (key: string, label: string, required = true): TransporteField => ({
  key,
  label,
  type: "number",
  min: 1,
  step: 1,
  required,
});
const date = (
  key: string,
  label: string,
  required = false,
): TransporteField => ({ key, label, type: "date", required });
const text = (
  key: string,
  label: string,
  minLength = 3,
  maxLength = 255,
): TransporteField => ({ key, label, required: true, minLength, maxLength });
const reason = (
  key = "motivo",
  label = "Motivo",
  minLength = 5,
  maxLength = 255,
): TransporteField => ({
  ...text(key, label, minLength, maxLength),
  type: "textarea",
});
const direction: TransporteField = {
  key: "sentido",
  label: "Sentido",
  options: ["Ida", "Volta"],
  required: true,
};
const active: TransporteField = {
  key: "ativo",
  label: "Ativo",
  type: "boolean",
};
const windowFields: TransporteField[] = [
  {
    key: "janela_antes_min",
    label: "Janela antes (minutos)",
    type: "number",
    min: 0,
    max: 180,
    hint: "Em branco: padrão do servidor.",
  },
  {
    key: "janela_depois_min",
    label: "Janela depois (minutos)",
    type: "number",
    min: 0,
    max: 180,
    hint: "Em branco: padrão do servidor.",
  },
];
const period = [date("de", "De"), date("ate", "Até")];
const lineFilter = id("linha_id", "ID da linha", false);
const studentFilter = id("estudante_id", "ID do estudante", false);
const columns = (...pairs: [string, string][]) =>
  pairs.map(([key, label]) => ({ key, label }));

export const transporteConfigs: TransporteConfig[] = [
  {
    key: "veiculos",
    label: "Veículos",
    view: ["veiculos.view"],
    write: "veiculos.write",
    remove: "veiculos.delete",
    create: true,
    edit: true,
    fields: [
      text("identificacao", "Identificação", 2, 60),
      { key: "placa", label: "Placa", maxLength: 10 },
      active,
    ],
    filters: [],
    columns: columns(
      ["identificacao", "Identificação"],
      ["placa", "Placa"],
      ["ativo", "Ativo"],
      ["atribuicoes", "Linhas atendidas hoje"],
    ),
    notice:
      "O QR aparece somente ao cadastrar ou gerar um novo código. Gerar outro invalida o anterior imediatamente; reimprima o adesivo.",
  },
  {
    key: "atribuicoes",
    label: "Veículo × linha",
    view: ["veiculos.view"],
    write: "veiculos.write",
    remove: "veiculos.write",
    create: true,
    edit: true,
    fields: [
      { ...id("veiculo_id", "ID do veículo"), createOnly: true },
      { ...id("linha_id", "ID da linha"), createOnly: true },
      { ...date("inicio", "Início", true), createOnly: true },
      date("fim", "Fim"),
      { key: "motivo", label: "Motivo", type: "textarea", maxLength: 255 },
    ],
    filters: [
      lineFilter,
      id("veiculo_id", "ID do veículo", false),
      date("data", "Data de vigência"),
    ],
    columns: columns(
      ["veiculo.identificacao", "Veículo"],
      ["linha.name", "Linha"],
      ["inicio", "Início"],
      ["fim", "Fim"],
    ),
    notice:
      "Fim em branco mantém a atribuição sem prazo. Para trocar veículo, linha ou início, encerre esta atribuição e crie outra. Conflitos de horário precisam ser resolvidos nas viagens.",
  },
  {
    key: "horarios",
    label: "Horários",
    view: ["viagens.view"],
    write: "viagens.write",
    remove: "viagens.write",
    create: true,
    edit: true,
    fields: [
      id("linha_id", "ID da linha"),
      direction,
      {
        key: "dias_semana",
        label: "Dias da semana",
        type: "days",
        required: true,
      },
      { key: "horario_saida", label: "Saída", type: "time", required: true },
      ...windowFields,
      date("vigencia_inicio", "Vigência inicial"),
      date("vigencia_fim", "Vigência final"),
      active,
    ],
    filters: [lineFilter, { ...active, type: undefined, options: ["1", "0"] }],
    columns: columns(
      ["linha.name", "Linha"],
      ["sentido", "Sentido"],
      ["dias_semana", "Dias"],
      ["horario_saida", "Saída"],
    ),
    notice:
      "Alterações refazem viagens futuras sem presença e sem ajuste manual. Os horários usam o fuso da operação.",
  },
  {
    key: "viagens",
    label: "Viagens",
    view: ["viagens.view"],
    write: "viagens.write",
    edit: true,
    fields: [
      reason(),
      { ...id("veiculo_id", "ID do veículo (vazio: sem veículo)", false) },
      {
        key: "janela_inicio",
        label: "Início da janela (hora local)",
        type: "datetime-local",
        required: true,
      },
      {
        key: "janela_fim",
        label: "Fim da janela (hora local)",
        type: "datetime-local",
        required: true,
      },
      {
        key: "status",
        label: "Situação",
        options: ["Programada", "Cancelada"],
        required: true,
      },
    ],
    filters: [
      ...period,
      lineFilter,
      id("veiculo_id", "ID do veículo", false),
      { ...direction, required: false },
      {
        key: "status",
        label: "Situação",
        options: ["Programada", "Cancelada"],
      },
    ],
    columns: columns(
      ["data", "Data"],
      ["linha.name", "Linha"],
      ["sentido", "Sentido"],
      ["horario_saida", "Saída"],
      ["veiculo.identificacao", "Veículo"],
      ["status", "Situação"],
    ),
    notice:
      "Ajustar exige motivo e preserva o histórico. A geração é idempotente e aceita até 62 dias de diferença entre início e fim.",
  },
  {
    key: "dias",
    label: "Dias sem operação",
    view: ["viagens.view"],
    write: "viagens.write",
    remove: "viagens.write",
    create: true,
    fields: [
      date("data", "Data", true),
      { ...lineFilter, hint: "Em branco: todas as linhas." },
      reason("motivo", "Motivo", 3),
    ],
    filters: period,
    columns: columns(
      ["data", "Data"],
      ["linha.name", "Linha (vazio: todas)"],
      ["motivo", "Motivo"],
    ),
    notice:
      "Cadastrar cancela as viagens existentes do dia. Remover o dia sem operação exige reativar manualmente as viagens canceladas.",
  },
  {
    key: "pontos",
    label: "Pontos de embarque",
    view: ["geocercas.view"],
    write: "geocercas.write",
    remove: "geocercas.write",
    create: true,
    edit: true,
    fields: [
      text("nome", "Nome"),
      {
        key: "latitude",
        label: "Latitude",
        type: "number",
        required: true,
        min: -90,
        max: 90,
        step: 0.0000001,
      },
      {
        key: "longitude",
        label: "Longitude",
        type: "number",
        required: true,
        min: -180,
        max: 180,
        step: 0.0000001,
      },
      {
        key: "raio_metros",
        label: "Raio (metros)",
        type: "number",
        required: true,
        min: 10,
        hint: "Calibre em campo; o limite máximo é validado pelo servidor.",
      },
      active,
    ],
    filters: [],
    columns: columns(
      ["nome", "Nome"],
      ["latitude", "Latitude"],
      ["longitude", "Longitude"],
      ["raio_metros", "Raio (m)"],
      ["ativo", "Ativo"],
    ),
  },
  {
    key: "vinculos",
    label: "Ponto × linha",
    view: ["geocercas.view"],
    write: "geocercas.write",
    remove: "geocercas.write",
    create: true,
    edit: true,
    fields: [
      { ...id("linha_id", "ID da linha"), createOnly: true },
      { ...id("ponto_id", "ID do ponto"), createOnly: true },
      { ...direction, createOnly: true },
      { key: "ordem", label: "Ordem", type: "number", min: 1, max: 999 },
      { key: "horario_previsto", label: "Passagem prevista", type: "time" },
      ...windowFields,
    ],
    filters: [lineFilter, { ...direction, required: false }],
    columns: columns(
      ["linha.name", "Linha"],
      ["ponto.nome", "Ponto"],
      ["sentido", "Sentido"],
      ["ordem", "Ordem"],
      ["horario_previsto", "Passagem"],
    ),
    notice:
      "Sem ponto ativo para a linha e sentido, a presença automática não é aprovada. Sem passagem prevista, vale a janela da viagem.",
  },
  {
    key: "autorizacoes",
    label: "Autorizações de linha",
    view: ["estudantes.view"],
    write: "estudantes.write",
    remove: "estudantes.write",
    create: true,
    fields: [
      id("estudante_id", "ID do estudante"),
      id("linha_id", "ID da linha adicional"),
      date("inicio", "Início", true),
      date("fim", "Fim"),
      reason(),
    ],
    filters: [studentFilter, lineFilter, date("data", "Vigente em")],
    columns: columns(
      ["estudante.name", "Estudante"],
      ["linha.name", "Linha adicional"],
      ["inicio", "Início"],
      ["fim", "Fim"],
    ),
    notice:
      "A autorização soma uma linha ao cadastro do estudante durante a vigência. Fim em branco: sem prazo.",
  },
  {
    key: "solicitacoes",
    label: "Solicitações de dispositivo",
    view: ["dispositivos.view"],
    write: "dispositivos.analise",
    fields: [],
    filters: [
      studentFilter,
      {
        key: "status",
        label: "Situação",
        options: [
          "Pendente",
          "Aprovada",
          "Rejeitada",
          "Concluida",
          "Cancelada",
          "Expirada",
        ],
      },
      { key: "tipo", label: "Tipo", options: ["Vinculacao", "Troca"] },
    ],
    columns: columns(
      ["estudante.name", "Estudante"],
      ["tipo", "Tipo"],
      ["status", "Situação"],
      ["created_at", "Solicitada em"],
    ),
    notice:
      "Confira a identidade e registre o parecer. Depois da aprovação, o estudante deve concluir a vinculação no navegador dentro do prazo exibido.",
  },
  {
    key: "dispositivos",
    label: "Dispositivos",
    view: ["dispositivos.view"],
    write: "dispositivos.analise",
    fields: [],
    filters: [
      studentFilter,
      { key: "status", label: "Situação", options: ["Ativo", "Revogado"] },
    ],
    columns: columns(
      ["estudante.name", "Estudante"],
      ["rotulo", "Navegador"],
      ["status", "Situação"],
      ["ultimo_uso_em", "Último uso"],
    ),
    notice: "Revogar bloqueia imediatamente novas presenças deste navegador.",
  },
  {
    key: "presencas",
    label: "Presenças registradas",
    view: ["presencas.view"],
    write: "presencas.analise",
    fields: [],
    filters: [
      ...period,
      studentFilter,
      lineFilter,
      id("viagem_id", "ID da viagem", false),
      { key: "metodo", label: "Método", options: ["Dispositivo", "Manual"] },
    ],
    columns: columns(
      ["estudante.name", "Estudante"],
      ["viagem.linha.name", "Linha"],
      ["viagem.data", "Data da viagem"],
      ["metodo", "Método"],
      ["registrada_em", "Registrada em"],
    ),
  },
  {
    key: "tentativas",
    label: "Tentativas e revisões",
    view: ["presencas.view"],
    write: "presencas.analise",
    fields: [],
    filters: [
      ...period,
      studentFilter,
      lineFilter,
      {
        key: "resultado",
        label: "Resultado",
        options: ["Negada", "Em revisao", "Registrada"],
      },
      {
        key: "revisao_status",
        label: "Revisão",
        options: ["Pendente", "Aprovada", "Rejeitada"],
      },
      { key: "codigo", label: "Código do motivo" },
    ],
    columns: columns(
      ["estudante.name", "Estudante"],
      ["resultado", "Resultado"],
      ["mensagem", "Motivo"],
      ["revisao.status", "Revisão"],
      ["recebida_em", "Recebida em"],
    ),
  },
  {
    key: "auditoria",
    label: "Auditoria",
    view: ["auditoria.view"],
    fields: [],
    filters: [
      ...period,
      {
        key: "acao",
        label: "Prefixo da ação",
        maxLength: 60,
        hint: "Ex.: dispositivo. ou viagem.",
      },
      id("user_id", "ID do responsável", false),
    ],
    columns: columns(
      ["created_at", "Data"],
      ["user.name", "Responsável"],
      ["acao", "Ação"],
      ["auditavel_type", "Registro"],
      ["auditavel_id", "Identificador"],
    ),
  },
  {
    key: "roles",
    label: "Cargos",
    view: ["roles.view"],
    write: "roles.write",
    create: true,
    fields: [text("title", "Nome do cargo", 1, 100)],
    filters: [],
    columns: columns(["title", "Cargo"]),
    notice:
      "Consulte os cargos cadastrados ou cadastre um novo cargo. A edição de cargos e a configuração de permissões não estão disponíveis nesta tela.",
  },
  {
    key: "instituicoes",
    label: "Instituições",
    view: ["instituicoes.write", "instituicoes.delete"],
    write: "instituicoes.write",
    remove: "instituicoes.delete",
    create: true,
    edit: true,
    fields: [
      text("name", "Nome"),
      {
        key: "linhas_ids",
        label: "IDs das linhas",
        type: "ids",
        hint: "Separe os IDs por vírgula. Em branco remove os vínculos.",
      },
    ],
    filters: [],
    columns: columns(
      ["name", "Instituição"],
      ["linhas_ids", "Linhas vinculadas"],
    ),
    notice:
      "Consulte as instituições em páginas de até 15 registros. Use as ações de cada instituição para visualizar ou editar seus dados.",
  },
];

export const gerarViagensFields: TransporteField[] = [
  date("de", "De", true),
  date("ate", "Até", true),
  lineFilter,
];
export const presencaManualFields: TransporteField[] = [
  id("estudante_id", "ID do estudante"),
  id("viagem_id", "ID da viagem"),
  reason("justificativa", "Justificativa da exceção", 10, 1000),
];
export const parecerFields: TransporteField[] = [
  reason("parecer", "Parecer", 5, 1000),
];
export const motivoFields: TransporteField[] = [reason()];
export const revisaoFields: TransporteField[] = [
  {
    key: "decisao",
    label: "Decisão",
    options: ["Aprovada", "Rejeitada"],
    required: true,
  },
  ...parecerFields,
];
