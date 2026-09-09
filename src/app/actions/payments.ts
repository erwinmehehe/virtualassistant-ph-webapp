"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymongoCheckoutSession, refundPaymongoPayment, usdToPhp } from "@/lib/paymongo";

/**
 * Admin creates a ledger entry for what a client owes for a workroom. This
 * does not charge anyone yet -- it records VA compensation owed by the client.
 * Platform recruiting/service fees are billed to the client separately and are
 * never deducted from the VA's compensation. The client pays this invoice from
 * their dashboard, which is when a
 * PayMongo Checkout Session actually gets created.
 */
export async function createInvoiceAction(formData: FormData) {
  await requireRole("admin");
  const workroomId = String(formData.get("workroom_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amountTotal = Number(formData.get("amount_total"));

  if (!workroomId) throw new Error("Select a workroom to invoice.");
  if (!description || description.length < 3) throw new Error("Add a short description for this invoice.");
  if (!Number.isFinite(amountTotal) || amountTotal <= 0) throw new Error("Enter a valid amount.");

  const admin = createAdminClient();
  const { data: workroom, error: wErr } = await admin.from("workrooms").select("id,job_id,client_id,va_id").eq("id", workroomId).single();
  if (wErr || !workroom) throw new Error("Workroom not found.");

  const { error } = await admin.from("payments").insert({
    workroom_id: workroom.id,
    job_id: workroom.job_id,
    client_id: workroom.client_id,
    va_id: workroom.va_id,
    description,
    amount_total: amountTotal,
    platform_cut_percent: 0,
    status: "awaiting_payment"
  });
  if (error) throw error;

  revalidatePath("/workspace/admin/payments");
  revalidatePath("/workspace/client/payments");
}

/**
 * Client-triggered: creates a PayMongo Checkout Session for a specific
 * awaiting_payment invoice and redirects them to PayMongo's hosted page.
 * PayMongo settles in PHP only, so the invoice's USD amount is converted at
 * the live (or last-cached) rate right before the charge -- the exact rate
 * and PHP amount used are stored on the payment row for the record. Funds
 * land in the platform's PayMongo balance -- nothing is auto-forwarded to
 * the VA. An admin releases the VA's full compensation amount manually after confirming the
 * work, via releasePayoutAction below.
 */
export async function createCheckoutSessionAction(formData: FormData) {
  const { user } = await requireRole("client");
  const paymentId = String(formData.get("payment_id") ?? "");
  const admin = createAdminClient();
  const { data: payment, error } = await admin.from("payments").select("*").eq("id", paymentId).eq("client_id", user.id).single();
  if (error || !payment) throw new Error("Invoice not found.");
  if (payment.status !== "awaiting_payment") throw new Error("This invoice is not awaiting payment.");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { amountPhp, rate } = await usdToPhp(Number(payment.amount_total));
  const session = await createPaymongoCheckoutSession({
    amountPhp,
    description: payment.description,
    referenceNumber: payment.id,
    successUrl: `${appUrl}/workspace/client/payments?paid=1`,
    cancelUrl: `${appUrl}/workspace/client/payments?cancelled=1`
  });

  await admin.from("payments").update({
    provider: "paymongo",
    provider_session_id: session.id,
    charged_amount_php: amountPhp,
    fx_rate_usd_php: rate
  }).eq("id", payment.id);
  redirect(session.url);
}

/**
 * Admin-only: marks a paid invoice as released to the VA, once the VA has
 * actually been paid out manually (GCash/Wise/bank transfer). This is a
 * bookkeeping action -- it does not move any money itself.
 */
export async function releasePayoutAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const paymentId = String(formData.get("payment_id") ?? "");
  const note = String(formData.get("release_note") ?? "").trim();
  const admin = createAdminClient();
  const { data: payment, error } = await admin.from("payments").select("status").eq("id", paymentId).single();
  if (error || !payment) throw new Error("Invoice not found.");
  if (payment.status !== "paid") throw new Error("Only paid invoices can be released.");

  await admin.from("payments").update({
    status: "released",
    released_at: new Date().toISOString(),
    released_by: user.id,
    release_note: note || null
  }).eq("id", paymentId);

  revalidatePath("/workspace/admin/payments");
  revalidatePath("/workspace/va/payments");
}

/**
 * Client-triggered: flags a paid-but-not-yet-released invoice as disputed.
 * This freezes it -- releasePayoutAction only fires from status = 'paid',
 * so a disputed invoice cannot be released until an admin resolves it.
 */
export async function fileDisputeAction(formData: FormData) {
  const { user } = await requireRole("client");
  const paymentId = String(formData.get("payment_id") ?? "");
  const reason = String(formData.get("dispute_reason") ?? "").trim();
  if (!reason || reason.length < 10) throw new Error("Describe the issue in at least a few words so we can review it.");

  const admin = createAdminClient();
  const { data: payment, error } = await admin.from("payments").select("id,status,description").eq("id", paymentId).eq("client_id", user.id).single();
  if (error || !payment) throw new Error("Invoice not found.");
  if (payment.status !== "paid") throw new Error("Only a paid, not-yet-released invoice can be disputed.");

  await admin.from("payments").update({
    status: "disputed",
    disputed_at: new Date().toISOString(),
    dispute_reason: reason,
    disputed_by: user.id
  }).eq("id", paymentId);

  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (admins?.length) {
    await admin.from("notifications").insert(admins.map((a) => ({
      user_id: a.id,
      title: "Payment disputed",
      body: `A client disputed "${payment.description}". Payout is frozen until this is resolved.`,
      href: "/workspace/admin/payments"
    })));
  }

  revalidatePath("/workspace/client/payments");
  revalidatePath("/workspace/admin/payments");
}

/**
 * Admin-only: resolves a dispute by releasing the payment anyway (moves it
 * back to 'paid' so the normal release flow can proceed).
 */
export async function resolveDisputeReleaseAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const paymentId = String(formData.get("payment_id") ?? "");
  const note = String(formData.get("resolution_note") ?? "").trim();
  const admin = createAdminClient();
  const { data: payment, error } = await admin.from("payments").select("status").eq("id", paymentId).single();
  if (error || !payment) throw new Error("Invoice not found.");
  if (payment.status !== "disputed") throw new Error("This invoice is not currently disputed.");

  await admin.from("payments").update({
    status: "paid",
    dispute_resolution: note ? `Released after review: ${note}` : "Released after review",
    dispute_resolved_at: new Date().toISOString(),
    dispute_resolved_by: user.id
  }).eq("id", paymentId);

  revalidatePath("/workspace/admin/payments");
  revalidatePath("/workspace/client/payments");
}

