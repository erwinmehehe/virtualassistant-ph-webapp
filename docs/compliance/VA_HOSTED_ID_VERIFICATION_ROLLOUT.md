# Hosted VA government-ID verification: launch checklist

Status: **draft, disabled by default**. The integration must not accept live IDs until the DPO/privacy review and the sandbox test plan are signed off.

## Why hosted verification

Use Didit-hosted ID capture, passive liveness and 1:1 face match. VAPH stores no ID photos, ID numbers, facial images, templates, scores or full Didit decision JSON. In the Supabase service-only `va_identity_checks` ledger, store consent version/date, current provider session UUID, status, last signed event ID and a verification timestamp only. Any unsupported document, mismatch or vendor-review result receives a non-punitive review state; no job or recruiter decision is made automatically.

"Government ID verified" means approved provider document authenticity + live-person check + face match. It **does not** claim a real-time PhilSys registry verification. Government-authoritative PhilSys eVerify is a separate service and may require registration as a relying party.

## Organization and legal setup (required before enabling)

1. Review the Philippine Data Privacy Act's sensitive-data, transparency, proportionality, security, cross-border, and data-subject-rights requirements with the organization's DPO. Confirm the legal basis and any necessary consent for biometric processing. Document purpose, applicable impact assessment, staff access, retention, appeals and withdrawal.
2. Review Didit's DPA and subprocessors. Its published service processes data in the EU by default, not necessarily in the Philippines. Configure its Business Console **App Settings > Data retention** to the minimum approved term (for example, 30 days if defensible for VAPH's purpose), rather than leaving the unlimited default. Test the delete-session feature for privacy requests.
3. Turn **off** Didit account-level **Privacy and data use > model training** unless separately assessed and authorized. Data used to verify VAs must not automatically become AI-training data.
4. Confirm the provider supports the exact ID variants VAs submit, including **Philippines National ID** and accepted alternatives; do not assume that all digital IDs or printed formats are supported without testing.
5. Provide a non-biometric/manual review alternative for VAs unable or unwilling to use automated facial verification, and an explanation/appeal route. ID-check failure must not itself reject applicants.
6. Do not expose a client or public image of the raw ID or selfie. Never attach the provider's raw decision JSON to VAPH analytics, logs, emails or CRM.

## Configure the Didit Business Console

1. Create the organization at https://business.didit.me/ with distinct sandbox and live API keys.
2. Create a `KYC` workflow with **ID Verification**, **Passive Liveness**, and **Face Match (1:1)**. Configure the accepted Philippines document variants. Do not turn on AML, credit, or unnecessary demographic checks for basic workforce identity assurance.
3. Create a **V3** webhook destination at
   `https://virtualassistant.com.ph/api/identity/didit`
   with `subscribed_events` containing `status.updated` and `data.updated`. Save the destination's `secret_shared_key` privately.
4. Add the following **server-only** environment variables in Vercel:

   - `DIDIT_IDV_ENABLED=false` initially.
   - `DIDIT_API_KEY=<secret>`.
   - `DIDIT_WORKFLOW_ID=<UUID>`.
   - `DIDIT_WEBHOOK_SECRET=<destination secret_shared_key>`.
   - `DIDIT_ENVIRONMENT=sandbox` for preview tests; use `live` only for approved production launch.
   - `DIDIT_RETURN_URL=https://virtualassistant.com.ph/workspace/va/identity` for the production deployment. Use the appropriate approved HTTPS preview origin in the preview environment.

   **Do not** use `NEXT_PUBLIC_` for API keys, webhook secrets or other provider credentials. Keep sandbox and live configurations strictly separate. The provider is called only by the authenticated VA Server Action and a raw-body signed webhook.

5. Apply the SQL migration `20261024161500_va_hosted_identity_verification.sql` after review and before turning the feature on. Verify RLS enabled and `anon`/`authenticated` cannot select the ledger. No new Supabase Storage bucket is needed.

## End-to-end validation checklist

- Feature **off**: existing vetting and jobs continue working, no ID capture button or Didit API calls.
- VA signed in: `/workspace/va/identity` requires the `va` role; anonymous users and other roles are redirected safely.
- Without explicit checked consent: no verification session begins.
- Start: only the server sends the session request, with the authenticated VA UUID as `vendor_data`; redirect only to `https://verify.didit.me`.
- Sandbox: confirmed approved sandbox event records `sandbox_approved`, but **does not** grant `profiles.identity_verified_at`.
- Signed `live` Approved event: matching user UUID, session UUID, workflow ID, environment and valid HMAC, with each of ID authenticity, liveness and face match `Approved`, grant ID-verified timestamp.
- `Declined`, `In Review`, incomplete checks, blurry camera, expired/abandoned session: show review/retry, never automatic recruiter rejection.
- Forged/unsigned webhook, wrong timestamp, mismatched session/user, wrong environment: cannot grant a verification badge.
- Old or duplicate event: no duplicate side effects.
- Privacy requests: demonstrate the provider's data deletion tools and ledger retention process.
- Provider webhook outage: reconcile unfinished sessions from the decision API or provider dashboard; do not assume two automatic retries are a durable queue.

## Important release gate

The feature must remain disabled until the **DPO/owner approves privacy processing**, the **Didit account and workflow are configured**, the SQL migration is applied, and **sandbox** webhooks pass. Manual `Mark ID verified` remains available for approved alternative verification. Do not change hiring eligibility or public directory inclusion based solely on these automated identity outcomes.

Provider references:
- https://docs.didit.me/integration/api-full-flow
- https://docs.didit.me/integration/webhooks
- https://docs.didit.me/integration/verification-statuses
- https://help.didit.me/data-privacy/delete-verification-data
- https://privacy.gov.ph/data-privacy-act/
