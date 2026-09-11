import { api, publicApi } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { linhaService } from "@/services/api/modules/linha";
import { sharePendingRequest } from "@/services/api/pending-request";
import type {
  Curso,
  Inscricao,
  InscricaoAnalisePayload,
  InscricaoDocumento,
  InscricaoInstituicao,
  InscricaoInstituicaoPayload,
  InscricaoListItem,
  InscricaoPayload,
  Instituicao,
} from "@/types/inscricao";

type ValidateInscricaoStepPayload = {
  data: InscricaoInstituicaoPayload | InscricaoPayload;
  inscricao_id?: number;
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
  listInscricoes: sharePendingRequest(async () => {
    const { data } = await api.get<
      LaravelCollectionResponse<InscricaoListItem>
    >(API_ENDPOINTS.INSCRICOES.BASE);

    return unwrapCollection(data);
  }),

  getInscricao: sharePendingRequest(async (id: number, token?: string) => {
    const { data } = await api.get<LaravelDataResponse<Inscricao>>(
      API_ENDPOINTS.INSCRICOES.BY_ID(id),
      token ? { headers: { "X-Inscricao-Token": token } } : undefined,
    );

    return unwrapData(data);
  }),

  async validateStep(payload: ValidateInscricaoStepPayload, token?: string) {
    await publicApi.post(
      API_ENDPOINTS.INSCRICOES.VALIDATE_STEP,
      payload,
      token ? { headers: { "X-Inscricao-Token": token } } : undefined,
    );
  },

  async createInscricao(payload: InscricaoPayload) {
    const { data } = await publicApi.post<Inscricao>(
      API_ENDPOINTS.INSCRICOES.BASE,
      payload,
    );

    return data;
  },

  async updateInscricao(id: number, payload: InscricaoPayload, token?: string) {
    const { data } = await publicApi.put<LaravelDataResponse<Inscricao>>(
      API_ENDPOINTS.INSCRICOES.BY_ID(id),
      payload,
      token ? { headers: { "X-Inscricao-Token": token } } : undefined,
    );

    return unwrapData(data);
  },

  async createInstituicao(
    inscricaoId: number,
    payload: InscricaoInstituicaoPayload,
    token?: string,
  ) {
    const { data } = await publicApi.post<
      LaravelDataResponse<InscricaoInstituicao>
    >(
      API_ENDPOINTS.INSCRICOES.INSTITUICOES(inscricaoId),
      payload,
      token ? { headers: { "X-Inscricao-Token": token } } : undefined,
    );

    return unwrapData(data);
  },

  async updateInstituicao(
    inscricaoId: number,
    instituicaoId: number,
    payload: InscricaoInstituicaoPayload,
    token?: string,
  ) {
    const { data } = await api.put<LaravelDataResponse<InscricaoInstituicao>>(
      API_ENDPOINTS.INSCRICOES.INSTITUICAO_BY_ID(inscricaoId, instituicaoId),
      payload,
      token ? { headers: { "X-Inscricao-Token": token } } : undefined,
    );

    return unwrapData(data);
  },

  listInscricaoInstituicoes: sharePendingRequest(
    async (inscricaoId: number) => {
      const { data } = await api.get<
        LaravelCollectionResponse<InscricaoInstituicao>
      >(API_ENDPOINTS.INSCRICOES.INSTITUICOES(inscricaoId));

      return unwrapCollection(data);
    },
  ),

  listInstituicoes: sharePendingRequest(async () => {
    const { data } = await publicApi.get<
      LaravelCollectionResponse<Instituicao>
    >(API_ENDPOINTS.INSTITUICOES.BASE);

    return unwrapCollection(data);
  }),

  listCursos: sharePendingRequest(async () => {
    const { data } = await publicApi.get<LaravelCollectionResponse<Curso>>(
      API_ENDPOINTS.CURSOS.BASE,
    );

    return unwrapCollection(data);
  }),

  listLinhas: linhaService.list,

  listDocumentos: sharePendingRequest(
    async (inscricaoId: number, token?: string) => {
      const { data } = await api.get<LaravelDocumentListResponse>(
        API_ENDPOINTS.INSCRICOES.DOCUMENTOS(inscricaoId),
        token ? { headers: { "X-Inscricao-Token": token } } : undefined,
      );

      if (typeof data === "string") return [];
      return data.documento ?? [];
    },
  ),

  async analisarInscricao(id: number, payload: InscricaoAnalisePayload) {
    await api.put<{ message?: string }>(
      API_ENDPOINTS.INSCRICOES.ANALISE(id),
      payload,
    );
  },

  async uploadDocumento(
    inscricaoId: number,
    payload: {
      name: string;
      type: string;
      file: File;
      documentoId?: number;
    },
    token?: string,
  ) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("type", payload.type);
    formData.append("file_path", payload.file);

    const { data } = await api.post<LaravelDocumentResponse>(
      API_ENDPOINTS.INSCRICOES.DOCUMENTOS(inscricaoId),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { "X-Inscricao-Token": token } : {}),
        },
      },
    );

    return data.documento;
  },
};
