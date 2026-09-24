"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymongoCheckoutSession, refundPaymongoPayment, usdToPhp } from "@/lib/paymongo";
import { paymentStateConflict, transitionPaymentState } from "@/lib/payment-state";

type PaymentRow = {
  id: string;
  client_id: string;
  va_id: string | null;
  description: string;
  amount_total: number | string;
  charged_amount_php: number | string | null;
  provider_payment_id: string | null;
  provider_refund_id?: string | null;
  provider_refund_status?: string | null;
  status: string;
};

function revalidatePayments() {
  revalidatePath("/workspace/admin/payments");
  revalidatePath("/workspace/client/payments");
  revalidatePath("/workspace/va/payments");
}

/**
 * Admin creates a ledger entry for what a client owes for a workroom. This
 * records VA compensation only; platform/service fees are separate.
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
  const { data: workroom, error: wErr } = await admin
    .from("workrooms")
    .select("id,job_id,client_id,va_id")
    .eq("id", workroomId)
    .single();
  if (wErr || !workroom) throw new Error("Workroom not found.");

  const { error } = await admin.from("payments").insert({
    workroom_id: workroom.id,
    job_id: workroom.job_id,
    client_id: workroom.client_id,
    va_id: workroom.va_id,
    description,
    amount_total: amountTotal,
    platform_cut_percent: 0,
    status: "awaiting_payment",
  });
  if (error) throw error;

  revalidatePayments();
}

/**
 * Claim checkout atomically before contacting PayMongo. Concurrent submits
 * either reuse the already-created hosted checkout URL or see the in-progress
 * claim; they cannot create two independent Checkout Sessions for one invoice.
 * The PayMongo request also uses a deterministic idempotency key.
 */
export async function createCheckoutSessionAction(formData: FormData) {
  const { user } = await requireRole("client");
  const paymentId = String(formData.get("payment_id") ?? "");
  if (!paymentId) throw new Error("Invoice not found.");

  const admin = createAdminClient();
  const claimToken = randomUUID();
  const { data, error } = await admin.rpc("claim_payment_checkout", {
    p_payment_id: paymentId,
    p_client_id: user.id,
    p_claim_token: claimToken,
  });
  if (error) {
    if (String(error.message || "").includes("payment_not_awaiting_checkout")) {
      throw new Error("This invoice is no longer awaiting payment.");
    }
    throw error;
  }

  const claim = (Array.isArray(data) ? data[0] : data) as {
    claim_state: string;
    payment_id: string;
    amount_total: number | string;
    description: string;
    checkout_url: string | null;
    claim_token: string;
    idempotency_key: string;
  } | null;
  if (!claim) throw new Error("Could not prepare this payment.");

  if (claim.claim_state === "ready" && claim.checkout_url) redirect(claim.checkout_url);
  if (claim.claim_state === "in_progress") {
    throw new Error("Checkout is already being prepared. Please try Pay now again in a moment.");
  }
  if (claim.claim_state !== "claimed" || !claim.idempotency_key) {
    throw new Error("Could not claim this invoice for checkout.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const { amountPhp, rate } = await usdToPhp(Number(claim.amount_total));
    const session = await createPaymongoCheckoutSession({
      amountPhp,
      description: claim.description,
      referenceNumber: claim.payment_id,
      successUrl: `${appUrl}/workspace/client/payments?paid=1`,
      cancelUrl: `${appUrl}/workspace/client/payments?cancelled=1`,
      idempotencyKey: claim.idempotency_key,
    });

    const { error: finalizeError } = await admin.rpc("finalize_payment_checkout", {
      p_payment_id: claim.payment_id,
      p_claim_token: claim.claim_token,
      p_session_id: session.id,
      p_checkout_url: session.url,
      p_amount_php: amountPhp,
      p_fx_rate: rate,
      p_payment_intent: session.paymentIntentId,
    });
    if (finalizeError) throw finalizeError;

    redirect(session.url);
  } catch (checkoutError) {
    if (
      checkoutError &&
      typeof checkoutError === "object" &&
      String((checkoutError as { digest?: unknown }).digest || "").startsWith("NEXT_REDIRECT")
    ) {
      throw checkoutError;
    }

    await admin.rpc("release_payment_checkout_claim", {
      p_payment_id: claim.payment_id,
      p_claim_token: claim.claim_token,
      p_reason: checkoutError instanceof Error ? checkoutError.message : "checkout_failed",
    });
    throw checkoutError;
  }
}

/**
 * Admin records that the VA was actually paid by the external payout rail.
 * The paid -> released transition is locked in Postgres so it cannot race a
 * client/provider dispute.
 */
export async function releasePayoutAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const paymentId = String(formData.get("payment_id") ?? "");
  const note = String(formData.get("release_note") ?? "").trim();

  try {
    await transitionPaymentState(createAdminClient(), {
      paymentId,
      expectedStatus: "paid",
      newStatus: "released",
      actorId: user.id,
      source: "admin_payout_release",
      externalRef: note || null,
      context: {
        released_by: user.id,
        release_note: note || null,
        released_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (paymentStateConflict(error)) {
      throw new Error("This payment changed while you were reviewing it. Refresh before releasing payout.");
    }
    throw error;
  }

  revalidatePayments();
}

/**
 * A client dispute atomically freezes a paid-but-unreleased payment.
 */
export async function fileDisputeAction(formData: FormData) {
  const { user } = await requireRole("client");
  const paymentId = String(formData.get("payment_id") ?? "");
  const reason = String(formData.get("dispute_reason") ?? "").trim();
  if (!reason || reason.length < 10) {
    throw new Error("Describe the issue in at least a few words so we can review it.");
  }

  const admin = createAdminClient();
  let payment: PaymentRow;
  try {
    payment = await transitionPaymentState<PaymentRow>(admin, {
      paymentId,
      expectedStatus: "paid",
      newStatus: "disputed",
      actorId: user.id,
      source: "client_dispute",
      context: {
        disputed_by: user.id,
        disputed_at: new Date().toISOString(),
        dispute_reason: reason,
        dispute_source: "client",
      },
    });
  } catch (error) {
    if (paymentStateConflict(error)) {
      throw new Error("This payment changed before the dispute was submitted. Refresh the page and review its current status.");
    }
    throw error;
  }

  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((a) => ({
        user_id: a.id,
        title: "Payment disputed",
        body: `A client disputed "${payment.description}". Payout is frozen until this is resolved.`,
        href: "/workspace/admin/payments",
      })),
    );
  }

  revalidatePayments();
}

/**
 * Resolve a client dispute in favor of release. An open provider dispute
 * blocks this transition at the database layer.
 */
export async function resolveDisputeReleaseAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const paymentId = String(formData.get("payment_id") ?? "");
  const note = String(formData.get("resolution_note") ?? "").trim();

  try {
    await transitionPaymentState(createAdminClient(), {
      paymentId,
      expectedStatus: "disputed",
      newStatus: "paid",
      actorId: user.id,
      source: "admin_dispute_resolution",
      context: {
        dispute_resolution: note ? `Released after review: ${note}` : "Released after review",
        dispute_resolved_at: new Date().toISOString(),
        dispute_resolved_by: user.id,
        dispute_source: "",
      },
    });
  } catch (error) {
    const message = String((error as { message?: unknown } | null)?.message || "");
    if (message.includes("provider_dispute_still_open")) {
      throw new Error("PayMongo still has an open dispute on this payment. Resolve or reconcile that provider dispute first.");
    }
    if (paymentStateConflict(error)) {
      throw new Error("This payment changed while you were reviewing the dispute. Refresh before resolving it.");
    }
    throw error;
  }

  revalidatePayments();
}

