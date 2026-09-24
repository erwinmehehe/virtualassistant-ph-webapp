import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  retrievePaymongoCheckoutSession,
  retrievePaymongoPayment,
  retrievePaymongoRefund,
  type PaymongoRefundSummary,
} from "@/lib/paymongo";
import {
  transitionPaymentState,
  type PaymentState,
} from "@/lib/payment-state";

type ReconciliationPayment = {
  id: string;
  status: PaymentState;
  client_id: string;
  va_id: string | null;
  description: string;
  provider_session_id: string | null;
  provider_payment_id: string | null;
  provider_refund_id: string | null;
  provider_refund_status: string | null;
  provider_dispute_status: string | null;
  dispute_source: string | null;
};

function unixToIso(value: unknown) {
  const seconds = Number(value || 0);
  return Number.isFinite(seconds) && seconds > 0
    ? new Date(seconds * 1000).toISOString()
    : new Date().toISOString();
}

function refundFromPayment(
  refunds: PaymongoRefundSummary[] | undefined,
): PaymongoRefundSummary | null {
  if (!Array.isArray(refunds) || !refunds.length) return null;
  return refunds[refunds.length - 1] || null;
}

async function notifyAdmins(
  admin: ReturnType<typeof createAdminClient>,
  payment: ReconciliationPayment,
  title: string,
  body: string,
) {
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("account_status", "active");

  if (!admins?.length) return;
  await admin.from("notifications").insert(
    admins.map((row) => ({
      user_id: row.id,
      title,
      body,
      href: "/workspace/admin/payments",
      type: "payment",
      priority: "high",
    })),
  );
}

async function reconcileRefund(
  admin: ReturnType<typeof createAdminClient>,
  payment: ReconciliationPayment,
  refund: PaymongoRefundSummary | null,
) {
  const refundId = String(refund?.id || payment.provider_refund_id || "").trim() || null;
  const refundStatus = String(refund?.attributes?.status || payment.provider_refund_status || "").trim();
  if (!refundId && !refundStatus) return payment;

  const context = {
    provider_refund_id: refundId,
    provider_refund_status: refundStatus || null,
    provider_last_event_at: new Date().toISOString(),
  };

  if (refundStatus === "succeeded") {
    if (payment.status === "released") {
      const next = await transitionPaymentState<ReconciliationPayment>(admin, {
        paymentId: payment.id,
        expectedStatus: "released",
        newStatus: "chargeback",
        source: "paymongo_api",
        externalRef: refundId,
        context: {
          ...context,
          dispute_resolution:
            "Provider reconciliation found a completed client refund after VA payout had already been released.",
        },
      });
      await notifyAdmins(
        admin,
        next,
        "Released payment was refunded",
        `PayMongo shows a completed refund for "${payment.description}" after VA payout was released. Review the recovery balance.`,
      );
      return next;
    }

    if (["paid", "disputed", "refund_pending", "release_pending"].includes(payment.status)) {
      return transitionPaymentState<ReconciliationPayment>(admin, {
        paymentId: payment.id,
        expectedStatus: payment.status,
        newStatus: "refunded",
        source: "paymongo_api",
        externalRef: refundId,
        context: {
          ...context,
          dispute_resolution: "PayMongo reconciliation confirmed the client refund.",
          dispute_resolved_at: new Date().toISOString(),
        },
      });
    }
  }

  if (["pending", "processing"].includes(refundStatus)) {
    if (["paid", "disputed", "release_pending"].includes(payment.status)) {
      return transitionPaymentState<ReconciliationPayment>(admin, {
        paymentId: payment.id,
        expectedStatus: payment.status,
        newStatus: "refund_pending",
        source: "paymongo_api",
        externalRef: refundId,
        context,
      });
    }
    if (payment.status === "refund_pending") {
      return transitionPaymentState<ReconciliationPayment>(admin, {
        paymentId: payment.id,
        expectedStatus: "refund_pending",
        newStatus: "refund_pending",
        source: "paymongo_api",
        externalRef: refundId,
        context,
      });
    }
  }

  if (refundStatus === "failed" && payment.status === "refund_pending") {
    return transitionPaymentState<ReconciliationPayment>(admin, {
      paymentId: payment.id,
      expectedStatus: "refund_pending",
      newStatus: "disputed",
      source: "paymongo_api",
      externalRef: refundId,
      context: {
        ...context,
        dispute_resolution: "PayMongo reconciliation found a failed refund; manual review is required.",
      },
    });
  }

  return payment;
}

