import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, UserRoundCheck } from "lucide-react";
import { chooseOAuthRoleAction } from "@/app/actions/auth";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { getOrBootstrapProfile } from "@/lib/profile-bootstrap";

export const metadata: Metadata = {
  title: "Choose Account Type",
  robots: { index: false, follow: false },
};

export default async function ChooseRolePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?error=Please%20sign%20in%20with%20Google%20again.");

  const profile = await getOrBootstrapProfile(user);
  if (profile) redirect(`/workspace/${profile.role}`);

  return (
    <>
      <SiteHeader/>
      <main id="main-content" className="auth-page">
        <div className="auth-card auth-card-wide">
          <div className="kicker">Google account connected</div>
          <h1>Which workspace do you need?</h1>
          <p className="muted auth-intro">
            Choose once to finish setting up your account. Existing Google accounts skip this screen on future logins.
          </p>

          {params.error ? <p className="alert" role="alert">{params.error}</p> : null}

          <div className="auth-login-options">
            <form action={chooseOAuthRoleAction}>
              <input type="hidden" name="role" value="client"/>
              {params.next ? <input type="hidden" name="next" value={params.next}/> : null}
              {params.lead ? <input type="hidden" name="lead" value={params.lead}/> : null}
              <button className="btn btn-primary" type="submit">
                <BriefcaseBusiness size={18}/> I&apos;m hiring a VA
              </button>
            </form>

            <form action={chooseOAuthRoleAction}>
              <input type="hidden" name="role" value="va"/>
              {params.next ? <input type="hidden" name="next" value={params.next}/> : null}
              <button className="btn" type="submit">
                <UserRoundCheck size={18}/> I&apos;m a Virtual Assistant
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
