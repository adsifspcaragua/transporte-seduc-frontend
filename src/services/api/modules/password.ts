import { api, csrfClient } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";

type PasswordResponse = { message: string };

export const passwordService = {
  async requestLink(email: string) {
    await csrfClient.get(API_ENDPOINTS.AUTH.CSRF_COOKIE);
    const { data } = await api.post<PasswordResponse>(
      API_ENDPOINTS.AUTH.PASSWORD_EMAIL,
      { email },
    );
    return data;
  },

  async reset(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    await csrfClient.get(API_ENDPOINTS.AUTH.CSRF_COOKIE);
    const { data } = await api.post<PasswordResponse>(
      API_ENDPOINTS.AUTH.PASSWORD_RESET,
      payload,
    );
    return data;
  },
};
