"use client";

import {
  ChevronDown,
  CircleX,
  FileText,
  GraduationCap,
  IdCard,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/buttons";
import {
  CepInput,
  CpfInput,
  DateInput,
  Input,
  PhoneInput,
  Select,
  Textarea,
} from "@/components/form/inputs";
import {
  Modal,
  ModalSection,
  ModalSectionContent,
  ModalSectionHeader,
} from "@/components/modal";
import { inscricaoService } from "@/services/api/modules/inscricao";
import type { Estudante, UpdateEstudantePayload } from "@/types/estudante";
import type { Curso, Instituicao } from "@/types/inscricao";
import { cleanCep } from "@/utils/cep";
import { cn } from "@/utils/cn";
import { cleanCpf, isValidCpf } from "@/utils/cpf";
import { scheduleFocusFirstFieldError } from "@/utils/focus-first-field-error";
import { cleanPhone } from "@/utils/phone";

type StudentsEditModalProps = {
  error?: string;
  loading?: boolean;
  onClose: () => void;
  onSave: (payload: UpdateEstudantePayload) => Promise<void>;
  open: boolean;
  student: Estudante | null;
};

type EditStudentForm = {
  address: string;
  birth_date: string;
  cep: string;
  city: string;
  city_destination: string;
  complement: string;
  course: string;
  cpf: string;
  days_of_week: string[];
  email: string;
  expected_completion: string;
  father_name: string;
  has_scholarship: string;
  instituicao_id: string;
  mother_name: string;
  name: string;
  neighborhood: string;
  number: string;
  observation: string;
  phone: string;
  rg: string;
  scholarship_type: string;
  semester: string;
  shift: string;
  status: string;
  used_transport: string;
};

type FieldErrors = Partial<Record<keyof EditStudentForm, string>>;

type CollapsibleSectionProps = {
  children: ReactNode;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  subtitle: string;
  title: string;
};

type FormGroupProps = {
  children: ReactNode;
  title: string;
};

const EMPTY_FORM: EditStudentForm = {
  address: "",
  birth_date: "",
  cep: "",
  city: "",
  city_destination: "",
  complement: "",
  course: "",
  cpf: "",
  days_of_week: [],
  email: "",
  expected_completion: "",
  father_name: "",
  has_scholarship: "",
  instituicao_id: "",
  mother_name: "",
  name: "",
  neighborhood: "",
  number: "",
  observation: "",
  phone: "",
  rg: "",
  scholarship_type: "",
  semester: "",
  shift: "",
  status: "",
  used_transport: "",
};

const WEEKDAYS = [
  { label: "Seg", value: "1" },
  { label: "Ter", value: "2" },
  { label: "Qua", value: "3" },
  { label: "Qui", value: "4" },
  { label: "Sex", value: "5" },
  { label: "Sáb", value: "6" },
];

const STATUS_OPTIONS = [
  { label: "Lista de espera", value: "LISTA DE ESPERA" },
  { label: "Aprovado", value: "APROVADO" },
  { label: "Rejeitado", value: "REJEITADO" },
  { label: "Ativo", value: "ATIVO" },
  { label: "Inativo", value: "INATIVO" },
];

const SHIFT_OPTIONS = [
  { label: "Matutino", value: "1" },
  { label: "Noturno", value: "2" },
];

const SEMESTER_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  label: `${index + 1}º semestre`,
  value: String(index + 1),
}));

const SCHOLARSHIP_OPTIONS = [
  { label: "Bolsa integral", value: "Bolsa integral" },
  { label: "75%", value: "75%" },
  { label: "50%", value: "50%" },
  { label: "25%", value: "25%" },
];

const CITY_DESTINATION_OPTIONS = [
  { value: "Caraguatatuba", label: "Caraguatatuba" },
  { value: "São Sebastião", label: "São Sebastião" },
  { value: "Ubatuba", label: "Ubatuba" },
  { value: "Ilha Bela", label: "Ilha Bela" },
];

