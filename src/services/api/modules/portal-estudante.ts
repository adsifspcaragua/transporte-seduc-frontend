import { api } from "@/services/api/client";
import { sharePendingRequest } from "@/services/api/pending-request";
import { PORTAL_ENDPOINTS } from "@/services/api/portal-endpoints";
import type {
  PortalDataResponse,
  PortalDesafioPresenca,
  PortalDesafioVinculacao,
  PortalDispositivo,
  PortalMinhaViagem,
  PortalPaginated,
  PortalPaginationParams,
  PortalPresenca,
  PortalPresencaPayload,
  PortalQrResolvido,
  PortalSituacaoDispositivo,
  PortalSolicitacaoDispositivo,
  PortalTentativa,
  PortalVinculacaoPayload,
} from "@/types/portal-estudante";

export const portalEstudanteService = {
  device: sharePendingRequest(
    async () =>
      (
        await api.get<PortalDataResponse<PortalSituacaoDispositivo>>(
          PORTAL_ENDPOINTS.DEVICE,
        )
      ).data,
  ),
  trips: sharePendingRequest(
    async () =>
      (
        await api.get<PortalDataResponse<PortalMinhaViagem[]>>(
          PORTAL_ENDPOINTS.TRIPS,
        )
      ).data,
  ),
  presences: sharePendingRequest(
    async (params: PortalPaginationParams = {}) =>
      (
        await api.get<PortalPaginated<PortalPresenca>>(
          PORTAL_ENDPOINTS.PRESENCES,
          { params },
        )
      ).data,
  ),
  attempts: sharePendingRequest(
    async (params: PortalPaginationParams = {}) =>
      (
        await api.get<PortalPaginated<PortalTentativa>>(
          PORTAL_ENDPOINTS.ATTEMPTS,
          { params },
        )
      ).data,
  ),
  async requestDevice(motivo?: string) {
    return (
      await api.post<PortalDataResponse<PortalSolicitacaoDispositivo>>(
        PORTAL_ENDPOINTS.DEVICE_REQUESTS,
        { motivo },
      )
    ).data;
  },
  async cancelDeviceRequest(id: number) {
    return (
      await api.delete<PortalDataResponse<PortalSolicitacaoDispositivo>>(
        PORTAL_ENDPOINTS.DEVICE_REQUEST(id),
      )
    ).data;
  },
  async enrollmentChallenge(id: number) {
    return (
      await api.post<PortalDataResponse<PortalDesafioVinculacao>>(
        PORTAL_ENDPOINTS.ENROLLMENT_CHALLENGE(id),
      )
    ).data;
  },
  async completeEnrollment(id: number, payload: PortalVinculacaoPayload) {
    return (
      await api.post<PortalDataResponse<PortalDispositivo>>(
        PORTAL_ENDPOINTS.COMPLETE_ENROLLMENT(id),
        payload,
      )
    ).data;
  },
  async resolveQr(qrToken: string) {
    return (
      await api.post<PortalDataResponse<PortalQrResolvido>>(
        PORTAL_ENDPOINTS.RESOLVE_QR,
        { qr_token: qrToken },
      )
    ).data;
  },
  async presenceChallenge(qrToken: string) {
    return (
      await api.post<PortalDataResponse<PortalDesafioPresenca>>(
        PORTAL_ENDPOINTS.PRESENCE_CHALLENGE,
        { qr_token: qrToken },
      )
    ).data;
  },
  async confirmPresence(payload: PortalPresencaPayload) {
    return (
      await api.post<PortalDataResponse<PortalPresenca>>(
        PORTAL_ENDPOINTS.CONFIRM_PRESENCE,
        payload,
      )
    ).data;
  },
  /** Comprovante feito sem conexão; a API o coloca na revisão da gestão. */
  async sendOfflineProof(payload: { comprovante: string; assinatura: string }) {
    return (
      await api.post<PortalDataResponse<PortalTentativa>>(
        PORTAL_ENDPOINTS.OFFLINE_PRESENCE,
        payload,
      )
    ).data;
  },
  async requestReview(id: number, motivo: string) {
    return (
      await api.post<PortalDataResponse<PortalTentativa>>(
        PORTAL_ENDPOINTS.REVIEW(id),
        { motivo },
      )
    ).data;
  },
};
