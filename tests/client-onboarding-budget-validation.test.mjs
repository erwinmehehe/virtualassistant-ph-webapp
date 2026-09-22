import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const profileActionPath = new URL("../src/app/actions/profile.ts", import.meta.url);
const onboardingPagePath = new URL("../src/app/workspace/client/onboarding/page.tsx", import.meta.url);

async function runInvalidBudgetSubmission(values) {
  const source = await readFile(profileActionPath, "utf8");
  const start = source.indexOf("export async function completeClientOnboardingAction");
  const end = source.indexOf("\n/**", start);
  assert.ok(start >= 0 && end > start, "completeClientOnboardingAction must remain available");

  const actionSource = source
    .slice(start, end)
    .replace("export async function", "async function")
    .replace("(formData: FormData)", "(formData)");

  let redirectedTo = null;
  const context = {
    MIN_HOURLY_RATE: 6,
    requireRole: async () => ({ user: { id: "client-1" } }),
    redirect: (url) => {
      redirectedTo = url;
      throw new Error("NEXT_REDIRECT");
    },
    createAdminClient: () => {
      throw new Error("Invalid budgets must not reach persistence");
    },
    encodeURIComponent,
    Number,
  };
  const action = vm.runInNewContext(`(() => { ${actionSource}; return completeClientOnboardingAction; })()`, context);
  const formData = { get: (key) => values[key] ?? null };

  await assert.rejects(action(formData), /NEXT_REDIRECT/);
  return redirectedTo;
}

test("invalid onboarding budget returns a field-specific error and preserves both submitted rates", async () => {
  const redirectedTo = await runInvalidBudgetSubmission({
    full_name: "Test Client",
    company_name: "Test Company",
    timezone: "Australia/Sydney",
    hiring_needs: "I need an assistant to manage customer support and scheduling.",
    location: "Sydney",
    budget_min: "12",
    budget_max: "8",
  });

  assert.equal(redirectedTo, "/workspace/client/onboarding?budget_error=invalid_range&budget_min=12&budget_max=8");
});

test("onboarding budget inputs expose the server error as an accessible inline field message", async () => {
  const page = await readFile(onboardingPagePath, "utf8");
  assert.match(page, /import { MIN_HOURLY_RATE } from "@\/lib\/constants"/);
  assert.match(page, /min={MIN_HOURLY_RATE}/);
  assert.match(
    page,
    /const companyBudgetMin=Math\.max\(Number\(company\?\.budget_min\)\|\|MIN_HOURLY_RATE,MIN_HOURLY_RATE\)/,
  );
  assert.match(page, /<label htmlFor="client-onboarding-budget-min">Min USD\/hr<\/label>/);
  assert.match(page, /<label htmlFor="client-onboarding-budget-max">Max USD\/hr<\/label>/);
  assert.match(page, /id="client-onboarding-budget-min"/);
  assert.match(page, /id="client-onboarding-budget-max"/);
  assert.match(page, /id="client-onboarding-budget-error"/);
  assert.match(page, /aria-describedby={budgetError \? "client-onboarding-budget-error" : undefined}/);
  assert.match(page, /aria-invalid={Boolean\(budgetError\)}/);
  assert.match(page, /The minimum is \$\{MIN_HOURLY_RATE\}\/hr, and the maximum cannot be lower than the minimum\./);
});