/**
 * Admin-only: resolves a dispute by refunding the client through PayMongo.
 * Requires the invoice to have a real PayMongo payment on file.
 */
export async function resolveDisputeRefundAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const paymentId = String(formData.get("payment_id") ?? "");
  const note = String(formData.get("resolution_note") ?? "").trim();
  const admin = createAdminClient();
  const { data: payment, error } = await admin.from("payments").select("status,provider_payment_id,charged_amount_php,amount_total").eq("id", paymentId).single();
  if (error || !payment) throw new Error("Invoice not found.");
  if (payment.status !== "disputed") throw new Error("This invoice is not currently disputed.");
  if (!payment.provider_payment_id) throw new Error("No PayMongo payment resource is on file for this invoice -- refund manually and mark void instead.");

  await refundPaymongoPayment(payment.provider_payment_id, Number(payment.charged_amount_php ?? payment.amount_total), note || "Dispute resolved with refund");

  await admin.from("payments").update({
    status: "refunded",
    dispute_resolution: note ? `Refunded: ${note}` : "Refunded",
    dispute_resolved_at: new Date().toISOString(),
    dispute_resolved_by: user.id
  }).eq("id", paymentId);

  revalidatePath("/workspace/admin/payments");
  revalidatePath("/workspace/client/payments");
}
