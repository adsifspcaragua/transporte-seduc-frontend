"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FilePlus2,
  FileText,
  GraduationCap,
  Home,
  IdCard,
  Info,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import type { ChangeEvent, DragEvent, FocusEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/buttons";
import {
  CepInput,
  Checkbox,
  CpfInput,
  DateInput,
  Input,
  PhoneInput,
  Select,
} from "@/components/form/inputs";
import Register, {
  type RegisterStepStatus,
} from "@/components/ui/layout/RegisterLayout";
import { cepService } from "@/services/api/modules/cep";
import { inscricaoService } from "@/services/api/modules/inscricao";
import type {
  Curso,
  InscricaoInstituicaoPayload,
  InscricaoPayload,
  Instituicao,
} from "@/types/inscricao";
import { cleanCep, isValidCep } from "@/utils/cep";
import { cn } from "@/utils/cn";
import { cleanCpf, isValidCpf } from "@/utils/cpf";
import { cleanPhone, isValidPhone } from "@/utils/phone";

type StepIndex = 0 | 1 | 2 | 3 | 4;
type BinaryAnswer = "" | "true" | "false";

type RegistrationForm = {
  name: string;
  birth_date: string;
  mother_name: string;
  father_name: string;
  no_father: boolean;
  cpf: string;
  rg: string;
  cep: string;
  city: string;
  neighborhood: string;
  address: string;
  number: string;
  complement: string;
  email: string;
  phone: string;
  instituicao_id: string;
  course: string;
  semester: string;
  expected_completion: string;
  shift: string;
  city_destination: string;
  used_transport: BinaryAnswer;
  days_of_week: number[];
  has_scholarship: BinaryAnswer;
  scholarship_type: string;
  accepted_terms: boolean;
  accepted_terms_2: boolean;
};

type DocumentState = {
  id?: number;
  file?: File;
  fileName?: string;
  filePath?: string;
  status?: string;
  type?: string;
  uploading?: boolean;
  error?: string;
};

type RegistrationDocument = {
  key: string;
  label: string;
  description: string;
  type: string;
  required: boolean;
};

type FieldErrors = Partial<Record<keyof RegistrationForm, string>>;

const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024;
const REGISTRATION_DRAFT_STORAGE_KEY = "transporte-seduc:registration-draft";
const REGISTRATION_DRAFT_VERSION = 1;

function registrationFieldProps(field: keyof RegistrationForm) {
  return {
    id: `registration-${field.replace(/_/g, "-")}`,
    name: field,
  };
}

const REGISTRATION_DOCUMENTS = [
  {
    key: "foto",
    label: "Foto",
    description: "Foto recente do estudante.",
    type: "imagem",
    required: true,
  },
  {
    key: "identidade",
    label: "Documento de identidade",
    description: "Documento com foto, frente e verso.",
    type: "documento",
    required: true,
  },
  {
    key: "residencia",
    label: "Comprovante de residência",
    description: "Comprovante recente de endereço.",
    type: "documento",
    required: true,
  },
  {
    key: "historico",
    label: "Histórico escolar",
    description: "Histórico ou documento acadêmico equivalente.",
    type: "documento",
    required: true,
  },
  {
    key: "matricula",
    label: "Declaração de matrícula",
    description: "Declaração emitida pela instituição.",
    type: "documento",
    required: true,
  },
  {
    key: "declaracao",
    label: "Declaração complementar",
    description: "Declaração complementar exigida para a inscrição.",
    type: "documento",
    required: true,
  },
  {
    key: "cronograma",
    label: "Cronograma de aulas",
    description: "Cronograma ou grade semanal de aulas.",
    type: "documento",
    required: false,
  },
] satisfies RegistrationDocument[];

const REQUIRED_DOCUMENTS = REGISTRATION_DOCUMENTS.filter(
  (document) => document.required,
);

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
] as const;

const CITY_DESTINATION_OPTIONS = [
  { value: "Caraguatatuba", label: "Caraguatatuba" },
  { value: "São Sebastião", label: "São Sebastião" },
  { value: "Ubatuba", label: "Ubatuba" },
  { value: "Ilha Bela", label: "Ilha Bela" },
];

const initialForm: RegistrationForm = {
  name: "",
  birth_date: "",
  mother_name: "",
  father_name: "",
  no_father: false,
  cpf: "",
  rg: "",
  cep: "",
  city: "",
  neighborhood: "",
  address: "",
  number: "",
  complement: "",
  email: "",
  phone: "",
  instituicao_id: "",
  course: "",
  semester: "",
  expected_completion: "",
  shift: "",
  city_destination: "",
  used_transport: "",
  days_of_week: [],
  has_scholarship: "",
  scholarship_type: "",
  accepted_terms: false,
  accepted_terms_2: false,
};

type PersistedDocumentState = Omit<DocumentState, "file" | "uploading">;

type RegistrationDraft = {
  version: typeof REGISTRATION_DRAFT_VERSION;
  step: StepIndex;
  editingStep: StepIndex | null;
  form: RegistrationForm;
  inscricaoId: number | null;
  inscricaoInstituicaoId: number | null;
  documents: Record<string, PersistedDocumentState>;
};

function isStepIndex(value: unknown): value is StepIndex {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 4
  );
}

function getPersistableDocuments(documents: Record<string, DocumentState>) {
  return Object.fromEntries(
    Object.entries(documents).map(([key, document]) => [
      key,
      {
        id: document.id,
        fileName: document.fileName,
        filePath: document.filePath,
        status: document.status,
        type: document.type,
        error: document.error,
      },
    ]),
  ) as Record<string, PersistedDocumentState>;
}

function parseRegistrationDraft(
  value: string | null,
): RegistrationDraft | null {
  if (!value) return null;

  try {
    const draft = JSON.parse(value) as Partial<RegistrationDraft>;

    if (
      draft.version !== REGISTRATION_DRAFT_VERSION ||
      !isStepIndex(draft.step) ||
      (draft.editingStep !== null &&
        draft.editingStep !== undefined &&
        !isStepIndex(draft.editingStep)) ||
      !draft.form ||
      typeof draft.form !== "object"
    ) {
      return null;
    }

    return {
      version: REGISTRATION_DRAFT_VERSION,
      step: draft.step,
      editingStep: draft.editingStep ?? null,
      form: {
        ...initialForm,
        ...draft.form,
      },
      inscricaoId:
        typeof draft.inscricaoId === "number" ? draft.inscricaoId : null,
      inscricaoInstituicaoId:
        typeof draft.inscricaoInstituicaoId === "number"
          ? draft.inscricaoInstituicaoId
          : null,
      documents: draft.documents ?? {},
    };
  } catch {
    return null;
  }
}

function formatLocalIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function trim(value: string) {
  return value.trim();
}

function isFilled(value: string) {
  return trim(value).length > 0;
}

