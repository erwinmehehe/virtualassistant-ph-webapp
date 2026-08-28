import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSessionAction, fileDisputeAction } from "@/app/actions/payments";
import { money, dateShort } from "@/lib/format";

const statusLabel: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  disputed: "Disputed, under review",
  release_pending: "Being processed",
  released: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  void: "Void"
};

export default async function ClientPaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { user } = await requireRole("client");
  const supabase = await createClient();
  const { data: payments } = await supabase.from("payments").select("id,description,amount_total,currency,status,paid_at,created_at,dispute_reason,dispute_resolution,charged_amount_php,fx_rate_usd_php").eq("client_id", user.id).order("created_at", { ascending: false });

  return <>
    <div className="page-head"><div><h1>Payments</h1><p>Invoices your recruiter has sent for confirmed hours or placements. Pay securely by card, GCash, or Maya -- charged in PHP at the rate shown before you pay.</p></div></div>
    {params.paid ? <div className="alert alert-success" style={{ marginBottom: 16 }}>Payment received, thank you.</div> : null}
    {params.cancelled ? <div className="alert" style={{ marginBottom: 16 }}>Checkout was cancelled. You can try again below.</div> : null}
    <div className="stack">
      {payments?.length ? payments.map((p: any) => <div className="card" key={p.id}>
        <div className="row-between wrap">
          <div>
            <div className="row wrap"><span className={`badge ${p.status === "paid" || p.status === "released" ? "badge-success" : p.status === "disputed" ? "badge-warning" : ""}`}>{statusLabel[p.status] || p.status}</span><span className="small muted">{dateShort(p.created_at)}</span></div>
            <h3 style={{ margin: "8px 0 3px" }}>{p.description}</h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>{money(p.amount_total)}</strong>
            {p.charged_amount_php ? <div className="small muted">Charged as ₱{Number(p.charged_amount_php).toLocaleString(undefined, { minimumFractionDigits: 2 })}{p.fx_rate_usd_php ? ` (rate: 1 USD = ${Number(p.fx_rate_usd_php).toFixed(2)} PHP)` : ""}</div> : null}
            {p.status === "awaiting_payment" ? <form action={createCheckoutSessionAction} style={{ marginTop: 8 }}><input type="hidden" name="payment_id" value={p.id}/><button className="btn btn-primary btn-sm" type="submit">Pay now</button></form> : null}
          </div>
        </div>
        {p.status === "paid" ? (
          <details style={{ marginTop: 12 }}>
            <summary className="small muted" style={{ cursor: "pointer" }}>Report a problem with this payment</summary>
            <form action={fileDisputeAction} className="stack" style={{ marginTop: 10 }}>
              <input type="hidden" name="payment_id" value={p.id}/>
              <textarea name="dispute_reason" required minLength={10} placeholder="What went wrong? This freezes the payout until our team reviews it." rows={3}/>
              <button className="btn btn-sm" type="submit" style={{ alignSelf: "flex-start" }}>Dispute this payment</button>
            </form>
          </details>
        ) : null}
        {p.status === "disputed" && p.dispute_reason ? <div className="alert" style={{ marginTop: 12 }}><strong>Under review:</strong> {p.dispute_reason}</div> : null}
        {p.dispute_resolution ? <div className="small muted" style={{ marginTop: 8 }}>Resolution: {p.dispute_resolution}</div> : null}
      </div>) : <div className="card empty">No invoices yet.</div>}
    </div>
  </>;
}
