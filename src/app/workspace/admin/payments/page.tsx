import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvoiceAction, releasePayoutAction, resolveDisputeReleaseAction, resolveDisputeRefundAction } from "@/app/actions/payments";
import { money, dateShort } from "@/lib/format";
import { isPaymongoConfigured } from "@/lib/paymongo";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting client payment",
  paid: "Paid, ready to release",
  disputed: "Disputed, payout frozen",
  release_pending: "Release pending",
  released: "Released to VA",
  failed: "Payment failed",
  refunded: "Refunded",
  void: "Void"
};

export default async function AdminPaymentsPage() {
  await requireRole("admin");
  const admin = createAdminClient();
  const [{ data: payments }, { data: workrooms }] = await Promise.all([
    admin.from("payments").select("id,description,amount_total,currency,status,paid_at,released_at,created_at,client_id,va_id,workroom_id,dispute_reason,dispute_resolution,provider_payment_intent,profiles_client:profiles!payments_client_id_fkey(full_name),profiles_va:profiles!payments_va_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100),
    admin.from("workrooms").select("id,job_id,client_id,va_id,jobs(title),client:profiles!workrooms_client_id_fkey(full_name),va:profiles!workrooms_va_id_fkey(full_name)").eq("status", "active").order("created_at", { ascending: false }).limit(50)
  ]);

  const paymongoConfigured = isPaymongoConfigured();

  return <>
    <div className="page-head">
      <div><h1>Payments</h1><p>Create VA compensation invoices for active workrooms, then release the full compensation amount once you&apos;ve paid the VA manually (GCash, Wise, bank transfer). Client service fees are separate.</p></div>
    </div>
    {!paymongoConfigured ? <div className="alert" style={{ marginBottom: 20 }}>PayMongo is not configured yet (<code>PAYMONGO_SECRET_KEY</code> is empty). Invoices can be created, but clients won&apos;t be able to pay until it&apos;s set.</div> : null}

    <div className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>New invoice</h3>
      {workrooms?.length ? (
        <form action={createInvoiceAction} className="stack">
          <div className="field">
            <label>Workroom</label>
            <select name="workroom_id" required style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 9px", width: "100%" }}>
              {workrooms.map((w: any) => <option key={w.id} value={w.id}>{w.jobs?.title || "Role"} — {w.client?.full_name || "Client"} / {w.va?.full_name || "VA"}</option>)}
            </select>
          </div>
          <div className="field"><label>Description</label><input name="description" required minLength={3} placeholder="e.g. August 1-15 hours, 42 hrs at $6/hr"/></div>
          <div className="field"><label>VA compensation amount, USD</label><input type="number" name="amount_total" min="0.01" step="0.01" required/><span className="small muted">The VA receives this full amount. Recruiting, placement, and managed-service fees are billed to the client separately.</span></div>
          <button className="btn btn-primary" type="submit">Create invoice</button>
        </form>
      ) : <p className="muted">No active workrooms yet. An invoice can only be attached to an active workroom.</p>}
    </div>

    <div className="stack">
      {payments?.length ? payments.map((p: any) => {
        const payout = Number(p.amount_total);
        return <div className="card" key={p.id}>
          <div className="row-between wrap">
            <div>
              <div className="row wrap"><span className={`badge ${p.status === "released" ? "badge-success" : p.status === "paid" ? "badge-warning" : p.status === "disputed" ? "badge-danger" : ""}`}>{statusLabel[p.status] || p.status}</span><span className="small muted">{dateShort(p.created_at)}</span></div>
              <h3 style={{ margin: "8px 0 3px" }}>{p.description}</h3>
              <div className="small muted">{p.profiles_client?.full_name || "Client"} → {p.profiles_va?.full_name || "VA"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>{money(p.amount_total)}</strong>
              <div className="small muted">VA payout: {money(payout)} · No platform deduction</div>
            </div>
          </div>
          {p.status === "paid" ? (
            <form action={releasePayoutAction} className="row wrap" style={{ marginTop: 12 }}>
              <input type="hidden" name="payment_id" value={p.id}/>
              <input name="release_note" placeholder="Payout reference (e.g. GCash ref #, Wise transfer ID)" style={{ flex: 1, minWidth: 220 }}/>
              <button className="btn btn-primary btn-sm" type="submit">Mark released to VA</button>
            </form>
          ) : null}
          {p.status === "disputed" ? (
            <div style={{ marginTop: 12 }}>
              {p.dispute_reason ? <div className="alert" style={{ marginBottom: 10 }}><strong>Client says:</strong> {p.dispute_reason}</div> : null}
              <div className="row wrap" style={{ gap: 16 }}>
                <form action={resolveDisputeReleaseAction} className="row wrap">
                  <input type="hidden" name="payment_id" value={p.id}/>
                  <input name="resolution_note" placeholder="Resolution note" style={{ minWidth: 200 }}/>
                  <button className="btn btn-primary btn-sm" type="submit">Release anyway</button>
                </form>
                <form action={resolveDisputeRefundAction} className="row wrap">
                  <input type="hidden" name="payment_id" value={p.id}/>
                  <input name="resolution_note" placeholder="Refund note" style={{ minWidth: 200 }}/>
                  <button className="btn btn-sm" type="submit" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} disabled={!p.provider_payment_intent}>Refund client</button>
                </form>
              </div>
              {!p.provider_payment_intent ? <div className="small muted" style={{ marginTop: 6 }}>No Stripe payment on file &mdash; refund manually and mark void instead.</div> : null}
            </div>
          ) : null}
          {p.status === "released" && p.release_note ? <div className="small muted" style={{ marginTop: 8 }}>Payout reference: {p.release_note}</div> : null}
          {p.dispute_resolution ? <div className="small muted" style={{ marginTop: 8 }}>Dispute resolution: {p.dispute_resolution}</div> : null}
        </div>;
      }) : <div className="card empty">No invoices yet.</div>}
    </div>
  </>;
}
