import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function recordProductEvent(eventName: string, args: { userId?: string | null; path: string; metadata?: Record<string, unknown> }) {
  try {
    await createAdminClient().from("analytics_events").insert({
      event_name: eventName,
      path: args.path,
      user_id: args.userId ?? null,
      metadata: args.metadata ?? {}
    });
  } catch {
    // Product analytics must never block the user flow.
  }
}
