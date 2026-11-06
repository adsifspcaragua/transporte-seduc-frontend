export const PORTAL_ENDPOINTS = {
  DEVICE: "/me/dispositivo",
  DEVICE_REQUESTS: "/me/dispositivo/solicitacoes",
  DEVICE_REQUEST: (id: number) => `/me/dispositivo/solicitacoes/${id}`,
  ENROLLMENT_CHALLENGE: (id: number) =>
    `/me/dispositivo/solicitacoes/${id}/desafio`,
  COMPLETE_ENROLLMENT: (id: number) =>
    `/me/dispositivo/solicitacoes/${id}/concluir`,
  TRIPS: "/me/viagens",
  PRESENCES: "/me/presencas",
  ATTEMPTS: "/me/presencas/tentativas",
  REVIEW: (id: number) => `/me/presencas/tentativas/${id}/revisao`,
  RESOLVE_QR: "/presencas/resolver-qr",
  PRESENCE_CHALLENGE: "/presencas/desafios",
  CONFIRM_PRESENCE: "/presencas",
  OFFLINE_PRESENCE: "/presencas/offline",
} as const;
