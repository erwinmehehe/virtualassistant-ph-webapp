import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePlacementFinance, estimateMonthlyHours, financeStatusLabel } from "@/lib/agency-finance";
import { money, dateShort } from "@/lib/format";
import {
  addFinanceAdjustmentAction,
  markFinanceReconciledAction,
  reviewMarginExceptionAction,
  savePlacementFinanceAction,
} from "@/app/actions/agency-finance";

const adjustmentLabels: Record<string, string> = {
  service_fee_revenue: "Service fee revenue",
  placement_fee_revenue: "Placement fee revenue",
  other_revenue: "Other revenue",
  client_credit: "Client credit",
  refund: "Refund",
  va_bonus: "VA bonus",
  va_deduction: "VA deduction",
  payment_fee: "Payment fee",
  fx_cost: "FX cost",
  ops_cost: "Operating cost",
  other_cost: "Other cost",
};

const paymentStatus: Record<string, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting payment",
  paid: "Paid / payout ready",
  disputed: "Disputed",
  release_pending: "Release pending",
  released: "Released to VA",
  failed: "Failed",
  refunded: "Refunded",
  void: "Void",
};

export default async function PlacementFinancePage({ params }: { params: Promise<{ workroomId: string }> }) {
  const { workroomId } = await params;
  await requireRole("admin");
  const admin = createAdminClient();

  const [{ data: room }, { data: profile }, { data: settings }, { data: payments }, { data: adjustments }] = await Promise.all([
    admin
      .from("workrooms")
      .select("id,status,placement_stage,agreed_hourly_rate,start_date,agreed_schedule,health_status,jobs(title,hours_per_week,min_hourly_rate,recruiter_id),client:profiles!workrooms_client_id_fkey(full_name),va:profiles!workrooms_va_id_fkey(full_name)")
      .eq("id", workroomId)
      .maybeSingle(),
    admin.from("placement_finance_profiles").select("*").eq("workroom_id", workroomId).maybeSingle(),
    admin
      .from("admin_settings")
      .select("default_managed_markup_percent,finance_min_margin_percent,finance_target_margin_percent,finance_default_payment_cost_percent,finance_default_ops_cost_monthly,finance_invoice_overdue_days")
      .eq("id", 1)
      .single(),
    admin
      .from("payments")
      .select("id,description,amount_total,currency,status,created_at,paid_at,released_at,release_note,dispute_reason")
      .eq("workroom_id", workroomId)
      .order("created_at", { ascending: false }),
    admin
      .from("placement_finance_adjustments")
      .select("*")
      .eq("workroom_id", workroomId)
      .order("effective_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (!room) notFound();

  // Supabase represents embedded relations as arrays for this query shape.
  // Normalize once so the rest of the page works with a single placement record.
  const job = Array.isArray(room.jobs) ? room.jobs[0] ?? null : room.jobs;
  const client = Array.isArray(room.client) ? room.client[0] ?? null : room.client;
  const va = Array.isArray(room.va) ? room.va[0] ?? null : room.va;

  const monthlyHours = estimateMonthlyHours(Number(job?.hours_per_week || 0));
  const hourlyRate = Number(room.agreed_hourly_rate || job?.min_hourly_rate || 0);
  const estimatedVa = monthlyHours * hourlyRate;
  const markup = Number(settings?.default_managed_markup_percent ?? 0);
  const estimatedRevenue = estimatedVa > 0 ? estimatedVa * (1 + markup / 100) : 0;

  const revenue = Number(profile?.expected_monthly_client_revenue ?? estimatedRevenue);
  const vaComp = Number(profile?.expected_monthly_va_compensation ?? estimatedVa);
  const paymentCost = Number(profile?.payment_cost_percent ?? settings?.finance_default_payment_cost_percent ?? 3);
  const opsCost = Number(profile?.monthly_ops_cost ?? settings?.finance_default_ops_cost_monthly ?? 0);
  const otherCost = Number(profile?.other_monthly_cost ?? 0);
  const minMargin = Number(settings?.finance_min_margin_percent ?? 15);
  const targetMargin = Number(settings?.finance_target_margin_percent ?? 25);
  const result = calculatePlacementFinance({
    expectedMonthlyClientRevenue: revenue,
    expectedMonthlyVaCompensation: vaComp,
    paymentCostPercent: paymentCost,
    monthlyOpsCost: opsCost,
    otherMonthlyCost: otherCost,
    minMarginPercent: minMargin,
    targetMarginPercent: targetMargin,
    exceptionStatus: profile?.exception_status,
  });

  const overdueDays = Number(settings?.finance_invoice_overdue_days ?? 7);
  const overdueCutoff = Date.now() - overdueDays * 86_400_000;
  const overdue = (payments || []).filter(
    (payment) => payment.status === "awaiting_payment" && new Date(payment.created_at).getTime() < overdueCutoff,
  );
  const payoutReady = (payments || []).filter((payment) => ["paid", "release_pending"].includes(payment.status));
  const revenueAdjustmentTypes = new Set(["service_fee_revenue", "placement_fee_revenue", "other_revenue", "va_deduction"]);
  const adjustmentRevenue = (adjustments || [])
    .filter((adjustment) => revenueAdjustmentTypes.has(adjustment.adjustment_type))
    .reduce((sum, adjustment) => sum + Number(adjustment.amount || 0), 0);
  const adjustmentCosts = (adjustments || [])
    .filter((adjustment) => !revenueAdjustmentTypes.has(adjustment.adjustment_type))
    .reduce((sum, adjustment) => sum + Number(adjustment.amount || 0), 0);
  const reconciled = Boolean(profile?.reconciled_at)
    && new Date(profile!.reconciled_at!).getTime() >= new Date(profile!.updated_at).getTime();

  const financeBadgeClass = result.status === "healthy"
    ? "badge-success"
    : result.status === "approval_required"
      ? "badge-danger"
      : "badge-warning";

  return <>
    <div className="page-head">
      <div>
        <Link className="profile-back-link" href="/workspace/admin/finance">← Finance OS</Link>
        <h1>{job?.title || "Placement finance"}</h1>
        <p>{client?.full_name || "Client"} → {va?.full_name || "VA"} · {room.placement_stage || room.status}</p>
      </div>
      <span className={`badge ${financeBadgeClass}`}>{financeStatusLabel(result.status, result.marginPercent)}</span>
    </div>

    <div className="grid-4" style={{ marginBottom: 24 }}>
      <div className="card"><span className="small muted">Expected client revenue</span><strong style={{ display: "block", fontSize: 25, marginTop: 5 }}>{money(revenue)}</strong><span className="small muted">monthly recurring model</span></div>
      <div className="card"><span className="small muted">Expected VA compensation</span><strong style={{ display: "block", fontSize: 25, marginTop: 5 }}>{money(vaComp)}</strong><span className="small muted">{monthlyHours ? `${monthlyHours.toFixed(1)} hrs/mo estimate` : "set manually"}</span></div>
      <div className="card"><span className="small muted">Expected contribution</span><strong style={{ display: "block", fontSize: 25, marginTop: 5 }}>{money(result.contribution)}</strong><span className="small muted">after modeled direct costs</span></div>
      <div className="card"><span className="small muted">Margin</span><strong style={{ display: "block", fontSize: 25, marginTop: 5 }}>{result.marginPercent.toFixed(1)}%</strong><span className="small muted">floor {minMargin.toFixed(1)}% · target {targetMargin.toFixed(1)}%</span></div>
    </div>

    <div className="grid-2" style={{ alignItems: "start", marginBottom: 24 }}>
      <form action={savePlacementFinanceAction} className="card stack">
        <input type="hidden" name="workroom_id" value={room.id}/><input type="hidden" name="currency" value="USD"/>
        <div><h2 style={{ margin: 0 }}>Placement economics</h2><p className="small muted">Private agency planning values. Clients and VAs never see this cost breakdown.</p></div>
        <div className="field"><label>Expected monthly client revenue, USD</label><input type="number" min="0" step="0.01" name="expected_monthly_client_revenue" defaultValue={revenue.toFixed(2)} required/><span className="field-help">Total recurring client revenue for this placement, including the managed service component.</span></div>
        <div className="field"><label>Expected monthly VA compensation, USD</label><input type="number" min="0" step="0.01" name="expected_monthly_va_compensation" defaultValue={vaComp.toFixed(2)} required/><span className="field-help">The VA compensation itself. Existing payment records remain the collection and release ledger.</span></div>
        <div className="grid-2"><div className="field"><label>Payment / FX cost, %</label><input type="number" min="0" max="100" step="0.1" name="payment_cost_percent" defaultValue={paymentCost}/></div><div className="field"><label>Allocated operating cost / month</label><input type="number" min="0" step="0.01" name="monthly_ops_cost" defaultValue={opsCost}/></div></div>
        <div className="field"><label>Other recurring monthly cost</label><input type="number" min="0" step="0.01" name="other_monthly_cost" defaultValue={otherCost}/></div>
        <button className="btn btn-primary" type="submit">Save placement economics</button>
      </form>

      <div className="stack">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Margin guardrail</h2>
          {result.status === "approval_required" ? <div className="alert"><strong>Owner approval required.</strong> This placement is projected at {result.marginPercent.toFixed(1)}%, below the {minMargin.toFixed(1)}% minimum margin.</div> : null}
          {result.status === "approved_exception" ? <div className="success-banner"><strong>Low-margin exception approved.</strong> This placement may continue at {result.marginPercent.toFixed(1)}% under the recorded owner decision.</div> : null}
          {result.status === "watch" ? <div className="alert"><strong>Below target.</strong> Margin clears the minimum but is under the {targetMargin.toFixed(1)}% target.</div> : null}
          {result.status === "healthy" ? <div className="success-banner"><strong>Healthy economics.</strong> Margin meets the agency target.</div> : null}
          {result.status === "needs_setup" ? <div className="alert">Save placement economics to activate the margin guardrail.</div> : null}

          {profile?.exception_status === "pending" ? <div style={{ marginTop: 14 }}>
            <p><strong>Exception requested:</strong> {profile.exception_reason || "No reason recorded."}</p>
            <div className="grid-2">
              <form action={reviewMarginExceptionAction} className="stack"><input type="hidden" name="workroom_id" value={room.id}/><input type="hidden" name="decision" value="approved"/><div className="field"><label>Approval note</label><input name="review_note" minLength={3} required placeholder="Why this exception is acceptable"/></div><button className="btn btn-primary" type="submit">Approve exception</button></form>
              <form action={reviewMarginExceptionAction} className="stack"><input type="hidden" name="workroom_id" value={room.id}/><input type="hidden" name="decision" value="rejected"/><div className="field"><label>Rejection note</label><input name="review_note" minLength={3} required placeholder="What must change"/></div><button className="btn" type="submit">Reject</button></form>
            </div>
          </div> : null}
          {profile?.exception_status && ["approved", "rejected"].includes(profile.exception_status) ? <p className="small muted" style={{ marginBottom: 0 }}>Last decision: <strong>{profile.exception_status}</strong>{profile.exception_review_note ? ` · ${profile.exception_review_note}` : ""}</p> : null}
        </section>

        <section className="card">
          <div className="row-between wrap"><div><h2 style={{ margin: 0 }}>Reconciliation</h2><p className="small muted" style={{ margin: "5px 0 0" }}>Confirm this placement’s finance record matches the collection/payout ledger and manual adjustments.</p></div><span className={`badge ${reconciled ? "badge-success" : "badge-warning"}`}>{reconciled ? "Reconciled" : "Review needed"}</span></div>
          <div className="grid-2" style={{ margin: "16px 0" }}><div><span className="small muted">Recorded revenue adjustments</span><strong style={{ display: "block" }}>{money(adjustmentRevenue)}</strong></div><div><span className="small muted">Recorded cost / credit adjustments</span><strong style={{ display: "block" }}>{money(adjustmentCosts)}</strong></div></div>
          <form action={markFinanceReconciledAction} className="stack"><input type="hidden" name="workroom_id" value={room.id}/><div className="field"><label>Reconciliation note</label><textarea name="reconciliation_note" maxLength={4000} defaultValue={profile?.reconciliation_note || ""} placeholder="Payment references checked, service fee recorded, payout matched..."/></div><button className="btn" type="submit" disabled={!profile}>Mark reconciled</button></form>
          {profile?.reconciled_at ? <p className="small muted" style={{ marginBottom: 0 }}>Last reconciled {dateShort(profile.reconciled_at)}</p> : null}
        </section>
      </div>
    </div>

    <div className="grid-2" style={{ alignItems: "start" }}>
      <section className="card">
        <div className="row-between wrap"><div><h2 style={{ margin: 0 }}>Adjustments & actual finance events</h2><p className="small muted" style={{ margin: "5px 0 0" }}>Record service-fee revenue, placement fees, refunds, credits, bonuses and direct costs that sit outside the VA compensation ledger.</p></div><span className="badge">{adjustments?.length || 0}</span></div>
        <details style={{ marginTop: 14 }}><summary style={{ cursor: "pointer" }}><strong>Add adjustment</strong></summary>
          <form action={addFinanceAdjustmentAction} className="stack" style={{ marginTop: 14 }}><input type="hidden" name="workroom_id" value={room.id}/><input type="hidden" name="currency" value="USD"/>
            <div className="grid-2"><div className="field"><label>Type</label><select name="adjustment_type" required>{Object.entries(adjustmentLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div><div className="field"><label>Amount, USD</label><input name="amount" type="number" min="0.01" step="0.01" required/></div></div>
            <div className="grid-2"><div className="field"><label>Effective date</label><input name="effective_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required/></div><div className="field"><label>Related VA-comp payment (optional)</label><select name="payment_id" defaultValue=""><option value="">None</option>{(payments || []).map((payment) => <option value={payment.id} key={payment.id}>{dateShort(payment.created_at)} · {payment.description} · {money(Number(payment.amount_total))}</option>)}</select></div></div>
            <div className="field"><label>Reason</label><input name="reason" minLength={3} maxLength={3000} required placeholder="What happened and why"/></div>
            <button className="btn btn-primary" type="submit">Record adjustment</button>
          </form>
        </details>
        {adjustments?.length ? <div className="stack" style={{ marginTop: 16 }}>{adjustments.map((adjustment) => <div className="review-answer" key={adjustment.id}><div className="row-between wrap"><div><strong>{adjustmentLabels[adjustment.adjustment_type] || adjustment.adjustment_type}</strong><p className="small muted" style={{ margin: "4px 0" }}>{adjustment.reason}</p><span className="small muted">{dateShort(adjustment.effective_date)}</span></div><strong>{money(Number(adjustment.amount))}</strong></div></div>)}</div> : <div className="empty" style={{ marginTop: 14 }}>No finance adjustments recorded.</div>}
      </section>

      <section className="card">
        <div className="row-between wrap"><div><h2 style={{ margin: 0 }}>VA-compensation ledger</h2><p className="small muted" style={{ margin: "5px 0 0" }}>Existing payment records are retained as the source of truth for client collection and VA payout release.</p></div><Link className="btn btn-sm" href="/workspace/admin/payments">Payments</Link></div>
        {overdue.length ? <div className="alert" style={{ marginTop: 14 }}><strong>{overdue.length} overdue collection{overdue.length === 1 ? "" : "s"}</strong> older than {overdueDays} days.</div> : null}
        {payoutReady.length ? <div className="success-banner" style={{ marginTop: 14 }}><strong>{payoutReady.length} collected payment{payoutReady.length === 1 ? "" : "s"}</strong> ready for VA payout processing.</div> : null}
        {payments?.length ? <div className="stack" style={{ marginTop: 16 }}>{payments.map((payment) => <div className="review-answer" key={payment.id}><div className="row-between wrap"><div><strong>{payment.description}</strong><p className="small muted" style={{ margin: "4px 0" }}>{paymentStatus[payment.status] || payment.status} · {dateShort(payment.created_at)}</p>{payment.release_note ? <span className="small muted">Reference: {payment.release_note}</span> : null}</div><strong>{money(Number(payment.amount_total))}</strong></div></div>)}</div> : <div className="empty" style={{ marginTop: 14 }}>No VA-compensation payment records yet.</div>}
      </section>
    </div>
  </>;
}
