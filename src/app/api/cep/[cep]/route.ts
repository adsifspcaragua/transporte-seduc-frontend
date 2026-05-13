import { NextResponse } from "next/server";

type ViaCepResponse = {
  bairro?: string;
  cep?: string;
  complemento?: string;
  ddd?: string;
  estado?: string;
  erro?: boolean;
  gia?: string;
  ibge?: string;
  localidade?: string;
  logradouro?: string;
  regiao?: string;
  siafi?: string;
  uf?: string;
  unidade?: string;
};

function cleanCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ cep: string }> },
) {
  const { cep: cepParam } = await context.params;
  const cep = cleanCep(cepParam);

  if (cep.length !== 8) {
    return NextResponse.json(
      { message: "Informe um CEP com 8 dígitos." },
      { status: 422 },
    );
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "Não foi possível consultar o CEP no ViaCEP." },
      { status: response.status },
    );
  }

  const data = (await response.json()) as ViaCepResponse;

  if (data.erro) {
    return NextResponse.json(
      { message: "CEP não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    cep: data.cep ?? cep,
    state: data.uf ?? "",
    city: data.localidade ?? "",
    neighborhood: data.bairro ?? "",
    address: data.logradouro ?? "",
    complement: data.complemento ?? "",
    ibgeCode: data.ibge ?? "",
  });
}
