import { portalEstudanteService } from "@/services/api/modules/portal-estudante";
import { createCachedQuery } from "@/services/api/query-cache";

export const portalTripsQuery = createCachedQuery(portalEstudanteService.trips);
export const portalDeviceQuery = createCachedQuery(
  portalEstudanteService.device,
);
export const portalPresencesQuery = createCachedQuery(
  portalEstudanteService.presences,
);
export const portalAttemptsQuery = createCachedQuery(
  portalEstudanteService.attempts,
);