async function reconcileDisputeFlag(
  admin: ReturnType<typeof createAdminClient>,
  payment: ReconciliationPayment,
  disputed: boolean | undefined,
) {
  if (disputed === true) {
    const firstProviderDispute = !["under_review", "open", "pending"].includes(
      String(payment.provider_dispute_status || ""),
    );
    const disputeSource =
      payment.dispute_source === "client"
        ? "client_and_provider"
        : payment.dispute_source || "provider";
    const context = {
      provider_dispute_status: "under_review",
      provider_disputed_at: new Date().toISOString(),
      provider_last_event_at: new Date().toISOString(),
      dispute_source: disputeSource,
      dispute_reason:
        payment.status === "disputed"
          ? undefined
          : "PayMongo payment is flagged as disputed.",
    };

    if (["paid", "release_pending"].includes(payment.status)) {
      const next = await transitionPaymentState<ReconciliationPayment>(admin, {
        paymentId: payment.id,
        expectedStatus: payment.status,
        newStatus: "disputed",
        source: "paymongo_api",
        externalRef: payment.provider_payment_id,
        context,
      });
      if (firstProviderDispute) {
        await notifyAdmins(
          admin,
          next,
          "Provider dispute detected",
          `PayMongo reports a dispute for "${payment.description}". VA payout is frozen pending review.`,
        );
      }
      return next;
    }

    if (payment.status === "disputed" || payment.status === "released") {
      const next = await transitionPaymentState<ReconciliationPayment>(admin, {
        paymentId: payment.id,
        expectedStatus: payment.status,
        newStatus: payment.status,
        source: "paymongo_api",
        externalRef: payment.provider_payment_id,
        context,
      });
      if (firstProviderDispute && payment.status === "released") {
        await notifyAdmins(
          admin,
          next,
          "Dispute detected after VA payout",
          `PayMongo reports a dispute for "${payment.description}" after VA payout was released. Review exposure immediately.`,
        );
      }
      return next;
    }
  }

  if (
    disputed === false &&
    payment.status === "disputed" &&
    payment.dispute_source === "provider" &&
    ["under_review", "open", "pending"].includes(String(payment.provider_dispute_status || ""))
  ) {
    // The Payment resource no longer shows an active dispute, but it does not
    // tell us whether the resolved dispute was won or lost. Keep funds frozen
    // until the dispute.resolved event/dashboard outcome is reconciled.
    return transitionPaymentState<ReconciliationPayment>(admin, {
      paymentId: payment.id,
      expectedStatus: "disputed",
      newStatus: "disputed",
      source: "paymongo_api",
      externalRef: payment.provider_payment_id,
      context: {
        provider_dispute_status: "reconciliation_required",
        provider_last_event_at: new Date().toISOString(),
      },
    });
  }

  return payment;
}

export async function reconcilePaymongoPayments(limit = 75) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select(
      "id,status,client_id,va_id,description,provider_session_id,provider_payment_id,provider_refund_id,provider_refund_status,provider_dispute_status,dispute_source",
    )
    .eq("provider", "paymongo")
    .in("status", [
      "checkout_pending",
      "paid",
      "disputed",
      "refund_pending",
      "release_pending",
      "released",
    ])
    .order("updated_at", { ascending: true })
    .limit(Math.max(1, Math.min(150, limit)));

  if (error) throw error;

  let checked = 0;
  let repaired = 0;
  let expiredCheckout = 0;
  const failures: Array<{ paymentId: string; error: string }> = [];

  for (const source of (data || []) as ReconciliationPayment[]) {
    checked += 1;
    let payment = source;

    try {
      if (payment.provider_session_id && payment.status === "checkout_pending") {
        const checkout = await retrievePaymongoCheckoutSession(payment.provider_session_id);
        const attrs = checkout.data.attributes || {};
        const providerPayment = (attrs.payments || [])
          .slice()
          .reverse()
          .find((item) => item?.id && item.attributes?.status === "paid");

        if (providerPayment?.id) {
          payment = await transitionPaymentState<ReconciliationPayment>(admin, {
            paymentId: payment.id,
            expectedStatus: "checkout_pending",
            newStatus: "paid",
            source: "paymongo_api",
            externalRef: checkout.data.id,
            context: {
              paid_at: unixToIso(providerPayment.attributes?.paid_at),
              provider_session_id: checkout.data.id,
              provider_payment_id: providerPayment.id,
              provider_payment_intent:
                providerPayment.attributes?.payment_intent_id ||
                attrs.payment_intent?.data?.id ||
                null,
              provider_last_event_at: new Date().toISOString(),
            },
          });
          repaired += 1;
        } else if (attrs.status === "expired") {
          const { data: expired, error: expireError } = await admin.rpc(
            "expire_payment_checkout",
            {
              p_payment_id: payment.id,
              p_session_id: payment.provider_session_id,
              p_source: "paymongo_reconciliation",
            },
          );
          if (expireError) throw expireError;
          if (expired) {
            expiredCheckout += 1;
            repaired += 1;
            continue;
          }
        }
      }

      if (!payment.provider_payment_id) continue;

      const providerPayment = await retrievePaymongoPayment(payment.provider_payment_id);
      const attrs = providerPayment.data.attributes || {};

      if (payment.status === "checkout_pending" && attrs.status === "paid") {
        payment = await transitionPaymentState<ReconciliationPayment>(admin, {
          paymentId: payment.id,
          expectedStatus: "checkout_pending",
          newStatus: "paid",
          source: "paymongo_api",
          externalRef: providerPayment.data.id,
          context: {
            paid_at: unixToIso(attrs.paid_at),
            provider_payment_id: providerPayment.data.id,
            provider_payment_intent: attrs.payment_intent_id || null,
            provider_last_event_at: new Date().toISOString(),
          },
        });
        repaired += 1;
      }

      let refund = refundFromPayment(attrs.refunds);
      if (payment.provider_refund_id) {
        try {
          const exactRefund = await retrievePaymongoRefund(payment.provider_refund_id);
          refund = {
            id: exactRefund.data.id,
            type: "refund",
            attributes: exactRefund.data.attributes,
          };
        } catch {
          // The payment resource can still carry enough refund status to
          // reconcile without making the whole maintenance pass fail.
        }
      }

      const beforeRefund = payment.status;
      payment = await reconcileRefund(admin, payment, refund);
      if (payment.status !== beforeRefund) repaired += 1;

      const beforeDispute = payment.status;
      payment = await reconcileDisputeFlag(admin, payment, attrs.disputed);
      if (
        payment.status !== beforeDispute ||
        payment.provider_dispute_status !== source.provider_dispute_status
      ) {
        repaired += 1;
      }
    } catch (reconcileError) {
      failures.push({
        paymentId: payment.id,
        error:
          reconcileError instanceof Error
            ? reconcileError.message
            : String(reconcileError),
      });
    }
  }

  return {
    checked,
    repaired,
    expiredCheckout,
    failed: failures.length,
    failures: failures.slice(0, 10),
  };
}
