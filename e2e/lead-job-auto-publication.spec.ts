import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test("opted-in public hiring request publishes; private request stays out of /jobs", async ({ page }) => {
  test.setTimeout(110_000);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  // This fixture creates and deletes jobs. NEVER run it against a remote DB.
  if (!base || !["localhost", "127.0.0.1", "::1"].includes(new URL(base).hostname) || !key) {
    throw new Error("Public hiring E2E requires loopback Supabase and the isolated test service key.");
  }
  const admin = createClient(base, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // The Playwright webServer explicitly enables the otherwise OFF release flag.
  // Never silently repurpose this destructive isolated fixture for production.
  const created: string[] = [];

  async function submitRequest(optIn: boolean, brief = "We are hiring a remote administrative Virtual Assistant to handle calendar coordination, shared inbox routing, customer appointment confirmations, follow-up logs, and weekly status reporting.", shouldPublish = optIn) {
    const code = crypto.randomUUID().slice(0, 10);
    const company = `E2E Job Release ${code}`;
    await page.goto("/hire");
    await page.getByLabel("Type of help").selectOption({ label: "Administrative Support" });
    await page.getByLabel("First name").fill("E2E Employer");
    await page.getByLabel("Work email").fill(`job-release-${code}@example.test`);
    await page.getByRole("textbox", { name: "Company name", exact: true }).fill(company);
    await page.getByLabel("Hours per week").selectOption({ label: "20 to 30 hours/week" });
    await page.getByLabel("Hourly budget").selectOption({ label: "USD 8 to 12/hour" });
    await page.getByLabel("What should your VA handle?").fill(brief);
    if (optIn) await page.getByRole("checkbox", { name: /I consent to VAPH considering this opening/ }).check();
    await page.getByRole("button", { name: /Get your free virtual assistant match/ }).click();
    await expect(page).toHaveURL(/\/hire\/?\?sent=1/);
    const leadId = new URL(page.url()).searchParams.get("lead");
    expect(leadId).toBeTruthy();
    created.push(leadId!);
    const { data: job, error } = await admin.from("jobs")
      .select("id,status,client_id,recruiter_managed_public,min_hourly_rate,published_at,expires_at")
      .eq("lead_id", leadId!).single();
    if (error || !job) throw error || new Error("Request did not create a role.");
    expect(job.client_id).toBeNull();
    expect(job.min_hourly_rate).toBe(8);
    expect(job.status).toBe(shouldPublish ? "published" : "pending");
    expect(Boolean(job.recruiter_managed_public)).toBe(shouldPublish);
    if (shouldPublish) {
      expect(job.published_at).not.toBeNull();
      expect(job.expires_at).not.toBeNull();
    }
    return { company, job };
  }

  try {
    const publicJob = await submitRequest(true);
    await page.goto("/jobs");
    await expect(page.getByText(publicJob.company)).toBeVisible();
    const privateJob = await submitRequest(false);
    await page.goto("/jobs");
    await expect(page.getByText(privateJob.company)).toHaveCount(0);
    // Even with explicit opt-in, off-platform contact details must keep a lead private.
    const unsafeJob = await submitRequest(true,
      "We need an administrative VA to schedule calls, manage follow-up records, and prepare weekly reports. For off-platform communication, email hiring-privacy-check@example.test directly instead of using VAPH.",
      false
    );
    await page.goto("/jobs");
    await expect(page.getByText(unsafeJob.company)).toHaveCount(0);
  } finally {
    for (const leadId of created) {
      await admin.from("lead_intake").update({ job_id: null }).eq("id", leadId);
      await admin.from("jobs").delete().eq("lead_id", leadId);
      await admin.from("lead_intake").delete().eq("id", leadId);
    }
  }
});
