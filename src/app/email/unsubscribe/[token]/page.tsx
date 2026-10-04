import { unsubscribeLeadNurtureAction } from "@/app/actions/nurture";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function LeadNurtureUnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const { done } = await searchParams;
  const admin = createAdminClient();
  const { data: state } = await admin
    .from("lead_nurture_state")
    .select("status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  const valid = Boolean(state);
  const unsubscribed = state?.status === "unsubscribed" || done === "1";

  return <main className="shell section">
    <section className="card" style={{maxWidth:640,margin:"48px auto"}}>
      <div className="kicker">Email preferences</div>
      <h1>{unsubscribed ? "Hiring follow-ups stopped" : valid ? "Stop automated hiring follow-ups?" : "Link unavailable"}</h1>
      <p className="muted">
        {unsubscribed
          ? "You will no longer receive this automated VirtualAssistant.com.ph hiring nurture sequence. Account, booking, payment, and other necessary service emails are unaffected."
          : valid
            ? "This stops the long-term automated email sequence for your current VA hiring inquiry. It does not close your hiring request or disable necessary service emails."
            : "This unsubscribe link is invalid or no longer available."}
      </p>
      {valid && !unsubscribed ? <form action={unsubscribeLeadNurtureAction}>
        <input type="hidden" name="token" value={token}/>
        <button className="btn btn-primary" type="submit">Stop automated follow-ups</button>
      </form> : null}
    </section>
  </main>;
}
