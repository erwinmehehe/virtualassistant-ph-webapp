import { task, wait } from "@trigger.dev/sdk";

type OfferClientConfirmationPayload = {
  offerId: string;
  acceptedAt: string;
};

async function callback(
  payload: OfferClientConfirmationPayload,
  checkpoint: "4h" | "24h",
) {
  const secret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  const base = (
    process.env.VAPH_APP_URL || "https://virtualassistant.com.ph"
  ).replace(/\/$/, "");
  if (secret.length < 32) {
    throw new Error("AUTOMATION_CALLBACK_SECRET is not configured.");
  }

  const response = await fetch(`${base}/api/internal/automation/post-hire`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind: "offer_client_confirmation",
      offerId: payload.offerId,
      acceptedAt: payload.acceptedAt,
      checkpoint,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `VAPH offer confirmation callback failed with status ${response.status}.`,
    );
  }
  return response.json() as Promise<{ done?: boolean }>;
}

export const offerClientConfirmationTask = task({
  id: "vaph-offer-client-confirmation",
  run: async (payload: OfferClientConfirmationPayload) => {
    const acceptedMs = new Date(payload.acceptedAt).getTime();
    if (!Number.isFinite(acceptedMs)) {
      throw new Error("Offer acceptance time is invalid.");
    }

    const firstAt = new Date(acceptedMs + 4 * 60 * 60_000);
    if (firstAt.getTime() > Date.now()) await wait.until({ date: firstAt });

    const first = await callback(payload, "4h");
    if (first.done) return first;

    await wait.for({ hours: 20 });
    return callback(payload, "24h");
  },
});
