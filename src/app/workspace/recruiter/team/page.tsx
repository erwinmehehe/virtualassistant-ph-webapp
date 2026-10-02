import { inviteRecruiterAction } from "@/app/actions/recruiter-invites";
import { PublicAvatar } from "@/components/public-avatar";
import { requireRoleFast } from "@/lib/auth";
import { dateShort } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function RecruiterTeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { userId } = await requireRoleFast("recruiter");
  const params = await searchParams;
  const admin = createAdminClient();

  const [{ data: recruiters }, { data: authUsers }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,avatar_url,created_at,email_verified,last_active_at")
      .eq("role", "recruiter")
      .order("created_at", { ascending: true }),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const authById = new Map((authUsers?.users || []).map((user) => [user.id, {
    email: user.email || "",
    emailConfirmedAt: user.email_confirmed_at || null,
    invitedAt: user.invited_at || null,
    lastSignInAt: user.last_sign_in_at || null,
  }]));

  return <div className="stack" style={{ gap: 24 }}>
    <div className="page-head">
      <div>
        <div className="kicker">Internal team</div>
        <h1>Recruiter team</h1>
        <p>Invite another trusted recruiter to the hiring workspace. Recruiter invites cannot grant Admin access.</p>
      </div>
    </div>

    {params.recruiter_invite === "sent" ? (
      <div className="success-banner" role="status">
        Recruiter invitation sent. They will receive a secure email and enter the Recruiter workspace after accepting.
      </div>
    ) : null}

    {params.recruiter_invite === "exists" ? (
      <div className="success-banner" role="status">
        That account already has Recruiter access.
      </div>
    ) : null}

    <section className="card stack">
      <div>
        <h2 style={{ marginBottom: 6 }}>Invite recruiter</h2>
        <p className="muted" style={{ margin: 0 }}>
          Use their work email. New accounts are created with Recruiter access only.
        </p>
      </div>

      <form action={inviteRecruiterAction} className="row wrap" style={{ alignItems: "end" }}>
        <div className="field" style={{ flex: "1 1 220px", margin: 0 }}>
          <label htmlFor="recruiter-team-name">Name</label>
          <input
            id="recruiter-team-name"
            name="full_name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Mary Fabro"
          />
        </div>
        <div className="field" style={{ flex: "1 1 280px", margin: 0 }}>
          <label htmlFor="recruiter-team-email">Email</label>
          <input
            id="recruiter-team-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="mary@example.com"
          />
        </div>
        <button className="btn btn-primary" type="submit">Send recruiter invite</button>
      </form>

      <p className="small muted" style={{ margin: 0 }}>
        For safety, an existing Client or VA account must be promoted by an Admin. This page can only invite a new Recruiter account.
      </p>
    </section>

    <section className="card stack">
      <div>
        <h2 style={{ marginBottom: 6 }}>Current recruiters</h2>
        <p className="muted" style={{ margin: 0 }}>People who can access the recruiter CRM and hiring workflow.</p>
      </div>

      <div className="table-wrap responsive-table">
        <table>
          <thead>
            <tr><th>Recruiter</th><th>Status</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {(recruiters || []).map((recruiter: any) => {
              const auth = authById.get(recruiter.id);
              const verified = Boolean(auth?.emailConfirmedAt || recruiter.email_verified);
              return <tr key={recruiter.id}>
                <td data-label="Recruiter">
                  <div className="workspace-person-cell">
                    <PublicAvatar name={recruiter.full_name || "Recruiter"} src={recruiter.avatar_url} size="sm"/>
                    <span>
                      <strong>{recruiter.full_name || "Unnamed recruiter"}{recruiter.id === userId ? " (You)" : ""}</strong>
                      <div className="small muted">{auth?.email || "No email available"}</div>
                    </span>
                  </div>
                </td>
                <td data-label="Status">
                  <span className={`badge ${verified ? "badge-success" : ""}`}>
                    {verified ? "Active" : "Invite pending"}
                  </span>
                </td>
                <td data-label="Joined">{dateShort(recruiter.created_at)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}
