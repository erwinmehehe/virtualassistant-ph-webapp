import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { setIdentityVerificationAction, setInternalUserRoleAction } from "@/app/actions/vetting";
import { setClientCompanyVerificationAction } from "@/app/actions/admin";

export default async function AdminUsersPage() {
  await requireRole("admin");
  const admin = createAdminClient();
  const [{ data: profiles }, { data: authUsers }] = await Promise.all([
    admin.from("profiles").select("id,role,full_name,created_at,email_verified,identity_verified_at,last_active_at,client_profiles(company_name,verified_at)").order("created_at", { ascending: false }).limit(200),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  ]);
  const emails = new Map((authUsers?.users || []).map((user) => [user.id, user.email || ""]));

  return <>
    <div className="page-head">
      <div>
        <h1>Users</h1>
        <p>Registered marketplace accounts. Promote a trusted internal account to Recruiter to delegate initial VA screening.</p>
      </div>
    </div>
    <div className="table-wrap responsive-table">
      <table>
        <thead><tr><th>User</th><th>Role</th><th>Trust</th><th>Joined</th><th>Internal role</th></tr></thead>
        <tbody>{(profiles || []).map((p: any) => <tr key={p.id}>
          <td data-label="User">
            <strong>{p.full_name || "Unnamed account"}</strong>
            <div className="small muted">{emails.get(p.id) || "No email available"}</div>
          </td>
          <td data-label="Role"><span className="badge">{p.role}</span></td>
          <td data-label="Trust"><div className="row wrap"><span className={`badge ${p.email_verified?"badge-success":""}`}>{p.email_verified?"Email verified":"Email pending"}</span>{p.role === "va" ? <form action={setIdentityVerificationAction}><input type="hidden" name="user_id" value={p.id}/><input type="hidden" name="verified" value={p.identity_verified_at?"0":"1"}/><button className={`btn btn-sm ${p.identity_verified_at?"":"btn-primary"}`} type="submit">{p.identity_verified_at?"Remove ID verified":"Mark ID verified"}</button></form> : null}{p.role === "client" ? <form action={setClientCompanyVerificationAction}><input type="hidden" name="client_id" value={p.id}/><input type="hidden" name="verified" value={p.client_profiles?.verified_at?"0":"1"}/><button className={`btn btn-sm ${p.client_profiles?.verified_at?"":"btn-primary"}`} type="submit">{p.client_profiles?.verified_at?"Remove verified company":"Verify company"}</button></form> : null}</div>{p.role === "client" && p.client_profiles?.company_name ? <div className="small muted">{p.client_profiles.company_name}</div> : null}</td>
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
