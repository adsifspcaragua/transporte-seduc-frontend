export function cleanPhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatPhone(value: string) {
  const digits = cleanPhone(value);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(value: string) {
  const phone = cleanPhone(value);

  if (phone.length !== 11) {
    return false;
  }

  return /^[1-9]{2}9\d{8}$/.test(phone);
}
