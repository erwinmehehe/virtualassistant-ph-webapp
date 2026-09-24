import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceActionRateLimit } from "@/lib/rate-limit";

const fixedEvents = new Set([
  "page_view",
  "form_start",
  "form_submit_attempt",
  "booking_click",
  "pricing_view",
  "hire_page_view",
  "candidate_view",
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
  "blog_training_click",
  "tool_open",
  "tool_complete",
  "tool_cta_match",
  "service_blog_guide",
  "login_submit",
  "role_brief_create_account",
  "role_brief_submit",
  "talent_request_intro",
  "training_landing_view",
  "training_account_click",
  "training_learning_paths_click",
  "training_login_click",
  "training_course_interest_click",
  "training_recommendation_click",
  "training_signup_submit_click",
  "training_signup_error",
  "training_account_created",
  "training_confirmation_sent",
  "training_email_confirmed",
  "training_course_request",
  "training_dashboard_view",
  "training_course_view",
  "training_assessment_view",
  "training_certificate_view",
  "training_certificate_open",
  "training_certificate_share",
  "training_course_start_click",
  "training_course_start",
  "training_course_continue",
  "training_lesson_open",
  "training_lesson_view",
  "training_lesson_complete_click",
  "training_lesson_complete",
  "training_assessment_open",
  "training_assessment_submit_click",
  "training_assessment_submit",
  "training_assessment_reviewed",
  "training_course_complete",
  "training_certificate_issued",
  "web_vital",
]);

const schema = z.object({
  event_id: z.string().uuid().optional(),
  event: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/i),
  path: z.string().min(1).max(1000).refine((value) => value.startsWith("/") && !value.startsWith("//")),
  referrer: z.string().max(2000).nullable().optional(),
  session_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const BOT_USER_AGENT =
  /(?:bot|crawler|spider|slurp|headlesschrome|lighthouse|pagespeed|facebookexternalhit|bingpreview|preview|uptime|monitoring)/i;

function allowedEvent(event: string) {
  return (
    fixedEvents.has(event) ||
    /^specialty_[a-z0-9_]+_brief$/.test(event) ||
    /^service_[a-z0-9_]+_(brief|browse|match|profile|intro)$/.test(event)
  );
}

function requestIp(request: Request) {
  const forwarded =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  return forwarded.split(",")[0]?.trim().slice(0, 128) || "unknown";
}

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent || BOT_USER_AGENT.test(userAgent)) {
    return NextResponse.json({ ok: true, dropped: "bot" }, { status: 202 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (
    !parsed.success ||
    !allowedEvent(parsed.data.event) ||
    JSON.stringify(parsed.data.metadata ?? {}).length > 8000
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await enforceActionRateLimit("public_analytics:ip", requestIp(request), 240, 10);
    if (parsed.data.session_id) {
      await enforceActionRateLimit("public_analytics:session", parsed.data.session_id, 120, 10);
    }
  } catch {
    return NextResponse.json({ ok: true, dropped: "rate_limited" }, { status: 202 });
  }

  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
    const admin = createAdminClient();
    const payload = {
      event_id: parsed.data.event_id ?? null,
      event_name: parsed.data.event,
      path: parsed.data.path,
      referrer: parsed.data.referrer ?? null,
      session_id: parsed.data.session_id ?? null,
      user_id: userId,
      metadata: parsed.data.metadata ?? {},
    };

    if (parsed.data.event_id) {
      await admin
        .from("analytics_events")
        .upsert(payload, { onConflict: "event_id", ignoreDuplicates: true });
    } else {
      await admin.from("analytics_events").insert(payload);
    }
  } catch {
    // Analytics is intentionally lossy. Never fail a product request because
    // telemetry storage, auth enrichment, or the limiter is unavailable.
  }

  return NextResponse.json({ ok: true });
}
