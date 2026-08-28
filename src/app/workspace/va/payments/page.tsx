import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { money, dateShort } from "@/lib/format";

const statusLabel: Record<string, string> = {
  awaiting_payment: "Client has not paid yet",
  paid: "Client paid, payout in progress",
  disputed: "Under review, payout paused",
  release_pending: "Payout in progress",
  released: "Paid out to you",
  failed: "Payment failed",
  refunded: "Refunded",
  void: "Void"
};

export default async function VaPaymentsPage() {
  const { user } = await requireRole("va");
  const supabase = await createClient();
  const { data: payouts } = await supabase.from("va_payout_view").select("*").eq("va_id", user.id).order("created_at", { ascending: false });

  return <>
    <div className="page-head"><div><h1>Payouts</h1><p>What you&apos;re owed for confirmed work, and its status. Payouts are sent manually via GCash, Wise, or bank transfer.</p></div></div>
    <div className="stack">
      {payouts?.length ? payouts.map((p: any) => <div className="card" key={p.id}>
        <div className="row-between wrap">
          <div>
            <div className="row wrap"><span className={`badge ${p.status === "released" ? "badge-success" : p.status === "disputed" ? "badge-danger" : ""}`}>{statusLabel[p.status] || p.status}</span><span className="small muted">{dateShort(p.created_at)}</span></div>
            <h3 style={{ margin: "8px 0 3px" }}>{p.description}</h3>
          </div>
          <strong>{money(p.payout_amount)}</strong>
        </div>
      </div>) : <div className="card empty">No payouts yet.</div>}
    </div>
  </>;
}
