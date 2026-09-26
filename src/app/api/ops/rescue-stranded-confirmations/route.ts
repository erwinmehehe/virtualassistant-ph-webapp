import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccountConfirmationEmail } from "@/lib/email";
import { siteOrigin } from "@/lib/seo-url";

const WINDOW_START = "2026-09-26T13:30:00.000Z";
const WINDOW_END = "2026-09-26T14:05:00.000Z";
const RESCUE_CUTOFF = "2026-09-26T14:34:21.000Z";

function tokenFromGeneratedActionLink(actionLink: string | undefined | null) {
  if (!actionLink) return null;
  try {
    return new URL(actionLink).searchParams.get("token");
  } catch {
    return null;
  }
}

export async function GET() {
  const admin = createAdminClient();
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id,role,created_at")
    .gte("created_at", WINDOW_START)
    .lte("created_at", WINDOW_END)
    .in("role", ["va", "client"]);

  if (profileError) {
    return NextResponse.json({ ok: false, stage: "profiles" }, { status: 500 });
  }

  let rescued = 0;
  let skippedConfirmed = 0;
  let skippedAlreadySent = 0;
  let failed = 0;

  for (const profile of profiles || []) {
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    const user = userData?.user;
    if (userError || !user?.email) {
      failed += 1;
      continue;
    }
    if (user.email_confirmed_at) {
      skippedConfirmed += 1;
      continue;
    }

    const { data: sentEvents } = await admin
      .from("outbound_email_events")
      .select("id")
      .eq("event_type", "account_confirmation")
      .in("status", ["sent", "delivered"])
      .eq("recipient", user.email.toLowerCase())
      .gte("created_at", RESCUE_CUTOFF)
      .limit(1);

    if ((sentEvents || []).length > 0) {
      skippedAlreadySent += 1;
      continue;
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
      options: { redirectTo: siteOrigin() }
    });
    if (linkError) {
      failed += 1;
      continue;
    }

    const tokenHash = tokenFromGeneratedActionLink(linkData.properties?.action_link);
    if (!tokenHash) {
      failed += 1;
      continue;
    }

    const next = profile.role === "va" ? "/workspace/va/onboarding" : "/workspace/client";
    const params = new URLSearchParams({
      token_hash: tokenHash,
      type: "magiclink",
      next,
    });
    const actionUrl = `${siteOrigin()}/auth/confirm?${params.toString()}`;

    const result = await sendAccountConfirmationEmail({
      to: user.email,
      actionUrl,
      idempotencyKey: `rescue-account-confirmation-${user.id}-20260927`,
    });

    if (result.sent) rescued += 1;
    else failed += 1;
  }

  return NextResponse.json({
    ok: failed === 0,
    considered: (profiles || []).length,
    rescued,
    skippedConfirmed,
    skippedAlreadySent,
    failed,
  }, { status: failed === 0 ? 200 : 500 });
}
