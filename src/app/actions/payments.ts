"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymongoCheckoutSession, refundPaymongoPayment, usdToPhp } from "@/lib/paymongo";

function paymentStateError(error: { message?: string } | null, fallback: string) {
  const message = String(error?.message || "");
  if (message.includes("payment_state_conflict")) return new Error("This payment changed while you were working. Refresh and try again.");
  if (message.includes("checkout_in_progress")) return new Error("Checkout is already being prepared. Please try again in a moment.");
  return new Error(fallback);
}

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

export async function createCheckoutSessionAction(formData: FormData) {
  const { user } = await requireRole("client");
  const paymentId = String(formData.get("payment_id") ?? "");
  if (!paymentId) throw new Error("Invoice not found.");

  const admin = createAdminClient();
  const claimToken = randomUUID();
  const { data: claimRows, error: claimError } = await admin.rpc("claim_payment_checkout", {
    p_payment_id: paymentId,
    p_client_id: user.id,
    p_claim_token: claimToken,
  });
  if (claimError) throw paymentStateError(claimError, "This invoice is not available for checkout.");

  const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
  if (!claim?.payment_id) throw new Error("Invoice not found.");
  if (claim.reuse_existing && claim.provider_checkout_url) redirect(claim.provider_checkout_url);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const { amountPhp, rate } = await usdToPhp(Number(claim.amount_total));
    const session = await createPaymongoCheckoutSession({
      amountPhp,
      description: claim.description,
      referenceNumber: claim.payment_id,
      successUrl: `${appUrl}/workspace/client/payments?paid=1`,
      cancelUrl: `${appUrl}/workspace/client/payments?cancelled=1`
    });

    const { error: attachError } = await admin.rpc("attach_payment_checkout", {
      p_payment_id: claim.payment_id,
      p_claim_token: claimToken,
      p_provider_session_id: session.id,
      p_checkout_url: session.url,
      p_charged_amount_php: amountPhp,
      p_fx_rate_usd_php: rate,
    });
    if (attachError) throw paymentStateError(attachError, "Checkout was created but could not be attached to the invoice.");

    redirect(session.url);
  } catch (error) {
    if (error && typeof error === "object" && String((error as { digest?: unknown }).digest || "").startsWith("NEXT_REDIRECT")) throw error;
    await admin.rpc("release_payment_checkout_claim", {
      p_payment_id: paymentId,
      p_claim_token: claimToken,
      p_reason: error instanceof Error ? error.message.slice(0, 300) : "checkout_creation_failed",
    });
    throw error;
  }
}

export async function releasePayoutAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const paymentId = String(formData.get("payment_id") ?? "");
  const note = String(formData.get("release_note") ?? "").trim();
  const admin = createAdminClient();

  const { error } = await admin.rpc("transition_payment_state", {
    p_payment_id: paymentId,
    p_expected_status: "paid",
    p_new_status: "released",
    p_actor_id: user.id,
    p_source: "admin_payout",
    p_note: note || null,
  });
  if (error) throw paymentStateError(error, "Only paid invoices can be released.");

  revalidatePath("/workspace/admin/payments");
  revalidatePath("/workspace/va/payments");
}

export async function fileDisputeAction(formData: FormData) {
  const { user } = await requireRole("client");
  const paymentId = String(formData.get("payment_id") ?? "");
  const reason = String(formData.get("dispute_reason") ?? "").trim();
  if (!reason || reason.length < 10) throw new Error("Describe the issue in at least a few words so we can review it.");

  const admin = createAdminClient();
  const { data: payment } = await admin.from("payments").select("id,client_id,description").eq("id", paymentId).eq("client_id", user.id).maybeSingle();
  if (!payment) throw new Error("Invoice not found.");

  const { error } = await admin.rpc("transition_payment_state", {
    p_payment_id: paymentId,
    p_expected_status: "paid",
    p_new_status: "disputed",
    p_actor_id: user.id,
    p_source: "client_dispute",
    p_note: reason,
  });
  if (error) throw paymentStateError(error, "Only a paid, not-yet-released invoice can be disputed.");

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

export async function resolveDisputeReleaseAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const paymentId = String(formData.get("payment_id") ?? "");
  const note = String(formData.get("resolution_note") ?? "").trim();
  const admin = createAdminClient();

  const { error } = await admin.rpc("transition_payment_state", {
    p_payment_id: paymentId,
    p_expected_status: "disputed",
    p_new_status: "paid",
    p_actor_id: user.id,
    p_source: "admin_dispute_resolution",
    p_note: note ? `Released after review: ${note}` : "Released after review",
  });
  if (error) throw paymentStateError(error, "This invoice is not currently disputed.");

  revalidatePath("/workspace/admin/payments");
  revalidatePath("/workspace/client/payments");
}

export async function resolveDisputeRefundAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const paymentId = String(formData.get("payment_id") ?? "");
  const note = String(formData.get("resolution_note") ?? "").trim();
  const admin = createAdminClient();

  const { data: payment, error } = await admin
    .from("payments")
    .select("status,provider_payment_id,charged_amount_php")
    .eq("id", paymentId)
    .single();
  if (error || !payment) throw new Error("Invoice not found.");
  if (payment.status !== "disputed") throw new Error("This invoice is not currently disputed.");
  if (!payment.provider_payment_id) throw new Error("No PayMongo payment resource is on file for this invoice. Reconcile the provider payment before refunding.");

  const chargedAmountPhp = Number(payment.charged_amount_php);
  if (!Number.isFinite(chargedAmountPhp) || chargedAmountPhp <= 0) {
    throw new Error("Refund blocked: the settled PHP charge amount is missing. Reconcile this payment with PayMongo before refunding.");
  }

  const { error: claimError } = await admin.rpc("transition_payment_state", {
    p_payment_id: paymentId,
    p_expected_status: "disputed",
    p_new_status: "refund_pending",
    p_actor_id: user.id,
    p_source: "admin_dispute_resolution",
    p_note: note ? `Refund requested: ${note}` : "Refund requested",
  });
  if (claimError) throw paymentStateError(claimError, "This dispute changed before the refund could start.");

  try {
    const refund = await refundPaymongoPayment(
      payment.provider_payment_id,
      chargedAmountPhp,
      note || "Dispute resolved with refund"
    );
    const providerRefundId = refund.data?.id;
    if (!providerRefundId) throw new Error("PayMongo did not return a refund ID.");

    const { error: recordError } = await admin.rpc("record_payment_refund_requested", {
      p_payment_id: paymentId,
      p_provider_refund_id: providerRefundId,
      p_external_reference: providerRefundId,
    });
    if (recordError) throw recordError;
  } catch (refundError) {
    await admin.rpc("transition_payment_state", {
      p_payment_id: paymentId,
      p_expected_status: "refund_pending",
      p_new_status: "disputed",
      p_actor_id: user.id,
      p_source: "paymongo_refund",
      p_note: refundError instanceof Error ? `Refund failed: ${refundError.message}` : "Refund failed",
    });
    throw refundError;
  }

  // PayMongo's refund webhook is the final source of truth for "refunded".
  revalidatePath("/workspace/admin/payments");
  revalidatePath("/workspace/client/payments");
}