function hasMinLength(value: string, minLength: number) {
  return trim(value).length >= minLength;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPastDate(value: string, todayIso: string) {
  return Boolean(value) && value < todayIso;
}

function isValidFutureOrTodayDate(value: string, todayIso: string) {
  return Boolean(value) && value >= todayIso;
}

function getFieldErrors(form: RegistrationForm, todayIso: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!hasMinLength(form.name, 3)) {
    errors.name = "Informe o nome completo.";
  }

  if (!isValidPastDate(form.birth_date, todayIso)) {
    errors.birth_date = "Informe uma data de nascimento válida.";
  }

  if (!hasMinLength(form.mother_name, 3)) {
    errors.mother_name = "Informe o nome da mãe.";
  }

  if (!form.no_father && !hasMinLength(form.father_name, 3)) {
    errors.father_name = "Informe o nome do pai ou marque Nao consta.";
  }

  if (!isValidCpf(form.cpf)) {
    errors.cpf = "Informe um CPF válido.";
  }

  if (form.rg && (trim(form.rg).length < 8 || trim(form.rg).length > 11)) {
    errors.rg = "Informe um RG entre 8 e 11 caracteres.";
  }

  if (!isValidCep(form.cep)) {
    errors.cep = "Informe um CEP válido.";
  }

  if (!hasMinLength(form.city, 3)) {
    errors.city = "Informe a cidade.";
  }

  if (!hasMinLength(form.neighborhood, 3)) {
    errors.neighborhood = "Informe o bairro.";
  }

  if (!hasMinLength(form.address, 3)) {
    errors.address = "Informe o logradouro.";
  }

  if (!/^[1-9]\d*$/.test(trim(form.number))) {
    errors.number = "Informe um número válido.";
  }

  if (form.complement && !hasMinLength(form.complement, 3)) {
    errors.complement = "Informe ao menos 3 caracteres.";
  }

  if (!isValidEmail(form.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!isValidPhone(form.phone)) {
    errors.phone = "Informe um telefone celular válido.";
  }

  if (!form.instituicao_id) {
    errors.instituicao_id = "Selecione a instituição.";
  }

  if (!hasMinLength(form.course, 3)) {
    errors.course = "Selecione o curso.";
  }

  if (!form.semester) {
    errors.semester = "Selecione o semestre.";
  }

  if (!isValidFutureOrTodayDate(form.expected_completion, todayIso)) {
    errors.expected_completion = "Informe uma data.";
  }

  if (!form.shift) {
    errors.shift = "Selecione o turno.";
  }

  if (!form.city_destination) {
    errors.city_destination = "Selecione a cidade de destino.";
  }

  if (!form.used_transport) {
    errors.used_transport = "Informe se já utiliza transporte.";
  }

  if (!form.has_scholarship) {
    errors.has_scholarship = "Informe a situação da bolsa.";
  }

  if (form.has_scholarship === "true" && !form.scholarship_type) {
    errors.scholarship_type = "Selecione o tipo de bolsa.";
  }

  if (!form.accepted_terms) {
    errors.accepted_terms = "Aceite o termo de veracidade.";
  }

  if (!form.accepted_terms_2) {
    errors.accepted_terms_2 = "Aceite o termo de uso dos dados.";
  }

  return errors;
}

function hasAnyCivilData(form: RegistrationForm) {
  return [
    form.name,
    form.birth_date,
    form.mother_name,
    form.father_name,
    form.cpf,
    form.rg,
  ].some(isFilled);
}

function hasAnyAddressData(form: RegistrationForm) {
  return [
    form.cep,
    form.city,
    form.neighborhood,
    form.address,
    form.number,
    form.complement,
    form.email,
    form.phone,
  ].some(isFilled);
}

function hasAnyInstitutionalData(form: RegistrationForm) {
  return (
    [
      form.instituicao_id,
      form.course,
      form.semester,
      form.expected_completion,
      form.shift,
      form.city_destination,
      form.scholarship_type,
    ].some(isFilled) ||
    form.used_transport !== "" ||
    form.has_scholarship !== "" ||
    form.days_of_week.length > 0
  );
}

function getSectionStatus(
  form: RegistrationForm,
  documents: Record<string, DocumentState>,
  errors: FieldErrors,
): RegisterStepStatus[] {
  const civilFields: (keyof RegistrationForm)[] = [
    "name",
    "birth_date",
    "mother_name",
    "cpf",
  ];
  const addressFields: (keyof RegistrationForm)[] = [
    "cep",
    "city",
    "neighborhood",
    "address",
    "number",
    "email",
    "phone",
  ];
  const institutionalFields: (keyof RegistrationForm)[] = [
    "instituicao_id",
    "course",
    "semester",
    "expected_completion",
    "shift",
    "city_destination",
    "used_transport",
    "has_scholarship",
  ];

  if (form.has_scholarship === "true") {
    institutionalFields.push("scholarship_type");
  }

  const civilComplete =
    civilFields.every((field) => !errors[field]) &&
    (form.no_father || !errors.father_name);
  const addressComplete = addressFields.every((field) => !errors[field]);
  const institutionalComplete = institutionalFields.every(
    (field) => !errors[field],
  );
  const requiredDocumentKeys = REQUIRED_DOCUMENTS.map(
    (document) => document.key,
  );
  const uploadedDocumentCount = requiredDocumentKeys.filter(
    (key) => documents[key]?.id || documents[key]?.fileName,
  ).length;
  const documentsComplete =
    uploadedDocumentCount === requiredDocumentKeys.length;
  const reviewComplete =
    civilComplete &&
    addressComplete &&
    institutionalComplete &&
    documentsComplete &&
    form.accepted_terms &&
    form.accepted_terms_2;

  return [
    !hasAnyCivilData(form)
      ? "pending"
      : civilComplete
        ? "complete"
        : "incomplete",
    !hasAnyAddressData(form)
      ? "pending"
      : addressComplete
        ? "complete"
        : "incomplete",
    !hasAnyInstitutionalData(form)
      ? "pending"
      : institutionalComplete
        ? "complete"
        : "incomplete",
    uploadedDocumentCount === 0
      ? "pending"
      : documentsComplete
        ? "complete"
        : "incomplete",
    reviewComplete ? "complete" : "pending",
  ];
}

function getStatusCopy(status: RegisterStepStatus) {
  if (status === "complete") return "Todos os dados desta seção estão válidos.";
  if (status === "incomplete")
    return "Existem campos incompletos ou inválidos.";
  return "Nenhum dado preenchido nesta seção.";
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = error.response.data as {
      errors?: Record<string, string[]>;
      message?: string;
    };

    const firstFieldError = data.errors
      ? Object.values(data.errors).flat()[0]
      : undefined;

    if (data.errors?.cpf?.some((message) => message.includes("taken"))) {
      return "Já existe uma inscrição cadastrada para este CPF.";
    }

    return (
      firstFieldError ?? data.message ?? "Não foi possível validar os dados."
    );
  }

  if (error instanceof Error) return error.message;
  return "Não foi possível concluir a operação.";
}

