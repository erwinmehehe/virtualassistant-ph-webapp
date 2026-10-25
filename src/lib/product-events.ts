import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export async function recordProductEvent(eventName: string, args: { userId?: string | null; path: string; metadata?: Record<string, unknown> }) {
  // Training progress, assessments and certificates already live in their
  // canonical tables. No training_ event (including checkpoint attempts)
  // should create an extra analytics_events write.
  if (eventName.startsWith("training_")) return;
  try {
    const store = await cookies();
    const rawSession = store.get("va_ph_session")?.value || "";
    const sessionId = /^[0-9a-f-]{36}$/i.test(rawSession) ? rawSession : null;
    await createAdminClient().from("analytics_events").insert({
      event_name: eventName,
      path: args.path,
      session_id: sessionId,
      user_id: args.userId ?? null,
      metadata: args.metadata ?? {}
    });
  } catch {
    // Product analytics must never block the user flow.
  }
}
