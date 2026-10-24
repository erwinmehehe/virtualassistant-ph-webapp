import { createAdminClient } from "@/lib/supabase/admin";
import {
  diditConfiguration,
  outcomeFromDidit,
  verifyDiditWebhook,
} from "@/lib/va-identity-verification";

export const dynamic = "force-dynamic";

/**
 * Didit V3 destination: subscribe to status.updated and data.updated.
 * Browser callback query strings are NEVER accepted as verification outcomes.
 */
export async function POST(request: Request) {
  const config = diditConfiguration();
  if (!config) return new Response(null, { status: 503 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 128 * 1024) return new Response(null, { status: 413 });
  let raw: Buffer;
  try {
    raw = Buffer.from(await request.arrayBuffer());
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = verifyDiditWebhook(raw, request.headers, config);
  if (!event) return new Response(null, { status: 401 });
  const outcome = outcomeFromDidit(event);
  if (!outcome) return Response.json({ received: true });

  const admin = createAdminClient();
  const { data: check, error: lookupError } = await admin.from("va_identity_checks")
    .select("user_id,session_id,status,last_event_id,last_provider_created_at,verified_at")
    .eq("session_id", event.session_id).maybeSingle();
  if (lookupError) return new Response(null, { status: 503 });
  if (!check || check.user_id !== event.vendor_data) {
    // A well-signed webhook that does not map to the exact initiated session
    // cannot mark anyone verified. Do not disclose whether a user exists.
    return Response.json({ received: true });
  }
  if (check.last_event_id === event.event_id ||
    event.created_at < Number(check.last_provider_created_at || 0)) {
    return Response.json({ received: true });
  }
  // An approved identity does not become "unverified" because of a later
  // metadata-only event; only the explicit KYC-expiry state can revoke it.
  if (check.status === "verified" && outcome !== "expired" && outcome !== "verified") {
    return Response.json({ received: true });
  }

  const now = new Date().toISOString();
  let verifiedAt = check.verified_at as string | null;
  if (outcome === "verified" && check.status !== "verified") {
    // Only an entire HMAC-signed live session with ID authenticity, liveness
    // and face match individually Approved can grant a verified timestamp.
    verifiedAt = now;
    const { data: updatedProfile, error: profileError } = await admin.from("profiles")
      .update({ identity_verified_at: verifiedAt })
      .eq("id", check.user_id).eq("role", "va").select("id").maybeSingle();
    if (profileError || !updatedProfile) return new Response(null, { status: 503 });
  } else if (outcome === "expired" && check.status === "verified" && check.verified_at) {
    // Revoke only the timestamp this particular provider session granted;
    // do not erase a newer, independently reviewed admin decision.
    const { error: expiredProfileError } = await admin.from("profiles")
      .update({ identity_verified_at: null })
      .eq("id", check.user_id).eq("role", "va")
      .eq("identity_verified_at", check.verified_at);
    if (expiredProfileError) return new Response(null, { status: 503 });
    verifiedAt = null;
  }

  const { error: updateError } = await admin.from("va_identity_checks").update({
    status: outcome,
    last_event_id: event.event_id,
    last_provider_created_at: event.created_at,
    verified_at: verifiedAt,
    updated_at: now,
  }).eq("user_id", check.user_id).eq("session_id", event.session_id)
    .lte("last_provider_created_at", event.created_at);
  if (updateError) return new Response(null, { status: 503 });

  // No raw documents, OCR data, ID numbers, selfies, face match scores,
  // signed URLs, or full vendor decision blobs are stored or logged.
  return Response.json({ received: true });
}
