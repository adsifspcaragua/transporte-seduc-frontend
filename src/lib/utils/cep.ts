export function cleanCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCep(value: string) {
  const digits = cleanCep(value);

  if (digits.length <= 5) return digits;

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCep(value: string) {
  const cep = cleanCep(value);

  return cep.length === 8;
}
