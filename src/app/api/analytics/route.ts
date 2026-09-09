import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";

const fixedEvents = new Set([
  "page_view",
  "directory_profile_view",
  "directory_role_brief",
  "featured_profile_view",
  "final_role_brief",
  "header_hire_va",
  "header_hire_virtual_assistant",
  "hero_browse_talent",
  "hero_role_brief",
  "job_apply",
  "job_save_toggle",
  "blog_cta_match",
  "blog_service_click",
  "blog_related_click",
  "blog_tool_click",
  "tool_open",
  "tool_complete",
  "tool_cta_match",
  "service_blog_guide",
  "login_submit",
  "role_brief_create_account",
  "role_brief_submit",
  "talent_request_intro"
]);

const schema = z.object({
  event: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/i),
  path: z.string().min(1).max(1000).refine((value) => value.startsWith("/") && !value.startsWith("//")),
  referrer: z.string().max(2000).nullable().optional(),
  session_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

function allowedEvent(event: string) {
  return fixedEvents.has(event) || /^specialty_[a-z0-9_]+_brief$/.test(event) || /^service_[a-z0-9_]+_(brief|browse|match|profile|intro)$/.test(event);
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success || !allowedEvent(parsed.data.event) || JSON.stringify(parsed.data.metadata ?? {}).length > 8000) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const { user } = await getSessionProfile();
    const admin = createAdminClient();
    await admin.from("analytics_events").insert({
      event_name: parsed.data.event,
      path: parsed.data.path,
      referrer: parsed.data.referrer ?? null,
      session_id: parsed.data.session_id ?? null,
      user_id: user?.id ?? null,
      metadata: parsed.data.metadata ?? {}
    });
  } catch {
    // Never fail a product request because analytics storage is unavailable or the migration is pending.
  }
  return NextResponse.json({ ok: true });
}
