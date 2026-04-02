import axios from "axios";

import { env } from "@/lib/env";
import { setupInterceptors } from "@/lib/api/interceptors";

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

setupInterceptors(api);
