import axios from "axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { env } from "@/services/api/env";
import { setupInterceptors } from "@/services/api/interceptors";

function getBackendBaseURL() {
  if (!env.apiUrl) return "";

  try {
    return new URL("/", env.apiUrl).toString();
  } catch {
    console.warn("NEXT_PUBLIC_API_URL é inválida.");
    return "";
  }
}

export const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const publicApi = axios.create({
  baseURL: env.apiUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const csrfClient = axios.create({
  baseURL: getBackendBaseURL(),
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
  },
});

setupInterceptors(api, {
  refreshCsrfCookie: () => csrfClient.get(API_ENDPOINTS.AUTH.CSRF_COOKIE),
});

export { csrfClient };
