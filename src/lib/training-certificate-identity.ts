/** Certificate names are deliberately independent of email and profile display names. */
export function normalizeTrainingCertificateName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 100 || name.includes("@") || /[\u0000-\u001F\u007F]/.test(name)) {
    return null;
  }
  return name;
}

export function suggestedTrainingCertificateName(metadata: Record<string, unknown> | null | undefined): string | null {
  return normalizeTrainingCertificateName(metadata?.certificate_name)
    || normalizeTrainingCertificateName(metadata?.full_name)
    || normalizeTrainingCertificateName(metadata?.name);
}

/** Never use an unconfirmed OAuth/profile name on a newly issued public certificate. */
export function confirmedTrainingCertificateName(metadata: Record<string, unknown> | null | undefined): string | null {
  const name = normalizeTrainingCertificateName(metadata?.certificate_name);
  const confirmedAt = metadata?.certificate_name_confirmed_at;
  return name && typeof confirmedAt === "string" && Number.isFinite(Date.parse(confirmedAt))
    ? name
    : null;
}
