import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const IDV_CONSENT_VERSION = "2026-10-24";
export const IDV_STATUS_PATH = "/workspace/va/identity";

export type IdvStatus = "initiating" | "pending" | "verified" | "needs_review" | "retry" | "expired" | "error" | "sandbox_approved";

type DiditFeature = { status?: unknown };
type DiditDecision = {
  id_verifications?: DiditFeature[];
  liveness_checks?: DiditFeature[];
  face_matches?: DiditFeature[];
};

export type DiditEvent = {
  event_id: string;
  webhook_type: string;
  timestamp: number;
  created_at: number;
  session_id: string;
  workflow_id: string;
  environment: string;
  vendor_data: string;
  status: string;
  decision?: DiditDecision;
};

export type DiditConfig = {
  apiKey: string;
  workflowId: string;
  webhookSecret: string;
  callback: string;
  environment: "live" | "sandbox";
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function diditConfiguration(): DiditConfig | null {
  if (process.env.DIDIT_IDV_ENABLED !== "true") return null;
  const apiKey = process.env.DIDIT_API_KEY || "";
  const workflowId = process.env.DIDIT_WORKFLOW_ID || "";
  const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET || "";
  const callback = process.env.DIDIT_RETURN_URL || "";
  const environment = process.env.DIDIT_ENVIRONMENT;
  if (!apiKey || !uuid.test(workflowId) || !webhookSecret || !callback ||
    (environment !== "live" && environment !== "sandbox")) return null;
  try {
    const url = new URL(callback);
    if (url.protocol !== "https:" || url.pathname !== IDV_STATUS_PATH ||
        url.search || url.hash || url.username || url.password) return null;
  } catch {
    return null;
  }
  return { apiKey, workflowId, webhookSecret, callback, environment };
}

export function isExpectedDiditRedirect(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname === "verify.didit.me" &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

function equalHexSha256(actual: string | null, expected: string): boolean {
  if (!actual || !/^[a-f0-9]{64}$/i.test(actual)) return false;
  const a = Buffer.from(actual.toLowerCase(), "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Validate the *whole raw body*, not just the easily spoofed status envelope. */
export function verifyDiditWebhook(raw: Buffer, headers: Headers, config: DiditConfig): DiditEvent | null {
  if (raw.length === 0 || raw.length > 128 * 1024) return null;
  const timestampHeader = headers.get("x-timestamp");
  if (!timestampHeader || !/^\d{10}$/.test(timestampHeader)) return null;
  const timestamp = Number(timestampHeader);
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return null;
  const expected = createHmac("sha256", config.webhookSecret).update(raw).digest("hex");
  if (!equalHexSha256(headers.get("x-signature"), expected)) return null;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
    if (!payload || Array.isArray(payload) || typeof payload !== "object") return null;
  } catch {
    return null;
  }
  if (payload.timestamp !== timestamp || typeof payload.event_id !== "string" ||
    !uuid.test(payload.event_id) || typeof payload.session_id !== "string" ||
    !uuid.test(payload.session_id) || typeof payload.vendor_data !== "string" ||
    !uuid.test(payload.vendor_data) || typeof payload.workflow_id !== "string" ||
    payload.workflow_id !== config.workflowId || payload.environment !== config.environment ||
    typeof payload.created_at !== "number" || !Number.isSafeInteger(payload.created_at) || payload.created_at <= 0 ||
    !["status.updated", "data.updated"].includes(String(payload.webhook_type)) ||
    typeof payload.status !== "string") return null;

  return payload as unknown as DiditEvent;
}

export function outcomeFromDidit(event: DiditEvent): IdvStatus | null {
  if (event.status === "Approved") {
    // A manually overridden overall verdict without all 3 completed controls
    // is not enough to issue a verified identity badge automatically.
    const decision = event.decision;
    const passed = (features: DiditFeature[] | undefined) =>
      Array.isArray(features) && features.length > 0 &&
      features.every((feature) => feature?.status === "Approved");
    if (!decision || !passed(decision.id_verifications) ||
      !passed(decision.liveness_checks) || !passed(decision.face_matches)) return "needs_review";
    return event.environment === "live" ? "verified" : "sandbox_approved";
  }
  if (event.status === "In Review" || event.status === "Declined") return "needs_review";
  if (event.status === "Kyc Expired") return "expired";
  if (["Resubmitted", "Expired", "Abandoned"].includes(event.status)) return "retry";
  if (["Not Started", "In Progress"].includes(event.status)) return "pending";
  return null;
}

export function identityStatusLabel(status: IdvStatus | null): string {
  switch (status) {
    case "verified": return "Government ID verified";
    case "sandbox_approved": return "Sandbox verification complete (not an official ID check)";
    case "pending": case "initiating": return "Verification in progress";
    case "needs_review": return "Additional review needed";
    case "retry": return "Verification can be retried";
    case "expired": return "Verification expired";
    case "error": return "Verification unavailable";
    default: return "Not yet verified";
  }
}
