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

/**
 * Only the server-signed app_metadata is authoritative for public issuance.
 * user_metadata is editable through the client Auth API, and must never
 * supply a certificate's confirmation marker or recipient identity.
 */
export function confirmedTrainingCertificateName(appMetadata: Record<string, unknown> | null | undefined): string | null {
  const name = normalizeTrainingCertificateName(appMetadata?.certificate_recipient_name);
  const confirmedAt = appMetadata?.certificate_recipient_name_confirmed_at;
  return name && typeof confirmedAt === "string" && Number.isFinite(Date.parse(confirmedAt))
    ? name
    : null;
}

/**
 * A legacy recipient may be added only when no recipient was saved at all.
 * Malformed metadata or any nonempty existing value is NOT safe to overwrite.
 */
export function hasMissingTrainingCertificateRecipient(metadata: unknown): boolean {
  if (metadata === null) return true;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  const value = (metadata as Record<string, unknown>).recipient_name;
  return value === null || value === undefined ||
    (typeof value === "string" && value.trim().length === 0);
}