/**
 * Refund a disputed PayMongo payment. We first claim the financial transition
 * as refund_pending, then issue the provider refund using a deterministic
 * idempotency key. The exact PHP settled charge is mandatory: USD ledger
 * values are never substituted for a PHP refund amount.
 */
export async function resolveDisputeRefundAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const paymentId = String(formData.get("payment_id") ?? "");
  const note = String(formData.get("resolution_note") ?? "").trim();
  const admin = createAdminClient();

  let payment: PaymentRow;
  try {
    payment = await transitionPaymentState<PaymentRow>(admin, {
      paymentId,
      expectedStatus: "disputed",
      newStatus: "refund_pending",
      actorId: user.id,
      source: "admin_refund_request",
      context: {
        dispute_resolution: note ? `Refund requested: ${note}` : "Refund requested",
        dispute_resolved_by: user.id,
      },
    });
  } catch (error) {
    if (paymentStateConflict(error)) {
      throw new Error("This payment changed while you were preparing the refund. Refresh before retrying.");
    }
    throw error;
  }

  const chargedPhp = Number(payment.charged_amount_php);
  if (!payment.provider_payment_id || !Number.isFinite(chargedPhp) || chargedPhp <= 0) {
    await transitionPaymentState(admin, {
      paymentId,
      expectedStatus: "refund_pending",
      newStatus: "disputed",
      actorId: user.id,
      source: "refund_reconciliation_required",
      context: {
        dispute_resolution:
          "Refund blocked: the PayMongo payment ID or settled PHP charge is missing and must be reconciled first.",
      },
    });
    throw new Error("Refund blocked until the PayMongo payment and exact PHP charge are reconciled.");
  }

  let refund: Awaited<ReturnType<typeof refundPaymongoPayment>>;
  try {
    refund = await refundPaymongoPayment(
      payment.provider_payment_id,
      chargedPhp,
      note || "Dispute resolved with refund",
      `payment-refund-${paymentId}`,
    );
  } catch (refundError) {
    try {
      await transitionPaymentState(admin, {
        paymentId,
        expectedStatus: "refund_pending",
        newStatus: "disputed",
        actorId: user.id,
        source: "paymongo_refund_failed",
        context: {
          dispute_resolution: `Refund request failed: ${refundError instanceof Error ? refundError.message : "PayMongo error"}`,
        },
      });
    } catch {
      // A webhook may already have reconciled the payment into another final state.
    }
    throw refundError;
  }

  try {
    await transitionPaymentState(admin, {
      paymentId,
      expectedStatus: "refund_pending",
      newStatus: "refund_pending",
      actorId: user.id,
      source: "paymongo_api",
      externalRef: refund.id,
      context: {
        provider_refund_id: refund.id,
        provider_refund_status: refund.status,
      },
    });

    if (refund.status === "succeeded") {
      await transitionPaymentState(admin, {
        paymentId,
        expectedStatus: "refund_pending",
        newStatus: "refunded",
        actorId: user.id,
        source: "paymongo_api",
        externalRef: refund.id,
        context: {
          provider_refund_id: refund.id,
          provider_refund_status: refund.status,
          dispute_resolution: note ? `Refunded: ${note}` : "Refunded",
          dispute_resolved_at: new Date().toISOString(),
          dispute_resolved_by: user.id,
        },
      });
    }
  } catch (error) {
    // A fast PayMongo webhook can legitimately win the race and mark the row
    // refunded before the synchronous API response is persisted.
    if (!paymentStateConflict(error, "refunded")) throw error;
  }

  revalidatePayments();
}
