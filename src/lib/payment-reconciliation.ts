import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  retrievePaymongoCheckoutSession,
  retrievePaymongoPayment,
  retrievePaymongoRefund,
  type PaymongoRefundSummary,
} from "@/lib/paymongo";

type PaymentRow = {
  id: string;
  status: string;
  client_id: string;
  description: string | null;
  provider_session_id: string | null;
  provider_payment_id: string | null;
  provider_refund_id: string | null;
  provider_dispute_status: string | null;
};

function latestRefund(refunds: PaymongoRefundSummary[] | undefined) {
  if (!Array.isArray(refunds) || !refunds.length) return null;
  return refunds
    .slice()
    .sort(
      (a, b) =>
        Number(a.attributes?.updated_at || a.attributes?.created_at || 0) -
        Number(b.attributes?.updated_at || b.attributes?.created_at || 0),
    )
    .at(-1) || null;
}

async function notifyAdminsOnce(
  admin: ReturnType<typeof createAdminClient>,
  payment: PaymentRow,
  title: string,
  body: string,
  marker: string,
) {
  const { data: existing } = await admin
    .from("payment_events")
    .select("id")
    .eq("payment_id", payment.id)
    .eq("action", marker)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  await admin.from("payment_events").insert({
    payment_id: payment.id,
    source: "paymongo_reconciliation",
    from_status: payment.status,
    to_status: payment.status,
    action: marker,
    note: body,
  });

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
    })),
  );
}

export async function reconcilePaymongoPayments(limit = 75) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select(
      "id,status,client_id,description,provider_session_id,provider_payment_id,provider_refund_id,provider_dispute_status",
    )
    .eq("provider", "paymongo")
    .in("status", [
      "checkout_pending",
      "paid",
      "disputed",
      "provider_disputed",
      "refund_pending",
      "released",
    ])
    .order("updated_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 150)));

  if (error) throw error;

  let checked = 0;
  let repaired = 0;
  let manualReview = 0;
  const failures: Array<{ paymentId: string; error: string }> = [];

  for (const row of (data || []) as PaymentRow[]) {
    checked += 1;
    let payment = row;

    try {
      if (payment.status === "checkout_pending" && payment.provider_session_id) {
        const checkout = await retrievePaymongoCheckoutSession(payment.provider_session_id);
        const paidPayment = (checkout.data.attributes.payments || [])
          .slice()
          .reverse()
          .find((item) => item.id && item.attributes?.status === "paid");

        if (paidPayment?.id) {
          const { data: paidRow, error: paidError } = await admin.rpc(
            "mark_payment_paid_from_provider",
            {
              p_payment_id: payment.id,
              p_provider_session_id: checkout.data.id,
              p_provider_payment_intent:
                paidPayment.attributes?.payment_intent_id ||
                checkout.data.attributes.payment_intent?.data?.id ||
                null,
              p_provider_payment_id: paidPayment.id,
              p_provider_event_id: "paymongo-reconciliation",
            },
          );
          if (paidError) throw paidError;
          payment = (paidRow as PaymentRow | null) || payment;
          repaired += 1;
        }
      }

      if (!payment.provider_payment_id) continue;

      const providerPayment = await retrievePaymongoPayment(payment.provider_payment_id);
      const attrs = providerPayment.data.attributes || {};

      if (attrs.disputed === true && !["provider_disputed", "chargeback"].includes(payment.status)) {
        const { data: disputedRow, error: disputedError } = await admin.rpc(
          "open_payment_provider_dispute",
          {
            p_payment_id: payment.id,
            p_provider_event_id: "paymongo-reconciliation",
            p_provider_dispute_id: null,
            p_provider_status: "under_review",
            p_reason: "PayMongo Payment resource is flagged as disputed.",
          },
        );
        if (disputedError) throw disputedError;
        payment = (disputedRow as PaymentRow | null) || payment;
        repaired += 1;

        await notifyAdminsOnce(
          admin,
          payment,
          "Provider dispute recovered",
          `PayMongo reports "${payment.description || "a payment"}" as disputed. The webhook event was not fully reconciled, so the payment is frozen for review.`,
          "provider_dispute_recovered",
        );
      } else if (
        attrs.disputed === false &&
        payment.status === "provider_disputed" &&
        ["under_review", "open", "pending", ""].includes(
          String(payment.provider_dispute_status || ""),
        )
      ) {
        const { data: refreshed, error: statusError } = await admin.rpc(
          "open_payment_provider_dispute",
          {
            p_payment_id: payment.id,
            p_provider_event_id: "paymongo-reconciliation",
            p_provider_dispute_id: null,
            p_provider_status: "reconciliation_required",
            p_reason:
              "Payment is no longer flagged disputed, but the provider outcome (won/lost) was not received.",
          },
        );
        if (statusError) throw statusError;
        payment = (refreshed as PaymentRow | null) || payment;
        manualReview += 1;

        await notifyAdminsOnce(
          admin,
          payment,
          "PayMongo dispute outcome needs review",
          `PayMongo no longer flags "${payment.description || "a payment"}" as disputed, but no won/lost event was recorded. Confirm the outcome in the PayMongo dashboard before restoring funds.`,
          "provider_dispute_outcome_review",
        );
      }

      let refund = latestRefund(attrs.refunds);
      if (payment.provider_refund_id) {
        try {
          const exact = await retrievePaymongoRefund(payment.provider_refund_id);
          refund = {
            id: exact.data.id,
            type: "refund",
            attributes: exact.data.attributes,
          };
        } catch {
          // Fall back to any refund information embedded in the Payment resource.
        }
      }

      const refundStatus = String(refund?.attributes?.status || "").toLowerCase();
      if (
        refund?.id &&
        refundStatus === "succeeded" &&
        !["refunded", "chargeback"].includes(payment.status)
      ) {
        const { data: refundedRow, error: refundError } = await admin.rpc(
          "mark_payment_refunded_from_provider",
          {
            p_payment_id: payment.id,
            p_provider_event_id: "paymongo-reconciliation",
            p_provider_refund_id: refund.id,
          },
        );
        if (refundError) throw refundError;
        payment = (refundedRow as PaymentRow | null) || payment;
        repaired += 1;
      } else if (refundStatus === "failed" && payment.status === "refund_pending") {
        const { data: reverted, error: revertError } = await admin.rpc(
          "transition_payment_state",
          {
            p_payment_id: payment.id,
            p_expected_status: "refund_pending",
            p_new_status: "disputed",
            p_actor_id: null,
            p_source: "paymongo_reconciliation",
            p_external_reference: refund?.id || payment.provider_refund_id,
            p_note: "PayMongo reports that the refund failed; manual review is required.",
            p_metadata: {},
          },
        );
        if (revertError) throw revertError;
        payment = (reverted as PaymentRow | null) || payment;
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
    manualReview,
    failed: failures.length,
    failures: failures.slice(0, 10),
  };
}
