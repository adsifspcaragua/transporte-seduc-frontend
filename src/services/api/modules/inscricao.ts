import { api, publicApi } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type {
  Curso,
  Inscricao,
  InscricaoDocumento,
  InscricaoInstituicao,
  InscricaoInstituicaoPayload,
  InscricaoPayload,
  Instituicao,
} from "@/types/inscricao";

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
      data: T[];
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
  return payload.data ?? [];
}

export const inscricaoService = {
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

  async listDocumentos(inscricaoId: number) {
    const { data } = await api.get<LaravelDocumentListResponse>(
      API_ENDPOINTS.INSCRICOES.DOCUMENTOS(inscricaoId),
    );

    if (typeof data === "string") return [];
    return data.documento ?? [];
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
