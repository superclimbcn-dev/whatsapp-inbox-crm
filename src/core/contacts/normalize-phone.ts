export function normalizePhone(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/[^\d+]/g, "");

  if (!digits) {
    return null;
  }

  return digits.startsWith("+") ? digits : `+${digits}`;
}
