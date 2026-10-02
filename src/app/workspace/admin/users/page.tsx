import { requireRoleFast } from "@/lib/auth";
import { PublicAvatar } from "@/components/public-avatar";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { setIdentityVerificationAction, setInternalUserRoleAction } from "@/app/actions/vetting";
import { setClientCompanyVerificationAction } from "@/app/actions/admin";
import { inviteRecruiterAction } from "@/app/actions/recruiter-invites";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRoleFast("admin");
  const params = await searchParams;
  const admin = createAdminClient();
  const [{ data: profiles }, { data: authUsers }] = await Promise.all([
    admin.from("profiles").select("id,role,full_name,avatar_url,created_at,email_verified,identity_verified_at,last_active_at,client_profiles(company_name,verified_at)").order("created_at", { ascending: false }).limit(200),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  ]);
  const authById = new Map((authUsers?.users || []).map((user) => [user.id, {
    email: user.email || "",
    emailConfirmedAt: user.email_confirmed_at || null
  }]));
  const isEmailVerified = (id: string, fallback: boolean) => Boolean(authById.get(id)?.emailConfirmedAt || fallback);

  return <>
    <div className="page-head">
      <div>
        <h1>Users</h1>
        <p>Manage marketplace accounts and invite trusted team members directly into the Recruiter workspace.</p>
      </div>
    </div>

    {params.recruiter_invite === "sent" ? (
      <div className="success-banner" role="status">
        Recruiter invitation sent. They will receive a secure email link and open directly into the Recruiter workspace after accepting.
      </div>
    ) : null}

    {params.recruiter_access === "granted" ? (
      <div className="success-banner" role="status">
        Recruiter access granted to the existing account. They can sign in and open the Recruiter workspace now.
      </div>
    ) : null}

    <section className="card stack" style={{ marginBottom: 24 }}>
      <div>
        <div className="kicker">Internal team access</div>
        <h2 style={{ marginBottom: 6 }}>Invite recruiter</h2>
        <p className="muted" style={{ margin: 0 }}>
          Send a secure invitation with Recruiter access already assigned. Existing VAPH accounts will be promoted instead of duplicated.
        </p>
      </div>

      <form action={inviteRecruiterAction} className="row wrap" style={{ alignItems: "end" }}>
        <div className="field" style={{ flex: "1 1 220px", margin: 0 }}>
          <label htmlFor="recruiter-full-name">Name</label>
          <input
            id="recruiter-full-name"
            name="full_name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Mary Fabro"
          />
        </div>
        <div className="field" style={{ flex: "1 1 280px", margin: 0 }}>
          <label htmlFor="recruiter-email">Email</label>
          <input
            id="recruiter-email"
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
        Recruiters can use the CRM, leads, discovery, candidates, matching, interviews, placements, messages, tasks, funnel and recruiter analytics. Admin settings remain restricted.
      </p>
    </section>

    <div className="table-wrap responsive-table">
      <table>
        <thead><tr><th>User</th><th>Role</th><th>Trust</th><th>Joined</th><th>Internal role</th></tr></thead>
        <tbody>{(profiles || []).map((p: any) => <tr key={p.id}>
          <td data-label="User">
            <div className="workspace-person-cell">
              <PublicAvatar name={p.full_name || "Account"} src={p.avatar_url} size="sm"/>
              <span><strong>{p.full_name || "Unnamed account"}</strong><div className="small muted">{authById.get(p.id)?.email || "No email available"}</div></span>
            </div>
          </td>
          <td data-label="Role"><span className="badge">{p.role}</span></td>
          <td data-label="Trust"><div className="row wrap"><span className={`badge ${isEmailVerified(p.id, p.email_verified)?"badge-success":""}`}>{isEmailVerified(p.id, p.email_verified)?"Email verified":"Email pending"}</span>{p.role === "va" ? <form action={setIdentityVerificationAction}><input type="hidden" name="user_id" value={p.id}/><input type="hidden" name="verified" value={p.identity_verified_at?"0":"1"}/><button className={`btn btn-sm ${p.identity_verified_at?"":"btn-primary"}`} type="submit">{p.identity_verified_at?"Remove ID verified":"Mark ID verified"}</button></form> : null}{p.role === "client" ? <form action={setClientCompanyVerificationAction}><input type="hidden" name="client_id" value={p.id}/><input type="hidden" name="verified" value={p.client_profiles?.verified_at?"0":"1"}/><button className={`btn btn-sm ${p.client_profiles?.verified_at?"":"btn-primary"}`} type="submit">{p.client_profiles?.verified_at?"Remove verified company":"Verify company"}</button></form> : null}</div>{p.role === "client" && p.client_profiles?.company_name ? <div className="small muted">{p.client_profiles.company_name}</div> : null}</td>
          <td data-label="Joined">{dateShort(p.created_at)}</td>
          <td data-label="Internal role">{p.role === "admin"
            ? <span className="small muted">Admin role cannot be changed here.</span>
            : <form action={setInternalUserRoleAction} className="row">
                <input type="hidden" name="user_id" value={p.id}/>
                <select name="role" defaultValue={p.role} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "7px 8px" }}>
                  <option value="va">VA</option>
                  <option value="client">Client</option>
                  <option value="recruiter">Recruiter</option>
                </select>
                <button className="btn btn-sm" type="submit">Update</button>
              </form>}
          </td>
        </tr>)}</tbody>
      </table>
    </div>
  </>;
}
