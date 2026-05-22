export function cleanPhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

type FormatPhoneOptions = {
  eager?: boolean;
};

export function formatPhone(
  value: string,
  { eager = true }: FormatPhoneOptions = {},
) {
  const digits = cleanPhone(value);

  if (digits.length <= 2) {
    if (!digits) return "";

    return `(${digits}${eager && digits.length === 2 ? ") " : ""}`;
  }

  if (digits.length <= 7) {
    const formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

    return `${formatted}${eager && digits.length === 7 ? "-" : ""}`;
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
