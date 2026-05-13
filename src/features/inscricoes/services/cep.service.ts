import type { CepAddress } from "@/features/inscricoes/types/inscricao.types";
import { cleanCep } from "@/lib/utils/cep";

export const cepService = {
  async lookup(cep: string): Promise<CepAddress> {
    const cleanedCep = cleanCep(cep);

    const response = await fetch(`/api/cep/${cleanedCep}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message ?? "Não foi possível consultar o CEP.");
    }

    return data;
  },
};
