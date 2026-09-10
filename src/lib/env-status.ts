import "server-only";

function hasText(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

function senderLooksConfigured(value?: string) {
  if (!hasText(value)) return false;
  const normalized = value!.toLowerCase();
  return !normalized.includes("example.com") && normalized.includes("@");
}

export type RuntimeSetupStatus = {
  leadIngest: {
    configured: boolean;
    detail: string;
  };
  appEmail: {
    configured: boolean;
    detail: string;
  };
  appUrl: {
    configured: boolean;
    detail: string;
  };
  authEmail: {
    configured: null;
    detail: string;
  };
  deployment: {
    configured: boolean;
    environment: string;
    commitSha: string | null;
    host: string | null;
    detail: string;
  };
};

export function getRuntimeSetupStatus(): RuntimeSetupStatus {
  const leadSecret = process.env.LEAD_INGEST_SECRET?.trim() || "";
  const hasResend = hasText(process.env.RESEND_API_KEY);
  const hasSender = senderLooksConfigured(process.env.EMAIL_FROM);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
  const productionUrlLooksReady = /^https:\/\//i.test(appUrl) && !/localhost|127\.0\.0\.1/i.test(appUrl);
  const deploymentEnvironment = process.env.VERCEL_ENV?.trim() || process.env.NODE_ENV || "unknown";
  const deploymentCommit = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null;
  const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim() || null;
  const deploymentIdentified = deploymentEnvironment === "production" && Boolean(deploymentCommit);

  return {
    leadIngest: {
      configured: leadSecret.length >= 32,
      detail: leadSecret.length >= 32
        ? "Server-to-server lead ingestion is protected by a configured secret."
        : "Set LEAD_INGEST_SECRET to a random value of at least 32 characters. The API route fails closed until it is configured."
    },
    appEmail: {
      configured: hasResend && hasSender,
      detail: hasResend && hasSender
        ? "Resend API delivery and a non-placeholder sender are configured for app notifications."
        : "Set RESEND_API_KEY and EMAIL_FROM to a verified sender before relying on application or lead notification emails."
    },
    appUrl: {
      configured: productionUrlLooksReady,
      detail: productionUrlLooksReady
        ? `Production app URL is ${appUrl}.`
        : "Set NEXT_PUBLIC_APP_URL to the final HTTPS production origin before launch."
    },
    authEmail: {
      configured: null,
      detail: "Supabase Auth SMTP is configured outside this app. Verify custom SMTP in Supabase Authentication > Email > SMTP Settings."
    },
    deployment: {
      configured: deploymentIdentified,
      environment: deploymentEnvironment,
      commitSha: deploymentCommit,
      host: deploymentHost,
      detail: deploymentIdentified
        ? `Production is reporting commit ${deploymentCommit?.slice(0, 8)}${deploymentHost ? ` on ${deploymentHost}` : ""}.`
        : "This runtime does not expose a production deployment commit. Confirm the serving platform before declaring the release live."
    }
  };
}