function normalizeBooleanAnswer(value: unknown) {
  if (value === null || value === undefined) return "";

  if (typeof value === "boolean") return value ? "true" : "false";

  if (typeof value === "number") {
    if (value === 1) return "true";
    if (value === 0) return "false";
  }

  if (typeof value === "string") {
    const normalizedValue = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

    if (["1", "true", "sim", "yes"].includes(normalizedValue)) {
      return "true";
    }

    if (["0", "false", "nao", "no"].includes(normalizedValue)) {
      return "false";
    }
  }

  return "";
}

function normalizeDayValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") return "";

  const normalizedValue = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const weekdayByLabel: Record<string, string> = {
    dom: "0",
    domingo: "0",
    seg: "1",
    segunda: "1",
    "segunda-feira": "1",
    ter: "2",
    terca: "2",
    "terca-feira": "2",
    qua: "3",
    quarta: "3",
    "quarta-feira": "3",
    qui: "4",
    quinta: "4",
    "quinta-feira": "4",
    sex: "5",
    sexta: "5",
    "sexta-feira": "5",
    sab: "6",
    sabado: "6",
  };

  return weekdayByLabel[normalizedValue] ?? normalizedValue;
}

function normalizeDaysOfWeek(value: Estudante["days_of_week"]) {
  if (!value) return [];

  if (typeof value === "string") {
    try {
      const parsedValue = JSON.parse(value);

      if (Array.isArray(parsedValue)) {
        return normalizeDaysOfWeek(parsedValue as Estudante["days_of_week"]);
      }
    } catch {
      return value
        .split(",")
        .map((day) => normalizeDayValue(day))
        .filter(Boolean);
    }
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((day) => {
      if (day && typeof day === "object") {
        return normalizeDayValue(day.value ?? day.day ?? day.id);
      }

      return normalizeDayValue(day);
    })
    .filter(Boolean);
}

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeStatusValue(status: string | null) {
  if (!status) return "";

  const normalizedStatus = status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

  if (
    normalizedStatus.includes("ESPERA") ||
    normalizedStatus.includes("PENDENTE") ||
    normalizedStatus.includes("ANALISE") ||
    normalizedStatus.includes("INCOMPLETO")
  )
    return "LISTA DE ESPERA";
  if (normalizedStatus.includes("APROV")) return "APROVADO";
  if (
    normalizedStatus.includes("REPROV") ||
    normalizedStatus.includes("REJEIT")
  )
    return "REJEITADO";
  if (normalizedStatus.includes("INATIVO")) return "INATIVO";
  if (normalizedStatus.includes("ATIVO")) return "ATIVO";

  return status;
}

function getStudentForm(student: Estudante | null): EditStudentForm {
  if (!student) return EMPTY_FORM;

  return {
    address: student.address ?? "",
    birth_date: student.birth_date ?? "",
    cep: student.cep ?? "",
    city: student.city ?? "",
    city_destination: student.city_destination ?? "",
    complement: student.complement ?? "",
    course: student.course ?? "",
    cpf: student.cpf ?? "",
    days_of_week: normalizeDaysOfWeek(student.days_of_week),
    email: student.email ?? "",
    expected_completion: student.expected_completion ?? "",
    father_name: student.father_name ?? "",
    has_scholarship: normalizeBooleanAnswer(student.has_scholarship),
    instituicao_id: student.instituicao_id
      ? String(student.instituicao_id)
      : "",
    mother_name: student.mother_name ?? "",
    name: student.name,
    neighborhood: student.neighborhood ?? "",
    number: student.number ?? "",
    observation: student.observation ?? "",
    phone: student.phone ?? "",
    rg: student.rg ?? "",
    scholarship_type: student.scholarship_type ?? "",
    semester: student.semester ?? "",
    shift: student.shift ? String(student.shift) : "",
    status: normalizeStatusValue(student.status),
    used_transport: normalizeBooleanAnswer(student.used_transport),
  };
}

function CollapsibleSection({
  children,
  icon,
  isOpen,
  onToggle,
  subtitle,
  title,
}: CollapsibleSectionProps) {
  return (
    <ModalSection className="border-brand-600/15 bg-white">
      <ModalSectionHeader className="p-0">
        <button
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-600/[0.03] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600"
          onClick={onToggle}
          type="button"
        >
          <span className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 [&>svg]:size-5">
              {icon}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-brand-700">
                {title}
              </span>
              <span className="mt-0.5 block text-sm font-medium text-content-muted">
                {subtitle}
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-brand-700 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </ModalSectionHeader>

      {isOpen && <ModalSectionContent>{children}</ModalSectionContent>}
    </ModalSection>
  );
}

function FormGroup({ children, title }: FormGroupProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-bold uppercase text-brand-600">{title}</h3>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>
      <div className="grid gap-4 md:grid-cols-12">{children}</div>
    </div>
  );
}

