import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/store/auth.store";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retryAfterCsrfRefresh?: boolean;
};

type SetupInterceptorsOptions = {
  refreshCsrfCookie: () => Promise<unknown>;
};

function isCsrfCookieRequest(url?: string) {
  return url?.includes("/sanctum/csrf-cookie") ?? false;
}

export function setupInterceptors(
  api: AxiosInstance,
  { refreshCsrfCookie }: SetupInterceptorsOptions,
) {
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.headers.Accept = "application/json";

    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = error.config as
        | RetryableRequestConfig
        | undefined;

      if (
        status === 419 &&
        originalRequest &&
        !originalRequest._retryAfterCsrfRefresh &&
        !isCsrfCookieRequest(originalRequest.url)
      ) {
        originalRequest._retryAfterCsrfRefresh = true;
        await refreshCsrfCookie();
        return api(originalRequest);
      }

      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth();
      }

      return Promise.reject(error);
    },
  );
}
