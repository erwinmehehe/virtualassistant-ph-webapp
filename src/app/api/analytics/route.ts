import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { isExplicitCrossSiteRequest, readRequestJson } from "@/lib/http-security";

const fixedEvents = new Set([
  "page_view",
  "form_start",
  "booking_click",
  "pricing_view",
  "hire_page_view",
  "candidate_view",
  "candidate_viewed",
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
  "va_onboarding_started",
  "va_onboarding_step_saved",
  "va_onboarding_validation_error",
  "va_onboarding_complete",
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
  if (isExplicitCrossSiteRequest(request)) return NextResponse.json({ ok: true, dropped: "cross_site" }, { status: 202 });
  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent || BOT_USER_AGENT.test(userAgent)) {
    return NextResponse.json({ ok: true, dropped: "bot" }, { status: 202 });
  }

  let body: unknown;
  try {
    body = await readRequestJson(request, 32_768);
  } catch {
    return NextResponse.json({ ok: true, dropped: "invalid_json" }, { status: 202 });
  }

  // Retired high-volume analytics (Web Vitals, training, form submit attempts)
  // from older cached clients are rejected before database rate limiting.
  const parsed = schema.safeParse(body);
  if (
    !parsed.success ||
    !allowedEvent(parsed.data.event) ||
    JSON.stringify(parsed.data.metadata ?? {}).length > 8000
  ) {
    return NextResponse.json({ ok: true, dropped: "invalid_event" }, { status: 202 });
  }

  try {
    await enforceActionRateLimit("public_analytics:ip", requestIp(request), 240, 10, false);
    if (parsed.data.session_id) {
      await enforceActionRateLimit("public_analytics:session", parsed.data.session_id, 120, 10, false);
    }
  } catch {
    return NextResponse.json({ ok: true, dropped: "rate_limited" }, { status: 202 });
  }

  try {
    // Anonymous events never need a Supabase auth lookup; only authenticated
    // sessions require an identity claim. This avoids a redundant auth request
    // during public traffic spikes without changing signed-in attribution.
    const hasSupabaseSession = /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/.test(request.headers.get("cookie") || "");
    const claimsData = await (async () => {
      if (!hasSupabaseSession) return null;
      const supabase = await createClient();
      const { data: claimsData } = await supabase.auth.getClaims();
      return claimsData;
    })();
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
      const { error } = await admin
        .from("analytics_events")
        .upsert(payload, { onConflict: "event_id", ignoreDuplicates: true });
      if (error) return NextResponse.json({ ok: true, dropped: "storage_unavailable" }, { status: 202 });
    } else {
      const { error } = await admin.from("analytics_events").insert(payload);
      if (error) return NextResponse.json({ ok: true, dropped: "storage_unavailable" }, { status: 202 });
    }
  } catch {
    // Never fail a product request because analytics storage is unavailable.
    // Analytics is intentionally lossy, including auth enrichment and limiter failures.
  }

  return NextResponse.json({ ok: true });
}
