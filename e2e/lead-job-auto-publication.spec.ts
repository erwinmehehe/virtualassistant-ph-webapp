import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test("public VA matching stays private even when an attacker forges a listing opt-in", async ({ page }) => {
  test.setTimeout(110_000);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  // This fixture creates and deletes jobs. NEVER run it against a remote DB.
  if (!base || !["localhost", "127.0.0.1", "::1"].includes(new URL(base).hostname) || !key) {
    throw new Error("Public hiring E2E requires loopback Supabase and the isolated test service key.");
  }
  const admin = createClient(base, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // The test webServer enables the public rollout feature flag, but free VA
  // matching must remain private. Never run this fixture against production.
  const created: string[] = [];

  async function submitRequest(injectForgedOptIn: boolean, brief = "We are hiring a remote administrative Virtual Assistant to handle calendar coordination, shared inbox routing, customer appointment confirmations, follow-up logs, and weekly status reporting.") {
    const code = crypto.randomUUID().slice(0, 10);
    const company = `E2E Private VA Match ${code}`;
    await page.goto("/hire");
    await expect(page.locator('input[name="public_listing_consent"]')).toHaveCount(0);
    await expect(page.getByText(/I consent to VAPH considering this opening/)).toHaveCount(0);
    await page.getByLabel("Type of help").selectOption({ label: "Administrative Support" });
    await page.getByLabel("First name").fill("E2E Employer");
    await page.getByLabel("Work email").fill(`job-release-${code}@example.test`);
    await page.getByRole("textbox", { name: "Company name", exact: true }).fill(company);
    await page.getByLabel("Hours per week").selectOption({ label: "20 to 30 hours/week" });
    await page.getByLabel("Hourly budget").selectOption({ label: "USD 8 to 12/hour" });
    await page.getByLabel("What should your VA handle?").fill(brief);
    if (injectForgedOptIn) {
      // A forged or stale opt-in field must never bypass private matching.
      await page.locator("form.hb-form").evaluate((form) => {
        const forged = document.createElement("input");
        forged.type = "hidden";
        forged.name = "public_listing_consent";
        forged.value = "yes";
        form.appendChild(forged);
      });
    }
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
    expect(job.status).toBe("pending");
    expect(Boolean(job.recruiter_managed_public)).toBe(false);
    expect(job.published_at).toBeNull();
    await page.goto("/jobs");
    await expect(page.getByText(company)).toHaveCount(0);
    return { company, job };
  }

  try {
    await submitRequest(false);
    await submitRequest(true);
  } finally {
    for (const leadId of created) {
      await admin.from("lead_intake").update({ job_id: null }).eq("id", leadId);
      await admin.from("jobs").delete().eq("lead_id", leadId);
      await admin.from("lead_intake").delete().eq("id", leadId);
    }
  }
});
