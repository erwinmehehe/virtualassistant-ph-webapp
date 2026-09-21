import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [profileResult, displayResult, notificationResult, securityResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,role,full_name,avatar_url,account_status,email_verified,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("account_display_preferences")
      .select("timezone,date_format,time_format,created_at,updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("account_notification_preferences")
      .select("hiring_updates,booking_reminders,candidate_activity,product_emails,security_alerts,created_at,updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("account_security_events")
      .select("event_type,session_id,ip,user_agent,metadata,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      sign_in_providers: (user.identities ?? [])
        .map((identity) => identity.provider)
        .filter(Boolean),
    },
    profile: profileResult.data ?? null,
    display_preferences: displayResult.data ?? null,
    notification_preferences: notificationResult.data ?? null,
    recent_security_activity: securityResult.data ?? [],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="virtualassistant-account-data.json"',
      "Cache-Control": "private, no-store",
    },
  });
}
