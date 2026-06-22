import { api, publicApi } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type {
  Curso,
  Inscricao,
  InscricaoAnalisePayload,
  InscricaoDocumento,
  InscricaoInstituicao,
  InscricaoInstituicaoPayload,
  InscricaoPayload,
  Instituicao,
  Linha,
} from "@/types/inscricao";

type ValidateInscricaoStepPayload = {
  data: InscricaoInstituicaoPayload | InscricaoPayload;
  step: number;
};

type LaravelDataResponse<T> = {
  data: T;
  message?: string;
};

type LaravelDocumentResponse = {
  documento: InscricaoDocumento;
  message?: string;
};

type LaravelDocumentListResponse =
  | string
  | {
      documento: InscricaoDocumento[];
      message?: string;
    };

type LaravelCollectionResponse<T> =
  | T[]
  | {
      data?:
        | T[]
        | {
            data?: T[];
          };
      message?: string;
    };

function unwrapData<T>(payload: T | LaravelDataResponse<T>) {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    payload.data
  ) {
    return payload.data;
  }

  return payload as T;
}

function unwrapCollection<T>(payload: LaravelCollectionResponse<T>) {
  if (Array.isArray(payload)) return payload;

  if (!payload.data) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload.data?.data ?? [];
}

export const inscricaoService = {
  async listInscricoes() {
    const { data } = await api.get<LaravelCollectionResponse<Inscricao>>(
      API_ENDPOINTS.INSCRICOES.BASE,
    );

    return unwrapCollection(data);
  },

  async getInscricao(id: number) {
    const { data } = await api.get<LaravelDataResponse<Inscricao>>(
      API_ENDPOINTS.INSCRICOES.BY_ID(id),
    );

    return unwrapData(data);
  },

  async validateStep(payload: ValidateInscricaoStepPayload) {
    await api.post(API_ENDPOINTS.INSCRICOES.VALIDATE_STEP, payload);
  },

  async createInscricao(payload: InscricaoPayload) {
    const { data } = await api.post<Inscricao>(
      API_ENDPOINTS.INSCRICOES.BASE,
      payload,
    );

    return data;
  },

  async updateInscricao(id: number, payload: InscricaoPayload) {
    const { data } = await api.put<LaravelDataResponse<Inscricao>>(
      API_ENDPOINTS.INSCRICOES.BY_ID(id),
      payload,
    );

    return unwrapData(data);
  },

  async createInstituicao(
    inscricaoId: number,
    payload: InscricaoInstituicaoPayload,
  ) {
    const { data } = await api.post<LaravelDataResponse<InscricaoInstituicao>>(
      API_ENDPOINTS.INSCRICOES.INSTITUICOES(inscricaoId),
      payload,
    );

    return unwrapData(data);
  },

  async updateInstituicao(
    inscricaoId: number,
    instituicaoId: number,
    payload: InscricaoInstituicaoPayload,
  ) {
    const { data } = await api.put<LaravelDataResponse<InscricaoInstituicao>>(
      API_ENDPOINTS.INSCRICOES.INSTITUICAO_BY_ID(inscricaoId, instituicaoId),
      payload,
    );

    return unwrapData(data);
  },

  async listInscricaoInstituicoes(inscricaoId: number) {
    const { data } = await api.get<
      LaravelCollectionResponse<InscricaoInstituicao>
    >(API_ENDPOINTS.INSCRICOES.INSTITUICOES(inscricaoId));

    return unwrapCollection(data);
  },

  async listInstituicoes() {
    const { data } = await publicApi.get<
      LaravelCollectionResponse<Instituicao>
    >(API_ENDPOINTS.INSTITUICOES.BASE);

    return unwrapCollection(data);
  },

  async listCursos() {
    const { data } = await publicApi.get<LaravelCollectionResponse<Curso>>(
      API_ENDPOINTS.CURSOS.BASE,
    );

    return unwrapCollection(data);
  },

  async listLinhas() {
    const { data } = await api.get<LaravelCollectionResponse<Linha>>(
      API_ENDPOINTS.LINHAS.BASE,
    );

    return unwrapCollection(data);
  },

  async listDocumentos(inscricaoId: number) {
    const { data } = await api.get<LaravelDocumentListResponse>(
      API_ENDPOINTS.INSCRICOES.DOCUMENTOS(inscricaoId),
    );

    if (typeof data === "string") return [];
    return data.documento ?? [];
  },

  async analisarInscricao(id: number, payload: InscricaoAnalisePayload) {
    await api.put<{ message?: string }>(
      API_ENDPOINTS.INSCRICOES.ANALISE(id),
      payload,
    );
  },

  async ativarRecadastro() {
    await api.post<{ message?: string }>(API_ENDPOINTS.INSCRICOES.RECADASTRO);
  },

  async uploadDocumento(
    inscricaoId: number,
    payload: {
      name: string;
      type: string;
      file: File;
      documentoId?: number;
    },
  ) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("type", payload.type);
    formData.append("file_path", payload.file);

    const endpoint = payload.documentoId
      ? API_ENDPOINTS.INSCRICOES.DOCUMENTO_BY_ID(
          inscricaoId,
          payload.documentoId,
        )
      : API_ENDPOINTS.INSCRICOES.DOCUMENTOS(inscricaoId);

    if (payload.documentoId) {
      formData.append("_method", "PUT");
    }

    const { data } = await api.post<LaravelDocumentResponse>(
      endpoint,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data.documento;
  },
};
