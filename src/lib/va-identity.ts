/**
 * How much of a Virtual Assistant's name a client may see.
 *
 * We are the middleman: a client who has a full name, a photo and a headline
 * can find that person on LinkedIn in a minute and hire them directly. So the
 * client sees a masked name — the same "Marc P." form the public directory
 * uses — until an offer is accepted, at which point the placement exists, the
 * fee is locked, and contracts need the real legal name anyway.
 *
 * Recruiters, admins and the VA themselves always see the full name; this is
 * only for client-facing surfaces.
 */

const PLACED_OFFER_STATUSES = new Set(["accepted", "placed", "active", "completed"]);

/** "Marc Pascual" -> "Marc P."; single names and blanks degrade safely. */
export function maskVaName(fullName?: string | null) {
  const trimmed = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Vetted VA";
  const parts = trimmed.split(" ");
  if (parts.length === 1) return parts[0];
  const surname = parts[parts.length - 1];
  return `${parts[0]} ${surname.charAt(0).toUpperCase()}.`;
}

/** The name to show a client for a VA they have not been placed with yet. */
export function clientFacingVaName(fullName: string | null | undefined, revealed: boolean) {
  if (revealed) return String(fullName || "").trim() || "Virtual Assistant";
  return maskVaName(fullName);
}

/** An accepted offer means the client is committed and the name can be shown. */
export function offerRevealsIdentity(status?: string | null) {
  return PLACED_OFFER_STATUSES.has(String(status || "").toLowerCase());
}
