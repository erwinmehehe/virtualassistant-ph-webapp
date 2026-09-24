import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type PaymentState =
  | "draft"
  | "awaiting_payment"
  | "checkout_pending"
  | "paid"
  | "disputed"
  | "refund_pending"
  | "release_pending"
  | "released"
  | "failed"
  | "refunded"
  | "chargeback"
  | "void";

function firstRow<T>(data: T | T[] | null): T | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

export function paymentStateConflict(error: unknown, current?: PaymentState) {
  const message = String((error as { message?: unknown } | null)?.message || "");
  if (!message.includes("payment_state_conflict:")) return false;
  return current ? message.includes(`payment_state_conflict:${current}:`) : true;
}

export async function transitionPaymentState<T = Record<string, unknown>>(
  admin: AdminClient,
  args: {
    paymentId: string;
    expectedStatus: PaymentState;
    newStatus: PaymentState;
    actorId?: string | null;
    source: string;
    externalRef?: string | null;
    context?: Record<string, unknown>;
  },
): Promise<T> {
  const { data, error } = await admin.rpc("transition_payment_state", {
    p_payment_id: args.paymentId,
    p_expected_status: args.expectedStatus,
    p_new_status: args.newStatus,
    p_actor_id: args.actorId ?? null,
    p_source: args.source,
    p_external_ref: args.externalRef ?? null,
    p_context: args.context ?? {},
  });

  if (error) throw error;
  const row = firstRow(data as T | T[] | null);
  if (!row) throw new Error("Payment transition did not return a payment.");
  return row;
}

export async function claimPaymongoEvent(
  admin: AdminClient,
  args: { eventId: string; eventType: string; resourceId?: string | null },
) {
  const { data, error } = await admin.rpc("claim_payment_provider_event", {
    p_provider: "paymongo",
    p_event_id: args.eventId,
    p_event_type: args.eventType,
    p_resource_id: args.resourceId ?? null,
  });
  if (error) throw error;
  return String(data || "");
}

export async function completePaymongoEvent(
  admin: AdminClient,
  args: {
    eventId: string;
    paymentId?: string | null;
    resourceId?: string | null;
    status?: "processed" | "ignored" | "orphan" | "error";
    errorMessage?: string | null;
  },
) {
  const { error } = await admin.rpc("complete_payment_provider_event", {
    p_provider: "paymongo",
    p_event_id: args.eventId,
    p_payment_id: args.paymentId ?? null,
    p_resource_id: args.resourceId ?? null,
    p_processing_status: args.status ?? "processed",
    p_error_message: args.errorMessage ?? null,
  });
  if (error) throw error;
}
