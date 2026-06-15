import type { CepAddress } from "@/types/inscricao";
import { cleanCep } from "@/utils/cep";

export const cepService = {
  async lookup(cep: string): Promise<CepAddress> {
    const cleanedCep = cleanCep(cep);

    const response = await fetch(`/api/cep/${cleanedCep}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const responseText = await response.text();
    let data: CepAddress | { message?: string } | null = null;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new Error("Não foi possível consultar o CEP.");
    }

    if (!response.ok) {
      const message =
        data && "message" in data
          ? data.message
          : "Não foi possível consultar o CEP.";

      throw new Error(message);
    }

    return data as CepAddress;
  },
};
