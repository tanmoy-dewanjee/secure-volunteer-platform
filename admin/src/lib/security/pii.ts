export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `•••• ${digits.slice(-4)}`;
}

export function maskStudentId(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 3) return "••••";
  return `${trimmed[0]}••••${trimmed.slice(-2)}`;
}

export function last4(value: string) {
  return value.replace(/\D/g, "").slice(-4);
}
