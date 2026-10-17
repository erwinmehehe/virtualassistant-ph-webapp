/**
 * Visual sizing only: never modify, abbreviate, truncate or reformat the
 * actual recipient name stored in a verified certificate.
 *
 * Text still wraps naturally because letter widths differ between scripts
 * and fonts. CSS provides the final overflow-safe fitting rules.
 */
export type CertificateRecipientNameSize = "regular" | "compact" | "dense";

export function certificateRecipientNameSize(name: string): CertificateRecipientNameSize {
  const normalized = name.trim().replace(/\s+/g, " ");
  const characters = Array.from(normalized).length;
  const longestWord = Math.max(0, ...normalized.split(" ").map((word) => Array.from(word).length));

  if (characters >= 56 || longestWord >= 24) return "dense";
  if (characters >= 30 || longestWord >= 17) return "compact";
  return "regular";
}