function buildInscricaoPayload(form: RegistrationForm): InscricaoPayload {
  const payload: InscricaoPayload = {};

  if (hasMinLength(form.name, 3)) payload.name = trim(form.name);
  if (isValidCpf(form.cpf)) payload.cpf = cleanCpf(form.cpf);
  if (trim(form.rg).length >= 8 && trim(form.rg).length <= 11) {
    payload.rg = trim(form.rg);
  }
  if (form.birth_date) payload.birth_date = form.birth_date;
  if (hasMinLength(form.mother_name, 3)) {
    payload.mother_name = trim(form.mother_name);
  }
  if (!form.no_father && hasMinLength(form.father_name, 3)) {
    payload.father_name = trim(form.father_name);
  }
  if (isValidPhone(form.phone)) payload.phone = cleanPhone(form.phone);
  if (isValidEmail(form.email)) payload.email = trim(form.email);
  if (isValidCep(form.cep)) payload.cep = cleanCep(form.cep);
  if (hasMinLength(form.address, 3)) payload.address = trim(form.address);
  if (hasMinLength(form.neighborhood, 3)) {
    payload.neighborhood = trim(form.neighborhood);
  }
  if (hasMinLength(form.city, 3)) payload.city = trim(form.city);
  if (/^[1-9]\d*$/.test(trim(form.number))) {
    payload.number = Number(trim(form.number));
  }
  if (hasMinLength(form.complement, 3)) {
    payload.complement = trim(form.complement);
  }

  payload.accepted_terms = form.accepted_terms;
  payload.accepted_terms_2 = form.accepted_terms_2;

  return payload;
}

function buildInstituicaoPayload(
  form: RegistrationForm,
): InscricaoInstituicaoPayload {
  const payload: InscricaoInstituicaoPayload = {};

  if (form.instituicao_id) payload.instituicao_id = Number(form.instituicao_id);
  if (hasMinLength(form.course, 3)) payload.course = trim(form.course);
  if (form.semester) payload.semester = form.semester;
  if (form.expected_completion) {
    payload.expected_completion = form.expected_completion;
  }
  if (form.shift) payload.shift = Number(form.shift);
  if (hasMinLength(form.city_destination, 3)) {
    payload.city_destination = trim(form.city_destination);
  }
  if (form.used_transport !== "") {
    payload.used_transport = form.used_transport === "true";
  }
  if (form.days_of_week.length) payload.days_of_week = form.days_of_week;
  if (form.has_scholarship !== "") {
    payload.has_scholarship = form.has_scholarship === "true";
  }
  if (form.has_scholarship === "true" && form.scholarship_type) {
    payload.scholarship_type = form.scholarship_type;
  }

  return payload;
}

function fieldClassName() {
  return "rounded-lg";
}

