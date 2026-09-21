import { reviewAccountDeletionRequestAction } from "@/app/actions/account-security";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type DeletionRequestRow = {
  user_id: string;
  status: "pending" | "cancelled" | "reviewing" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
};

function dateLabel(value: string | null) {
  if (!value) return "Not reviewed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(date);
}

export default async function AdminAccountDeletionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("account_deletion_requests")
    .select("user_id,status,requested_at,reviewed_at,reviewed_by,review_note")
    .neq("status", "cancelled")
    .order("requested_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  const requests = (data ?? []) as DeletionRequestRow[];
  const userIds = [...new Set(requests.map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id,full_name,role").in("id", userIds)
    : { data: [] as Array<{ id: string; full_name: string | null; role: string }> };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const emailEntries = await Promise.all(userIds.map(async (userId) => {
    const { data: userResult } = await admin.auth.admin.getUserById(userId);
    return [userId, userResult.user?.email ?? null] as const;
  }));
  const emailMap = new Map(emailEntries);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="kicker">Account security</div>
          <h1>Account deletion requests</h1>
          <p>Review account-lifecycle requests without deleting authentication or linked hiring records automatically.</p>
        </div>
      </div>

      {params.message ? <div className="success-banner" role="status">{params.message}</div> : null}
      {params.error ? <div className="alert" role="alert">{params.error}</div> : null}

      <section className="card">
        {requests.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const profile = profileMap.get(request.user_id);
                  return (
                    <tr key={request.user_id}>
                      <td>
                        <strong>{profile?.full_name || emailMap.get(request.user_id) || "Account"}</strong>
                        <div className="muted small">{emailMap.get(request.user_id) || "Email unavailable"} · {profile?.role || "unknown role"}</div>
                      </td>
                      <td><span className="status-badge">{request.status}</span></td>
                      <td>
                        <strong>{dateLabel(request.requested_at)}</strong>
                        <div className="muted small">{request.reviewed_at ? `Last reviewed ${dateLabel(request.reviewed_at)}` : "Awaiting review"}</div>
                      </td>
                      <td>
                        <form action={reviewAccountDeletionRequestAction} className="stack">
                          <input type="hidden" name="target_user_id" value={request.user_id} />
                          <select name="status" defaultValue={request.status === "pending" ? "reviewing" : request.status}>
                            <option value="reviewing">Reviewing</option>
                            <option value="approved">Approved for controlled review</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <textarea
                            name="review_note"
                            maxLength={500}
                            rows={2}
                            defaultValue={request.review_note || ""}
                            placeholder="Optional review note"
                          />
                          <button className="btn btn-sm" type="submit">Update request</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <strong>No active deletion requests</strong>
            <p>Pending, reviewing, approved, or rejected requests will appear here.</p>
          </div>
        )}
      </section>
    </>
  );
}