function SegmentedQuestion({
  error,
  label,
  onChange,
  required = false,
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  const hasError = Boolean(error);

  return (
    <div data-field-container={hasError ? "true" : undefined}>
      <span className="text-xs font-bold uppercase text-brand-600">
        {label}
        {required && <span className="ml-1 text-danger-600">*</span>}
      </span>
      <div
        className={cn(
          "mt-3 grid grid-cols-2 gap-1 rounded-lg border p-1",
          "border-transparent bg-slate-100",
        )}
      >
        {[
          { label: "Sim", value: "true" },
          { label: "Não", value: "false" },
        ].map((option) => {
          const selected = value === option.value;

          return (
            <button
              aria-pressed={selected}
              data-field-error={
                hasError && option.value === "true" ? "true" : undefined
              }
              className={cn(
                "h-11 cursor-pointer rounded-md text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2",
                selected
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-brand-700 hover:bg-white/70",
              )}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && (
        <span className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger-700">
          <CircleX className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}

export function StudentsEditModal({
  error = "",
  loading = false,
  onClose,
  onSave,
  open,
  student,
}: StudentsEditModalProps) {
  const [form, setForm] = useState<EditStudentForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [instituicoesError, setInstituicoesError] = useState("");
  const [instituicoesLoading, setInstituicoesLoading] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursosError, setCursosError] = useState("");
  const [cursosLoading, setCursosLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    documents: false,
    institutional: true,
    personal: true,
  });

  const studentName = student?.name ?? "estudante";

  const instituicaoOptions = useMemo(
    () =>
      instituicoes.map((instituicao) => ({
        label: instituicao.name,
        value: String(instituicao.id),
      })),
    [instituicoes],
  );

  const cursoOptions = useMemo(
    () =>
      cursos.map((curso) => ({
        label: curso.name,
        value: curso.name,
      })),
    [cursos],
  );

  useEffect(() => {
    if (!open) return;

    setForm(getStudentForm(student));
    setFieldErrors({});
    setOpenSections({
      documents: false,
      institutional: true,
      personal: true,
    });
  }, [open, student]);

  useEffect(() => {
    if (!open || instituicoes.length > 0) return;

    let ignore = false;

    async function loadInstituicoes() {
      try {
        setInstituicoesLoading(true);
        setInstituicoesError("");
        const nextInstituicoes = await inscricaoService.listInstituicoes();

        if (!ignore) {
          setInstituicoes(nextInstituicoes);
        }
      } catch {
        if (!ignore) {
          setInstituicoesError("Não foi possível carregar as instituições.");
        }
      } finally {
        if (!ignore) {
          setInstituicoesLoading(false);
        }
      }
    }

    void loadInstituicoes();

    return () => {
      ignore = true;
    };
  }, [instituicoes.length, open]);

  useEffect(() => {
    if (!open || cursos.length > 0) return;

    let ignore = false;

    async function loadCursos() {
      try {
        setCursosLoading(true);
        setCursosError("");
        const nextCursos = await inscricaoService.listCursos();

        if (!ignore) {
          setCursos(nextCursos);
        }
      } catch {
        if (!ignore) {
          setCursosError("Não foi possível carregar os cursos.");
        }
      } finally {
        if (!ignore) {
          setCursosLoading(false);
        }
      }
    }

    void loadCursos();

    return () => {
      ignore = true;
    };
  }, [cursos.length, open]);

  function setField(field: keyof EditStudentForm, value: string) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function toggleWeekday(day: string) {
    setFieldErrors((current) => ({ ...current, days_of_week: undefined }));
    setForm((current) => {
      const selected = current.days_of_week.includes(day);

      return {
        ...current,
        days_of_week: selected
          ? current.days_of_week.filter((currentDay) => currentDay !== day)
          : [...current.days_of_week, day],
      };
    });
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Informe o nome completo do estudante.";
    }

    if (!isValidEmail(form.email)) {
      nextErrors.email = "Informe um e-mail válido.";
    }

    if (!cleanCpf(form.cpf) || !isValidCpf(form.cpf)) {
      nextErrors.cpf = "Informe um CPF válido.";
    }

    if (!form.used_transport) {
      nextErrors.used_transport =
        "Informe se o estudante já utiliza transporte.";
    }

    if (!form.has_scholarship) {
      nextErrors.has_scholarship = "Informe se o estudante possui bolsa.";
    }

    if (form.has_scholarship === "true" && !form.scholarship_type) {
      nextErrors.scholarship_type = "Selecione o tipo da bolsa.";
    }

    if (!form.instituicao_id) {
      nextErrors.instituicao_id = "Selecione a instituição.";
    }

    if (!form.shift) {
      nextErrors.shift = "Selecione o turno.";
    }

    if (!form.city_destination) {
      nextErrors.city_destination = "Selecione a cidade de destino.";
    }

    if (!form.course) {
      nextErrors.course = "Selecione o curso.";
    }

    if (!form.semester) {
      nextErrors.semester = "Selecione o semestre.";
    }

    if (!form.expected_completion) {
      nextErrors.expected_completion = "Informe a previsão de conclusão.";
    }

    return nextErrors;
  }

  async function handleSave() {
    if (!student) return;

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setOpenSections((current) => ({
        ...current,
        institutional:
          current.institutional ||
          Boolean(
            nextErrors.instituicao_id ||
              nextErrors.shift ||
              nextErrors.city_destination ||
              nextErrors.course ||
              nextErrors.semester ||
              nextErrors.expected_completion ||
              nextErrors.used_transport ||
              nextErrors.has_scholarship ||
              nextErrors.scholarship_type,
          ),
        personal:
          current.personal ||
          Boolean(nextErrors.name || nextErrors.email || nextErrors.cpf),
      }));
      scheduleFocusFirstFieldError();
      return;
    }

    setFieldErrors({});

    const instituicaoId = numberOrUndefined(form.instituicao_id);
    const payload: UpdateEstudantePayload = {
      email: form.email.trim(),
      name: form.name.trim(),
      observation: form.observation.trim() || null,
    };

    if (form.address.trim()) payload.address = form.address.trim();
    if (form.birth_date) payload.birth_date = form.birth_date;
    if (cleanCep(form.cep)) payload.cep = cleanCep(form.cep);
    if (form.city.trim()) payload.city = form.city.trim();
    if (form.city_destination.trim()) {
      payload.city_destination = form.city_destination.trim();
    }
    if (form.complement.trim()) payload.complement = form.complement.trim();
    if (form.course.trim()) payload.course = form.course.trim();
    if (cleanCpf(form.cpf)) payload.cpf = cleanCpf(form.cpf);
    payload.days_of_week = form.days_of_week.map(Number);
    if (form.expected_completion) {
      payload.expected_completion = form.expected_completion;
    }
    if (form.father_name.trim()) payload.father_name = form.father_name.trim();
    if (cleanPhone(form.phone)) payload.phone = cleanPhone(form.phone);
    if (form.mother_name.trim()) payload.mother_name = form.mother_name.trim();
    if (form.neighborhood.trim())
      payload.neighborhood = form.neighborhood.trim();
    if (form.number.trim()) payload.number = form.number.trim();
    if (form.rg.trim()) payload.rg = form.rg.trim();
    if (form.semester.trim()) payload.semester = form.semester.trim();
    if (form.shift) payload.shift = Number(form.shift);
    if (form.status.trim()) payload.status = form.status.trim();
    if (form.used_transport) {
      payload.used_transport = form.used_transport === "true";
    }
    if (form.has_scholarship) {
      payload.has_scholarship = form.has_scholarship === "true";
    }
    payload.scholarship_type =
      form.has_scholarship === "true" ? form.scholarship_type || null : null;

    if (instituicaoId !== undefined) {
      payload.instituicao_id = instituicaoId;
    }

    await onSave(payload);
  }

  return (
    <Modal
      cancelLabel="Cancelar"
      className="max-w-5xl"
      contentClassName="space-y-4 bg-slate-50/80"
      onClose={onClose}
      onSave={handleSave}
      open={open}
      saveDisabled={loading}
      saveLabel="Salvar alterações"
      saveLoading={loading}
      title={`Editar ${studentName}`}
    >
      {error && (
        <div className="rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600">
          {error}
        </div>
      )}

      <CollapsibleSection
        icon={<IdCard />}
        isOpen={openSections.personal}
        onToggle={() => toggleSection("personal")}
        subtitle="Dados básicos, contato e endereço principal."
        title="Dados pessoais"
      >
        <div className="space-y-7">
          <FormGroup title="Identificação">
            <Input
              autoComplete="name"
              className="bg-white"
              containerClassName="md:col-span-6"
              error={fieldErrors.name}
              label="Nome completo"
              onChange={(event) => setField("name", event.target.value)}
              required
              value={form.name}
            />
            <DateInput
              autoComplete="bday"
              calendarAlign="right"
              className="rounded-lg bg-white"
              containerClassName="md:col-span-3"
              error={fieldErrors.birth_date}
              label="Data de nascimento"
              max={new Date().toISOString().slice(0, 10)}
              maxYear={new Date().getFullYear()}
              min="1900-01-01"
              minYear={1900}
              onChange={(event) => setField("birth_date", event.target.value)}
              value={form.birth_date}
              variant="white"
            />
            <Select
              className="bg-white"
              containerClassName="md:col-span-3"
              label="Status"
              onChange={(event) => setField("status", event.target.value)}
              options={STATUS_OPTIONS}
              placeholder="Selecione"
              value={form.status}
            />
            <CpfInput
              autoComplete="on"
              className="bg-white"
              containerClassName="md:col-span-6"
              error={fieldErrors.cpf}
              label="CPF"
              onChange={(event) => setField("cpf", event.target.value)}
              required
              value={form.cpf}
            />
            <Input
              autoComplete="on"
              className="bg-white"
              containerClassName="md:col-span-6"
              label="RG"
              onChange={(event) => setField("rg", event.target.value)}
              value={form.rg}
            />
          </FormGroup>

          <FormGroup title="Filiação">
            <Input
              autoComplete="name"
              className="bg-white"
              containerClassName="md:col-span-6"
              label="Nome da mãe"
              onChange={(event) => setField("mother_name", event.target.value)}
              value={form.mother_name}
            />
            <Input
              autoComplete="name"
              className="bg-white"
              containerClassName="md:col-span-6"
              label="Nome do pai"
              onChange={(event) => setField("father_name", event.target.value)}
              value={form.father_name}
            />
          </FormGroup>

          <FormGroup title="Endereço">
            <CepInput
              className="bg-white"
              containerClassName="md:col-span-3"
              label="CEP"
              onChange={(event) => setField("cep", event.target.value)}
              value={form.cep}
            />
            <Input
              autoComplete="address-level2"
              className="bg-white"
              containerClassName="md:col-span-4"
              label="Cidade"
              onChange={(event) => setField("city", event.target.value)}
              value={form.city}
            />
            <Input
              autoComplete="address-level3"
              className="bg-white"
              containerClassName="md:col-span-5"
              label="Bairro"
              onChange={(event) => setField("neighborhood", event.target.value)}
              value={form.neighborhood}
            />
            <Input
              autoComplete="address-line1"
              className="bg-white"
              containerClassName="md:col-span-5"
              label="Logradouro"
              onChange={(event) => setField("address", event.target.value)}
              value={form.address}
            />
            <Input
              autoComplete="address-line2"
              className="bg-white"
              containerClassName="md:col-span-2"
              label="Número"
              onChange={(event) => setField("number", event.target.value)}
              value={form.number}
            />
            <Input
              autoComplete="address-line3"
              className="bg-white"
              containerClassName="md:col-span-5"
              label="Complemento"
              onChange={(event) => setField("complement", event.target.value)}
              value={form.complement}
            />
          </FormGroup>

          <FormGroup title="Contato">
            <Input
              autoComplete="email"
              className="bg-white"
              containerClassName="md:col-span-6"
              error={fieldErrors.email}
              label="E-mail"
              onChange={(event) => setField("email", event.target.value)}
              required
              type="email"
              value={form.email}
            />
            <PhoneInput
              className="bg-white"
              containerClassName="md:col-span-6"
              label="Telefone"
              onChange={(event) => setField("phone", event.target.value)}
              value={form.phone}
            />
          </FormGroup>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        icon={<GraduationCap />}
        isOpen={openSections.institutional}
        onToggle={() => toggleSection("institutional")}
        subtitle="Vínculo institucional, linha e rotina de transporte."
        title="Dados institucionais"
      >
        <div className="space-y-7">
          <FormGroup title="Instituição e curso">
            <Select
              className="bg-white"
              containerClassName="md:col-span-6"
              disabled={instituicoesLoading || Boolean(instituicoesError)}
              error={fieldErrors.instituicao_id}
              hint={instituicoesError || undefined}
              label="Instituição"
              onChange={(event) =>
                setField("instituicao_id", event.target.value)
              }
              options={instituicaoOptions}
              placeholder={
                instituicoesLoading
                  ? "Carregando..."
                  : instituicoesError
                    ? "Instituições indisponíveis"
                    : "Selecione"
              }
              required
              value={form.instituicao_id}
            />
            <Select
              className="bg-white"
              containerClassName="md:col-span-2"
              error={fieldErrors.shift}
              label="Turno"
              onChange={(event) => setField("shift", event.target.value)}
              options={SHIFT_OPTIONS}
              placeholder="Selecione"
              required
              value={form.shift}
            />
            <Select
              className="bg-white"
              containerClassName="md:col-span-4"
              error={fieldErrors.city_destination}
              label="Cidade de destino"
              onChange={(event) =>
                setField("city_destination", event.target.value)
              }
              options={CITY_DESTINATION_OPTIONS}
              placeholder="Selecione"
              required
              value={form.city_destination}
            />
            <Select
              className="bg-white"
              containerClassName="md:col-span-6"
              disabled={cursosLoading || Boolean(cursosError)}
              error={fieldErrors.course}
              hint={cursosError || undefined}
              label="Curso"
              onChange={(event) => setField("course", event.target.value)}
              options={cursoOptions}
              placeholder={
                cursosLoading
                  ? "Carregando..."
                  : cursosError
                    ? "Cursos indisponíveis"
                    : "Selecione"
              }
              required
              value={form.course}
            />
            <Select
              className="bg-white"
              containerClassName="md:col-span-3"
              error={fieldErrors.semester}
              label="Semestre"
              onChange={(event) => setField("semester", event.target.value)}
              options={SEMESTER_OPTIONS}
              placeholder="Selecione"
              required
              value={form.semester}
            />
            <DateInput
              calendarAlign="right"
              className="rounded-lg bg-white"
              containerClassName="md:col-span-3"
              error={fieldErrors.expected_completion}
              label="Previsão de conclusão"
              min={new Date().toISOString().slice(0, 10)}
              minYear={new Date().getFullYear()}
              maxYear={new Date().getFullYear() + 20}
              onChange={(event) =>
                setField("expected_completion", event.target.value)
              }
              required
              value={form.expected_completion}
              variant="white"
            />
          </FormGroup>

          <FormGroup title="Transporte e bolsa">
            <div className="md:col-span-6">
              <SegmentedQuestion
                error={fieldErrors.used_transport}
                label="Já utiliza transporte?"
                onChange={(value) => setField("used_transport", value)}
                required
                value={form.used_transport}
              />
            </div>
            <div className="md:col-span-6">
              <SegmentedQuestion
                error={fieldErrors.has_scholarship}
                label="Possui bolsa?"
                onChange={(value) => {
                  setFieldErrors((current) => ({
                    ...current,
                    has_scholarship: undefined,
                    scholarship_type: undefined,
                  }));
                  setForm((current) => ({
                    ...current,
                    has_scholarship: value,
                    scholarship_type:
                      value === "false" ? "" : current.scholarship_type,
                  }));
                }}
                required
                value={form.has_scholarship}
              />
            </div>
            <div className="md:col-span-6">
              <span className="text-xs font-bold uppercase text-brand-600">
                Dias de uso do transporte
              </span>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {WEEKDAYS.map((day) => {
                  const selected = form.days_of_week.includes(day.value);

                  return (
                    <Button
                      aria-pressed={selected}
                      className={cn(
                        "w-full px-3",
                        selected &&
                          "border-brand-600 bg-brand-600 text-white hover:border-brand-600 hover:bg-brand-600 active:border-brand-600 active:bg-brand-600",
                      )}
                      key={day.value}
                      onClick={() => toggleWeekday(day.value)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {day.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-6">
              {form.has_scholarship === "true" ? (
                <div>
                  <span className="text-xs font-bold uppercase text-brand-600">
                    Selecione o tipo da bolsa
                    <span className="ml-1 text-danger-600">*</span>
                  </span>
                  <Select
                    aria-label="Tipo da bolsa"
                    className="mt-3 bg-white"
                    error={fieldErrors.scholarship_type}
                    onChange={(event) =>
                      setField("scholarship_type", event.target.value)
                    }
                    options={SCHOLARSHIP_OPTIONS}
                    placeholder="Tipo da bolsa"
                    required
                    value={form.scholarship_type}
                  />
                </div>
              ) : (
                <div aria-hidden="true" className="hidden md:block" />
              )}
            </div>
            <Textarea
              className="min-h-28 bg-white"
              containerClassName="md:col-span-12"
              label="Observação"
              onChange={(event) => setField("observation", event.target.value)}
              value={form.observation}
            />
          </FormGroup>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        icon={<FileText />}
        isOpen={openSections.documents}
        onToggle={() => toggleSection("documents")}
        subtitle="Resumo dos documentos vinculados a este cadastro."
        title="Documentos"
      >
        <div className="rounded-lg border border-dashed border-brand-600/25 bg-brand-100/35 px-4 py-4">
          <p className="text-sm font-semibold text-brand-700">
            Documentos da inscrição
          </p>
          <p className="mt-1 text-sm text-content-secondary">
            A listagem de estudantes atual não retorna os arquivos anexados. Use
            este bloco como referência para quando a API disponibilizar os
            documentos vinculados.
          </p>
        </div>
      </CollapsibleSection>
    </Modal>
  );
}
