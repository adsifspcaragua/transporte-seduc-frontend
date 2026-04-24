import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "@/features/auth/types/auth.types";
import { api, csrfClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

async function ensureCsrfCookie() {
  await csrfClient.get(API_ENDPOINTS.AUTH.CSRF_COOKIE);
}

export const authService = {
  async csrfCookie() {
    await ensureCsrfCookie();
  },

  async login(payload: LoginRequest) {
    await ensureCsrfCookie();

    const { data } = await api.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload,
    );
    return data;
  },

  async me() {
    const { data } = await api.get<AuthUser>(API_ENDPOINTS.AUTH.ME);
    return data;
  },

  async logout() {
    const { data } = await api.post<{ message: string }>(
      API_ENDPOINTS.AUTH.LOGOUT,
    );
    return data;
  },
};