export function RegisterWorkspace() {
  const [step, setStep] = useState<StepIndex>(0);
  const [editingStep, setEditingStep] = useState<StepIndex | null>(null);
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [inscricaoId, setInscricaoId] = useState<number | null>(null);
  const [inscricaoInstituicaoId, setInscricaoInstituicaoId] = useState<
    number | null
  >(null);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [instituicoesError, setInstituicoesError] = useState("");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursosError, setCursosError] = useState("");
  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(
    () => new Set(),
  );
  const [documents, setDocuments] = useState<Record<string, DocumentState>>({});
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentDraftKey, setDocumentDraftKey] = useState("");
  const [documentDraftFile, setDocumentDraftFile] = useState<File | null>(null);
  const [documentDraftError, setDocumentDraftError] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingDocumentCard, setIsDraggingDocumentCard] = useState(false);
  const [documentDropError, setDocumentDropError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isCepLookupLoading, setIsCepLookupLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const lastCepLookupRef = useRef("");
  const cepLookupRequestRef = useRef(0);
  const hasCepBlurredRef = useRef(false);

  const todayIso = useMemo(() => formatLocalIsoDate(new Date()), []);
  const fieldErrors = useMemo(
    () => getFieldErrors(form, todayIso),
    [form, todayIso],
  );
  const stepStatuses = useMemo(
    () => getSectionStatus(form, documents, fieldErrors),
    [documents, fieldErrors, form],
  );
  const selectedDocument = REGISTRATION_DOCUMENTS.find(
    (document) => document.key === documentDraftKey,
  );
  const isEditing = editingStep !== null && step === editingStep;

  useEffect(() => {
    const draft = parseRegistrationDraft(
      window.sessionStorage.getItem(REGISTRATION_DRAFT_STORAGE_KEY),
    );

    if (draft) {
      setStep(draft.step);
      setEditingStep(draft.editingStep);
      setForm(draft.form);
      setInscricaoId(draft.inscricaoId);
      setInscricaoInstituicaoId(draft.inscricaoInstituicaoId);
      setDocuments(draft.documents);

      const draftCep = cleanCep(draft.form.cep);

      if (
        isValidCep(draftCep) &&
        [draft.form.city, draft.form.neighborhood, draft.form.address].some(
          isFilled,
        )
      ) {
        lastCepLookupRef.current = draftCep;
      }
    }

    setDraftHydrated(true);
  }, []);

  useEffect(() => {
    return () => {
      window.setTimeout(() => {
        if (window.location.pathname !== "/registro") {
          window.sessionStorage.removeItem(REGISTRATION_DRAFT_STORAGE_KEY);
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;

    const draft: RegistrationDraft = {
      version: REGISTRATION_DRAFT_VERSION,
      step,
      editingStep,
      form,
      inscricaoId,
      inscricaoInstituicaoId,
      documents: getPersistableDocuments(documents),
    };

    window.sessionStorage.setItem(
      REGISTRATION_DRAFT_STORAGE_KEY,
      JSON.stringify(draft),
    );
  }, [
    documents,
    draftHydrated,
    editingStep,
    form,
    inscricaoId,
    inscricaoInstituicaoId,
    step,
  ]);

  const lookupCep = useCallback(async (value: string) => {
    const cepDigits = cleanCep(value);

    if (!isValidCep(cepDigits) || lastCepLookupRef.current === cepDigits) {
      return;
    }

    const requestId = cepLookupRequestRef.current + 1;

    cepLookupRequestRef.current = requestId;
    lastCepLookupRef.current = cepDigits;

    setIsCepLookupLoading(true);
    setFeedback(null);

    try {
      const address = await cepService.lookup(cepDigits);

      if (cepLookupRequestRef.current !== requestId) return;

      setForm((current) => {
        if (cleanCep(current.cep) !== cepDigits) return current;

        return {
          ...current,
          cep: address.cep,
          city: address.city || current.city,
          neighborhood: address.neighborhood || current.neighborhood,
          address: address.address || current.address,
          complement: address.complement || current.complement,
        };
      });
    } catch (error) {
      if (cepLookupRequestRef.current !== requestId) return;

      if (hasCepBlurredRef.current) {
        setFeedback({
          type: "error",
          message: getErrorMessage(error),
        });
      }
      lastCepLookupRef.current = "";
    } finally {
      if (cepLookupRequestRef.current === requestId) {
        setIsCepLookupLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInstituicoes() {
      try {
        const response = await inscricaoService.listInstituicoes();
        if (!isActive) return;

        setInstituicoes(response);
      } catch {
        if (!isActive) return;

        setInstituicoesError(
          "Não foi possível carregar as instituições. A API redirecionou a rota de instituições para login.",
        );
      }
    }

    void loadInstituicoes();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadCursos() {
      try {
        const response = await inscricaoService.listCursos();
        if (!isActive) return;

        setCursos(response);
      } catch {
        if (!isActive) return;

        setCursosError("Não foi possível carregar os cursos.");
      }
    }

    void loadCursos();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;

    const cepDigits = cleanCep(form.cep);

    if (cepDigits.length !== 8) {
      cepLookupRequestRef.current += 1;
      setIsCepLookupLoading(false);
      lastCepLookupRef.current = "";
      return;
    }

    void lookupCep(cepDigits);
  }, [draftHydrated, form.cep, lookupCep]);

  function handleCepChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    setField("cep", value);

    if (isValidCep(value)) {
      void lookupCep(value);
    }
  }

  function handleCepBlur(event: FocusEvent<HTMLInputElement>) {
    hasCepBlurredRef.current = true;

    if (isValidCep(event.target.value)) {
      void lookupCep(event.target.value);
    }
  }

  function setField<K extends keyof RegistrationForm>(
    field: K,
    value: RegistrationForm[K],
  ) {
    setFeedback(null);
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function markStepAttempted(stepIndex: number) {
    setAttemptedSteps((current) => {
      const next = new Set(current);
      next.add(stepIndex);
      return next;
    });
  }

  function shouldShowError(field: keyof RegistrationForm, section: StepIndex) {
    return attemptedSteps.has(section) || attemptedSteps.has(4)
      ? fieldErrors[field]
      : undefined;
  }

  function getStepFields(stepIndex: StepIndex): (keyof RegistrationForm)[] {
    if (stepIndex === 0) {
      const civilFields: (keyof RegistrationForm)[] = [
        "name",
        "birth_date",
        "mother_name",
        "cpf",
      ];

      if (!form.no_father) {
        civilFields.push("father_name");
      }

      return civilFields;
    }

    if (stepIndex === 1) {
      return [
        "cep",
        "city",
        "neighborhood",
        "address",
        "number",
        "email",
        "phone",
      ];
    }

    if (stepIndex === 2) {
      const institutionalFields: (keyof RegistrationForm)[] = [
        "instituicao_id",
        "course",
        "semester",
        "expected_completion",
        "shift",
        "city_destination",
        "used_transport",
        "has_scholarship",
      ];

      if (form.has_scholarship === "true") {
        institutionalFields.push("scholarship_type");
      }

      return institutionalFields;
    }

    if (stepIndex === 4) {
      return ["accepted_terms", "accepted_terms_2"];
    }

    return [];
  }

  function hasRequiredDocuments() {
    return REQUIRED_DOCUMENTS.every((document) => {
      const currentDocument = documents[document.key];

      return Boolean(currentDocument?.id || currentDocument?.fileName);
    });
  }

  function getStepValidationMessage(stepIndex: StepIndex) {
    if (stepIndex === 0) {
      return "Preencha os dados obrigatórios da identidade civil para avançar.";
    }

    if (stepIndex === 1) {
      return "Preencha os dados obrigatórios de endereço e contato para avançar.";
    }

    if (stepIndex === 2) {
      return "Preencha os dados institucionais obrigatórios para avançar.";
    }

    if (stepIndex === 3) {
      return "Anexe todos os documentos obrigatórios para avançar.";
    }

    return "Preencha os campos obrigatórios para continuar.";
  }

  function canLeaveCurrentStep() {
    if (step === 3) {
      return hasRequiredDocuments();
    }

    return getStepFields(step).every((field) => !fieldErrors[field]);
  }

  async function saveInscricaoBase() {
    const payload = buildInscricaoPayload(form);

    if (inscricaoId) {
      const response = await inscricaoService.updateInscricao(
        inscricaoId,
        payload,
      );
      return response.id;
    }

    const response = await inscricaoService.createInscricao(payload);
    setInscricaoId(response.id);
    return response.id;
  }

  async function saveInstituicaoData(targetInscricaoId?: number | null) {
    const id = targetInscricaoId ?? inscricaoId;
    if (!id || !hasAnyInstitutionalData(form)) return null;

    const payload = buildInstituicaoPayload(form);

    if (inscricaoInstituicaoId) {
      const response = await inscricaoService.updateInstituicao(
        id,
        inscricaoInstituicaoId,
        payload,
      );
      return response.id;
    }

    const response = await inscricaoService.createInstituicao(id, payload);
    setInscricaoInstituicaoId(response.id);
    return response.id;
  }

  async function submitDocuments(targetInscricaoId: number) {
    for (const document of REGISTRATION_DOCUMENTS) {
      const currentDocument = documents[document.key];

      if (!currentDocument?.file) continue;

      setDocuments((current) => ({
        ...current,
        [document.key]: {
          ...(current[document.key] ?? {}),
          uploading: true,
          error: undefined,
        },
      }));

      try {
        const uploadedDocument = await inscricaoService.uploadDocumento(
          targetInscricaoId,
          {
            name: document.key,
            type: currentDocument.type ?? document.type,
            file: currentDocument.file,
            documentoId: currentDocument.id,
          },
        );

        setDocuments((current) => ({
          ...current,
          [document.key]: {
            ...(current[document.key] ?? {}),
            id: uploadedDocument.id,
            fileName: currentDocument.fileName ?? currentDocument.file?.name,
            filePath: uploadedDocument.file_path,
            status: uploadedDocument.status,
            uploading: false,
            error: undefined,
          },
        }));
      } catch (error) {
        const message = getErrorMessage(error);

        setDocuments((current) => ({
          ...current,
          [document.key]: {
            ...(current[document.key] ?? {}),
            uploading: false,
            error: message,
          },
        }));

        throw error;
      }
    }
  }

  function handleNext() {
    markStepAttempted(step);
    setFeedback(null);

    if (!canLeaveCurrentStep()) {
      setFeedback({
        type: "error",
        message: getStepValidationMessage(step),
      });
      return;
    }

    if (isEditing) {
      setEditingStep(null);
      setStep(4);
      return;
    }

    setStep((current) => Math.min(current + 1, 4) as StepIndex);
  }

  function handlePrevious() {
    setFeedback(null);

    if (isEditing) {
      setEditingStep(null);
      setStep(4);
      return;
    }

    setStep((current) => Math.max(current - 1, 0) as StepIndex);
  }

  async function handleConfirm() {
    setAttemptedSteps(new Set([0, 1, 2, 3, 4]));
    setSaving(true);
    setFeedback(null);

    try {
      const latestErrors = getFieldErrors(form, todayIso);
      const latestStatuses = getSectionStatus(form, documents, latestErrors);
      const hasIncompleteSection = latestStatuses
        .slice(0, 4)
        .some((status) => status !== "complete");

      if (
        hasIncompleteSection ||
        latestErrors.accepted_terms ||
        latestErrors.accepted_terms_2
      ) {
        setFeedback({
          type: "error",
          message:
            "Revise as seções incompletas e aceite os termos antes de enviar.",
        });
        return;
      }

      const id = await saveInscricaoBase();
      await saveInstituicaoData(id);
      await submitDocuments(id);

      setFeedback({
        type: "success",
        message: "Cadastro enviado para análise com sucesso.",
      });
      window.sessionStorage.removeItem(REGISTRATION_DRAFT_STORAGE_KEY);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  }

  function toggleWeekday(day: number) {
    setForm((current) => {
      const exists = current.days_of_week.includes(day);
      return {
        ...current,
        days_of_week: exists
          ? current.days_of_week.filter((item) => item !== day)
          : [...current.days_of_week, day].sort(
              (first, second) => first - second,
            ),
      };
    });
  }

  function openDocumentModal(documentKey = "") {
    setDocumentDraftKey(documentKey);
    setDocumentDraftFile(null);
    setDocumentDraftError("");
    setDocumentDropError("");
    setDocumentModalOpen(true);
  }

  function closeDocumentModal() {
    setDocumentModalOpen(false);
    setDocumentDraftKey("");
    setDocumentDraftFile(null);
    setDocumentDraftError("");
    setIsDraggingFile(false);
  }

  function setDraftFile(file?: File) {
    if (!file) return false;

    if (file.size > MAX_DOCUMENT_SIZE) {
      setDocumentDraftFile(null);
      setDocumentDraftError("O arquivo deve ter no maximo 2MB.");
      return false;
    }

    setDocumentDropError("");
    setDocumentDraftError("");
    setDocumentDraftFile(file);
    return true;
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    setDraftFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleFileDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    setDraftFile(event.dataTransfer.files?.[0]);
  }

  function hasDraggedFiles(event: DragEvent<HTMLElement>) {
    return Array.from(event.dataTransfer.types).includes("Files");
  }

  function handleDocumentCardDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return;

    event.preventDefault();
    setIsDraggingDocumentCard(true);
  }

  function handleDocumentCardDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingDocumentCard(false);
  }

  function handleDocumentCardDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingDocumentCard(false);

    const file = event.dataTransfer.files?.[0];
    setDocumentDropError("");
    setDocumentDraftKey("");

    if (!file) return;

    if (file.size > MAX_DOCUMENT_SIZE) {
      setDocumentDropError("O arquivo deve ter no maximo 2MB.");
      return;
    }

    setDocumentModalOpen(true);
    setDraftFile(file);
  }

  function handleDocumentUpload() {
    setDocumentDraftError("");

    if (!selectedDocument) {
      setDocumentDraftError("Selecione o tipo do documento.");
      return;
    }

    if (!documentDraftFile) {
      setDocumentDraftError("Selecione o arquivo para envio.");
      return;
    }

    markStepAttempted(3);
    setDocuments((current) => ({
      ...current,
      [selectedDocument.key]: {
        ...(current[selectedDocument.key] ?? {}),
        file: documentDraftFile,
        fileName: documentDraftFile.name,
        type: selectedDocument.type,
        status: "Pendente",
        uploading: false,
        error: undefined,
      },
    }));
    closeDocumentModal();
  }

  function removeLocalDocument(documentKey: string) {
    setDocuments((current) => {
      const next = { ...current };
      delete next[documentKey];
      return next;
    });
  }

  function renderSectionTitle(
    icon: ReactNode,
    title: string,
    subtitle?: string,
  ) {
    return (
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-brand-700">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  function renderCivilStep() {
    return (
      <div className="space-y-8">
        <section>
          {renderSectionTitle(
            <IdCard className="size-5" />,
            "Dados pessoais",
            "Comece pelos dados básicos do estudante.",
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              variant="white"
              label="Nome completo"
              required
              {...registrationFieldProps("name")}
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              error={shouldShowError("name", 0)}
              className={fieldClassName()}
              autoComplete="name"
            />

            <DateInput
              variant="white"
              label="Data de nascimento"
              required
              min="1900-01-01"
              max={todayIso}
              minYear={1900}
              maxYear={new Date().getFullYear()}
              {...registrationFieldProps("birth_date")}
              value={form.birth_date}
              onChange={(event) => setField("birth_date", event.target.value)}
              error={shouldShowError("birth_date", 0)}
              className={fieldClassName()}
              autoComplete="bday"
            />
          </div>
        </section>

        <Divider />

        <section>
          {renderSectionTitle(
            <UsersRound className="size-5" />,
            "Filiação",
            "Informe os responsáveis que constam na documentação.",
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              variant="white"
              label="Nome da mãe"
              required
              {...registrationFieldProps("mother_name")}
              value={form.mother_name}
              onChange={(event) => setField("mother_name", event.target.value)}
              error={shouldShowError("mother_name", 0)}
              className={fieldClassName()}
              autoComplete="off"
            />

            <Input
              variant="white"
              label="Nome do pai"
              {...registrationFieldProps("father_name")}
              value={form.father_name}
              disabled={form.no_father}
              onChange={(event) => setField("father_name", event.target.value)}
              error={shouldShowError("father_name", 0)}
              className={cn(
                fieldClassName(),
                form.no_father && "cursor-not-allowed opacity-60",
              )}
              autoComplete="off"
            />

            <Checkbox
              variant="white"
              label="Não consta"
              {...registrationFieldProps("no_father")}
              checked={form.no_father}
              containerClassName="md:col-start-2"
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  no_father: event.target.checked,
                  father_name: event.target.checked ? "" : current.father_name,
                }));
              }}
            />
          </div>
        </section>

        <Divider />

        <section>
          {renderSectionTitle(
            <FileText className="size-5" />,
            "Documento de identificação",
            "O CPF é obrigatório para identificar o estudante.",
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <CpfInput
              variant="white"
              label="CPF"
              required
              {...registrationFieldProps("cpf")}
              value={form.cpf}
              onChange={(event) => setField("cpf", event.target.value)}
              error={shouldShowError("cpf", 0)}
              className={fieldClassName()}
            />

            <Input
              variant="white"
              label="RG"
              {...registrationFieldProps("rg")}
              value={form.rg}
              onChange={(event) => setField("rg", event.target.value)}
              error={shouldShowError("rg", 0)}
              className={fieldClassName()}
              autoComplete="off"
            />
          </div>
        </section>
      </div>
    );
  }

  function renderAddressStep() {
    return (
      <div className="space-y-8">
        <section>
          {renderSectionTitle(
            <MapPin className="size-5" />,
            "Endereço",
            "O CEP consulta o ViaCEP automaticamente ao completar 8 digitos.",
          )}

          <div className="grid gap-4 md:grid-cols-12">
            <CepInput
              variant="white"
              label="CEP"
              required
              {...registrationFieldProps("cep")}
              value={form.cep}
              onChange={handleCepChange}
              onBlur={handleCepBlur}
              error={shouldShowError("cep", 1)}
              className={fieldClassName()}
              containerClassName="md:col-span-3"
              aria-busy={isCepLookupLoading}
              rightElement={
                isCepLookupLoading ? (
                  <output
                    aria-label="Consultando CEP"
                    className="flex size-5 items-center justify-center"
                  >
                    <span
                      aria-hidden="true"
                      className="size-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"
                    />
                  </output>
                ) : null
              }
            />

            <Input
              variant="white"
              label="Cidade"
              required
              {...registrationFieldProps("city")}
              value={form.city}
              onChange={(event) => setField("city", event.target.value)}
              error={shouldShowError("city", 1)}
              className={fieldClassName()}
              containerClassName="md:col-span-4"
              autoComplete="address-level2"
            />

            <Input
              variant="white"
              label="Bairro"
              required
              {...registrationFieldProps("neighborhood")}
              value={form.neighborhood}
              onChange={(event) => setField("neighborhood", event.target.value)}
              error={shouldShowError("neighborhood", 1)}
              className={fieldClassName()}
              containerClassName="md:col-span-5"
              autoComplete="address-level3"
            />

            <Input
              variant="white"
              label="Logradouro"
              required
              {...registrationFieldProps("address")}
              value={form.address}
              onChange={(event) => setField("address", event.target.value)}
              error={shouldShowError("address", 1)}
              className={fieldClassName()}
              containerClassName="md:col-span-4"
              autoComplete="address-line1"
            />

            <Input
              variant="white"
              label="Número"
              required
              inputMode="numeric"
              {...registrationFieldProps("number")}
              value={form.number}
              onChange={(event) => setField("number", event.target.value)}
              error={shouldShowError("number", 1)}
              className={fieldClassName()}
              containerClassName="md:col-span-2"
              autoComplete="address-line2"
            />

            <Input
              variant="white"
              label="Complemento"
              {...registrationFieldProps("complement")}
              value={form.complement}
              onChange={(event) => setField("complement", event.target.value)}
              error={shouldShowError("complement", 1)}
              className={fieldClassName()}
              containerClassName="md:col-span-6"
              autoComplete="address-line3"
            />
          </div>
        </section>

        <Divider />

        <section>
          {renderSectionTitle(
            <Phone className="size-5" />,
            "Contato",
            "Use um telefone e e-mail acessíveis para retorno da análise.",
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              variant="white"
              label="E-mail"
              required
              type="email"
              {...registrationFieldProps("email")}
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              error={shouldShowError("email", 1)}
              className={fieldClassName()}
              autoComplete="email"
            />

            <PhoneInput
              variant="white"
              label="Telefone"
              required
              {...registrationFieldProps("phone")}
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
              error={shouldShowError("phone", 1)}
              className={fieldClassName()}
            />
          </div>
        </section>
      </div>
    );
  }

  function renderInstitutionalStep() {
    const instituicaoOptions = instituicoes.map((instituicao) => ({
      value: String(instituicao.id),
      label: instituicao.name,
    }));
    const cursoOptions = cursos.map((curso) => ({
      value: curso.name,
      label: curso.name,
    }));

    return (
      <div className="space-y-8">
        <section>
          {renderSectionTitle(
            <GraduationCap className="size-5" />,
            "Dados institucionais",
            "Dados acadêmicos vinculados à inscrição.",
          )}

          <div className="grid gap-4 md:grid-cols-12">
            <Select
              variant="white"
              label="Instituição"
              required
              {...registrationFieldProps("instituicao_id")}
              value={form.instituicao_id}
              onChange={(event) =>
                setField("instituicao_id", event.target.value)
              }
              error={shouldShowError("instituicao_id", 2)}
              options={instituicaoOptions}
              placeholder={
                instituicoesError ? "Instituições indisponíveis" : "Selecione"
              }
              disabled={Boolean(instituicoesError)}
              className={fieldClassName()}
              containerClassName="md:col-span-6"
            />

            <Select
              variant="white"
              label="Turno"
              required
              {...registrationFieldProps("shift")}
              value={form.shift}
              onChange={(event) => setField("shift", event.target.value)}
              error={shouldShowError("shift", 2)}
              options={[
                { value: "1", label: "Matutino" },
                { value: "2", label: "Noturno" },
              ]}
              className={fieldClassName()}
              containerClassName="md:col-span-2"
            />

            <Select
              variant="white"
              label="Cidade de destino"
              required
              {...registrationFieldProps("city_destination")}
              value={form.city_destination}
              onChange={(event) =>
                setField("city_destination", event.target.value)
              }
              error={shouldShowError("city_destination", 2)}
              options={CITY_DESTINATION_OPTIONS}
              placeholder="Selecione"
              className={fieldClassName()}
              containerClassName="md:col-span-4"
            />

            <Select
              variant="white"
              label="Curso"
              required
              {...registrationFieldProps("course")}
              value={form.course}
              onChange={(event) => setField("course", event.target.value)}
              error={shouldShowError("course", 2)}
              options={cursoOptions}
              placeholder={cursosError ? "Cursos indisponíveis" : "Selecione"}
              disabled={Boolean(cursosError)}
              className={fieldClassName()}
              containerClassName="md:col-span-6"
            />

            <Select
              variant="white"
              label="Semestre"
              required
              {...registrationFieldProps("semester")}
              value={form.semester}
              onChange={(event) => setField("semester", event.target.value)}
              error={shouldShowError("semester", 2)}
              options={Array.from({ length: 12 }, (_, index) => ({
                value: String(index + 1),
                label: `${index + 1}º semestre`,
              }))}
              className={fieldClassName()}
              containerClassName="md:col-span-3"
            />

            <DateInput
              variant="white"
              label="Previsão de conclusão"
              required
              min={todayIso}
              minYear={new Date().getFullYear()}
              maxYear={new Date().getFullYear() + 20}
              {...registrationFieldProps("expected_completion")}
              value={form.expected_completion}
              onChange={(event) =>
                setField("expected_completion", event.target.value)
              }
              error={shouldShowError("expected_completion", 2)}
              className={fieldClassName()}
              containerClassName="md:col-span-3"
              autoComplete="off"
            />
          </div>

          {instituicoesError && (
            <InlineNotice tone="error" className="mt-4">
              {instituicoesError}
            </InlineNotice>
          )}

          {cursosError && (
            <InlineNotice tone="error" className="mt-4">
              {cursosError}
            </InlineNotice>
          )}
        </section>

        <Divider />

        <section>
          {renderSectionTitle(
            <Building2 className="size-5" />,
            "Transporte e bolsa",
            "Esses dados ajudam a classificar a solicitação.",
          )}

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <SegmentedQuestion
                label="Já utiliza transporte?"
                required
                value={form.used_transport}
                error={shouldShowError("used_transport", 2)}
                onChange={(value) => setField("used_transport", value)}
              />
            </div>

            <div className="lg:col-span-6">
              <SegmentedQuestion
                label="Possui bolsa?"
                required
                value={form.has_scholarship}
                error={shouldShowError("has_scholarship", 2)}
                onChange={(value) => {
                  setForm((current) => ({
                    ...current,
                    has_scholarship: value,
                    scholarship_type:
                      value === "false" ? "" : current.scholarship_type,
                  }));
                }}
              />
            </div>

            <div className="lg:col-span-6">
              <span className="text-xs font-bold uppercase text-brand-600">
                Dias de uso do transporte
              </span>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {WEEKDAYS.map((day) => {
                  const selected = form.days_of_week.includes(day.value);

                  return (
                    <Button
                      key={day.value}
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-pressed={selected}
                      onClick={() => toggleWeekday(day.value)}
                      className={cn(
                        "w-full px-3",
                        selected &&
                          "border-brand-600 bg-brand-600 text-white hover:border-brand-600 hover:bg-brand-600 active:border-brand-600 active:bg-brand-600",
                      )}
                    >
                      {day.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6">
              {form.has_scholarship === "true" ? (
                <div>
                  <span className="text-xs font-bold uppercase text-brand-600">
                    Selecione o tipo da bolsa
                  </span>
                  <Select
                    variant="white"
                    label="Tipo da bolsa"
                    required
                    {...registrationFieldProps("scholarship_type")}
                    value={form.scholarship_type}
                    onChange={(event) =>
                      setField("scholarship_type", event.target.value)
                    }
                    error={shouldShowError("scholarship_type", 2)}
                    options={[
                      { value: "Bolsa integral", label: "Bolsa integral" },
                      { value: "75%", label: "75%" },
                      { value: "50%", label: "50%" },
                      { value: "25%", label: "25%" },
                    ]}
                    className={fieldClassName()}
                    containerClassName="mt-3"
                  />
                </div>
              ) : (
                <div aria-hidden="true" className="hidden lg:block" />
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderDocumentsStep() {
    const uploadedCount = REQUIRED_DOCUMENTS.filter(
      (document) =>
        documents[document.key]?.id || documents[document.key]?.fileName,
    ).length;

    return (
      <div>
        {renderSectionTitle(
          <FilePlus2 className="size-5" />,
          "Envio de documentos",
          "Anexe os documentos obrigatorios para validar o cadastro.",
        )}

        <section
          aria-label="Area de upload dos documentos"
          onDragOver={handleDocumentCardDragOver}
          onDragLeave={handleDocumentCardDragLeave}
          onDrop={handleDocumentCardDrop}
          className="relative mt-6 overflow-hidden rounded-lg border border-brand-100 bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-white px-5 py-4">
            <div>
              <h3 className="font-bold text-brand-700">Documentos</h3>
              <p className="text-sm text-slate-500">
                {uploadedCount} de {REQUIRED_DOCUMENTS.length} obrigatórios
                anexados
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                fullWidth={false}
                variant="primary"
                size="sm"
                leftIcon={<Upload className="size-4" />}
                onClick={() => openDocumentModal()}
              >
                Anexar documento
              </Button>
            </div>
          </div>

          <div className="divide-y divide-brand-100">
            {REGISTRATION_DOCUMENTS.map((document) => {
              const currentDocument = documents[document.key];
              const isUploaded = Boolean(
                currentDocument?.id || currentDocument?.fileName,
              );

              return (
                <div
                  key={document.key}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-slate-800">
                        {document.label}
                        {document.required && (
                          <span className="ml-1 text-danger-600">*</span>
                        )}
                      </h4>
                      <StatusPill
                        status={isUploaded ? "complete" : "pending"}
                        label={
                          isUploaded
                            ? "Anexado"
                            : document.required
                              ? "Pendente"
                              : "Opcional"
                        }
                      />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {currentDocument?.fileName ?? document.description}
                    </p>
                    {currentDocument?.error && (
                      <p className="mt-2 text-sm font-semibold text-danger-600">
                        {currentDocument.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      fullWidth={false}
                      variant="ghost"
                      size="sm"
                      leftIcon={<Upload className="size-4" />}
                      loading={currentDocument?.uploading}
                      onClick={() => openDocumentModal(document.key)}
                    >
                      {isUploaded ? "Substituir" : "Anexar"}
                    </Button>
                    {isUploaded && (
                      <button
                        type="button"
                        aria-label={`Remover ${document.label}`}
                        onClick={() => removeLocalDocument(document.key)}
                        className="flex size-10 items-center justify-center rounded-lg text-danger-600 transition hover:bg-danger-600/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isDraggingDocumentCard && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white p-6 text-center text-brand-700">
              <div className="flex min-h-56 w-full max-w-lg flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-100 px-6 py-7">
                <Upload className="mb-5 size-14 text-brand-600" />
                <p className="text-base font-bold text-brand-700">
                  Solte para realizar upload
                </p>
                <p className="mt-1 text-sm text-content-muted">
                  Depois escolha o tipo do documento.
                </p>
                <p className="mt-6 text-sm leading-6 text-content-muted">
                  Formatos permitidos: .pdf, .doc, .docx, .png, .jpg
                  <br />
                  Tamanho maximo: 2MB
                </p>
              </div>
            </div>
          )}
        </section>

        {documentDropError && (
          <InlineNotice tone="error" className="mt-4">
            {documentDropError}
          </InlineNotice>
        )}
      </div>
    );
  }

  function renderReviewStep() {
    const reviewSections = [
      {
        title: "Identidade Civil",
        icon: <IdCard className="size-5" />,
        step: 0 as StepIndex,
        status: stepStatuses[0],
      },
      {
        title: "Endereço e Contato",
        icon: <Home className="size-5" />,
        step: 1 as StepIndex,
        status: stepStatuses[1],
      },
      {
        title: "Dados Institucionais",
        icon: <GraduationCap className="size-5" />,
        step: 2 as StepIndex,
        status: stepStatuses[2],
      },
      {
        title: "Upload de Documentos",
        icon: <FileText className="size-5" />,
        step: 3 as StepIndex,
        status: stepStatuses[3],
      },
    ];

    return (
      <div>
        {renderSectionTitle(
          <ClipboardCheck className="size-5" />,
          "Revisão do cadastro",
          "Confira cada seção antes de enviar a inscrição para análise.",
        )}

        <div className="overflow-hidden rounded-lg border border-brand-100 bg-white">
          {reviewSections.map((section, index) => (
            <div
              key={section.title}
              className={cn(
                "grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto]",
                index > 0 && "border-t border-brand-100",
              )}
            >
              <div className="flex gap-3">
                <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-700">
                    {index + 1}. {section.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {getStatusCopy(section.status)}
                  </p>
                  <div className="mt-3">
                    <StatusPill status={section.status} />
                  </div>
                </div>
              </div>

              <Button
                fullWidth={false}
                variant="primary"
                size="sm"
                leftIcon={<Edit3 className="size-4" />}
                onClick={() => {
                  setEditingStep(section.step);
                  setStep(section.step);
                }}
              >
                Editar
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-brand-100 bg-slate-50 p-5">
          <div className="mb-4 flex items-center gap-3 text-brand-700">
            <ShieldCheck className="size-5" />
            <h3 className="font-bold">Termos para envio</h3>
          </div>

          <div className="space-y-4">
            <Checkbox
              variant="white"
              {...registrationFieldProps("accepted_terms")}
              checked={form.accepted_terms}
              onChange={(event) =>
                setField("accepted_terms", event.target.checked)
              }
              label="Declaro que as informações preenchidas são verdadeiras."
              error={shouldShowError("accepted_terms", 4)}
            />
            <Checkbox
              variant="white"
              {...registrationFieldProps("accepted_terms_2")}
              checked={form.accepted_terms_2}
              onChange={(event) =>
                setField("accepted_terms_2", event.target.checked)
              }
              label="Autorizo o uso dos dados para análise da inscrição."
              error={shouldShowError("accepted_terms_2", 4)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!draftHydrated) {
    return null;
  }

  return (
    <Register step={step} stepStatuses={stepStatuses}>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col">
        <div className="mb-6 rounded-lg bg-brand-600 p-5 text-white lg:hidden">
          <p className="text-sm text-white/70">Realize seu cadastro</p>
          <h1 className="mt-1 text-xl font-bold">
            {
              [
                "Identidade Civil",
                "Endereço e Contato",
                "Dados Institucionais",
                "Upload de Documentos",
                "Revisão e Confirmação",
              ][step]
            }
          </h1>
        </div>

        <form
          className="flex flex-1 flex-col"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="rounded-lg bg-white p-5 shadow-sm shadow-slate-300/70 sm:p-8">
            {step === 0 && renderCivilStep()}
            {step === 1 && renderAddressStep()}
            {step === 2 && renderInstitutionalStep()}
            {step === 3 && renderDocumentsStep()}
            {step === 4 && renderReviewStep()}
          </div>

          {feedback && (
            <InlineNotice
              tone={feedback.type === "error" ? "error" : "success"}
              className="mt-4"
            >
              {feedback.message}
            </InlineNotice>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 || isEditing ? (
              <Button
                fullWidth={false}
                variant="ghost"
                size="md"
                leftIcon={<ArrowLeft className="size-5" />}
                onClick={handlePrevious}
              >
                Voltar
              </Button>
            ) : (
              <div aria-hidden="true" />
            )}

            {step === 4 ? (
              <Button
                fullWidth={false}
                variant="success"
                size="md"
                loading={saving}
                rightIcon={<CheckCircle2 className="size-5" />}
                onClick={handleConfirm}
              >
                Confirmar e enviar
              </Button>
            ) : (
              <Button
                fullWidth={false}
                variant="primary"
                size="md"
                loading={saving}
                rightIcon={
                  isEditing ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <ArrowRight className="size-5" />
                  )
                }
                onClick={handleNext}
              >
                {isEditing ? "Concluir" : "Avançar"}
              </Button>
            )}
          </div>
        </form>
      </div>

      {documentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <button
            type="button"
            aria-label="Fechar modal"
            onClick={closeDocumentModal}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl shadow-slate-950/30">
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-100/55 text-brand-600">
                  <FileText className="size-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-700">
                    Inserir documento
                  </h2>
                  <p className="mt-1 text-sm text-content-muted">
                    Selecione o tipo e anexe o arquivo correspondente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fechar modal"
                onClick={closeDocumentModal}
                className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-brand-600 transition hover:bg-brand-100/45"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-6 lg:border-r lg:border-border-subtle lg:pr-6">
                <div>
                  <h3 className="text-base font-bold text-brand-700">
                    1. Tipo do documento
                  </h3>
                  <p className="mt-2 text-sm text-content-muted">
                    Selecione o tipo do documento que deseja inserir.
                  </p>
                </div>

                <Select
                  variant="white"
                  label="Tipo do documento"
                  required
                  value={documentDraftKey}
                  onChange={(event) => setDocumentDraftKey(event.target.value)}
                  options={REGISTRATION_DOCUMENTS.map((document) => ({
                    value: document.key,
                    label: document.label,
                  }))}
                  className={fieldClassName()}
                />

                <div className="flex gap-4 rounded-lg bg-brand-100/35 p-5 text-brand-700">
                  <Info className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="font-bold">Importante</p>
                    <p className="mt-2 text-sm leading-6 text-content-muted">
                      Certifique-se de que o documento esta legivel e dentro dos
                      formatos permitidos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-brand-700">
                    2. Anexar arquivo
                  </h3>
                  <p className="mt-2 text-sm text-content-muted">
                    Arraste ou clique para selecionar o arquivo do seu
                    dispositivo.
                  </p>
                </div>

                <label
                  htmlFor="registration-document-file"
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleFileDrop}
                  className={cn(
                    "flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-7 text-center transition",
                    isDraggingFile
                      ? "border-brand-600 bg-brand-100/50"
                      : "border-brand-100 bg-white hover:border-brand-600 hover:bg-brand-100/20",
                  )}
                >
                  <input
                    id="registration-document-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg"
                    className="sr-only"
                    onChange={handleFileInputChange}
                  />
                  <Upload className="mb-5 size-14 text-brand-600" />
                  <span className="text-base font-bold text-brand-700">
                    {documentDraftFile?.name
                      ? documentDraftFile.name
                      : "Arraste e solte o arquivo aqui"}
                  </span>
                  {!documentDraftFile?.name && (
                    <span className="mt-1 text-base font-bold text-brand-700">
                      ou clique para selecionar
                    </span>
                  )}
                  <span className="mt-6 text-sm leading-6 text-content-muted">
                    Formatos permitidos: .pdf, .doc, .docx, .png, .jpg
                    <br />
                    Tamanho maximo: 2MB
                  </span>
                </label>
              </div>
            </div>

            {documentDraftError && (
              <InlineNotice tone="error" className="mx-6 mb-5">
                {documentDraftError}
              </InlineNotice>
            )}

            <div className="flex flex-col gap-5 border-t border-border-subtle px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 text-content-muted">
                <ShieldCheck className="size-7 shrink-0 text-brand-600" />
                <p className="text-sm leading-6">
                  Seus documentos sao enviados com seguranca
                  <br className="hidden sm:block" />e utilizados apenas para
                  fins cadastrais.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  fullWidth={false}
                  variant="ghost"
                  size="md"
                  onClick={closeDocumentModal}
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth={false}
                  variant="primary"
                  size="md"
                  onClick={handleDocumentUpload}
                >
                  Salvar documento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Register>
  );
}

function Divider() {
  return <div className="border-t border-dashed border-brand-600/35" />;
}

function InlineNotice({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: "info" | "error" | "success";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
        tone === "info" && "border-brand-100 bg-brand-100/35 text-brand-700",
        tone === "error" &&
          "border-danger-600/20 bg-danger-600/10 text-danger-700",
        tone === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: RegisterStepStatus;
  label?: string;
}) {
  const text =
    label ??
    (status === "complete"
      ? "Completo"
      : status === "incomplete"
        ? "Incompleto"
        : "Pendente");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold",
        status === "complete" && "bg-emerald-100 text-emerald-700",
        status === "incomplete" && "bg-amber-100 text-amber-700",
        status === "pending" && "bg-yellow-100 text-yellow-800",
      )}
    >
      {status === "complete" && <CheckCircle2 className="size-3.5" />}
      {status !== "complete" && <AlertCircle className="size-3.5" />}
      {text}
    </span>
  );
}

function SegmentedQuestion({
  label,
  value,
  required,
  error,
  onChange,
}: {
  label: string;
  value: BinaryAnswer;
  required?: boolean;
  error?: string;
  onChange: (value: BinaryAnswer) => void;
}) {
  return (
    <div>
      <span className="text-xs font-bold uppercase text-brand-600">
        {label}
        {required && <span className="ml-1 text-danger-600">*</span>}
      </span>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
        {[
          { value: "true" as BinaryAnswer, label: "Sim" },
          { value: "false" as BinaryAnswer, label: "Não" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-11 cursor-pointer rounded-md text-sm font-bold transition",
              value === option.value
                ? "bg-brand-600 text-white shadow-sm"
                : "text-brand-700 hover:bg-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
    </div>
  );
}
