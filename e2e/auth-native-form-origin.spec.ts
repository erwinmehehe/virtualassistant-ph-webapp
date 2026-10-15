import { expect, test } from "@playwright/test";

// A native POST matters here: fetch()-based Server Actions can keep a normal
// Origin header even when HTML form submissions send "Origin: null".
test.use({ javaScriptEnabled: false });

function requireLoopback(value: string | undefined, label: string) {
  if (!value) throw new Error(label + " must be configured for the isolated auth test.");
  const url = new URL(value);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error(label + " must use an isolated loopback endpoint, never production.");
  }
  return url;
}

test("native login form keeps a parseable same-origin Origin header", async ({ page }) => {
  const app = requireLoopback(process.env.E2E_BASE_URL, "E2E_BASE_URL");
  requireLoopback(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const password = process.env.E2E_PASSWORD;
  if (!password) throw new Error("E2E_PASSWORD is required for the disposable local login.");

  const response = await page.goto("/auth/login?next=%2Fworkspace%2Fclient");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["referrer-policy"]).toBe("same-origin");

  const submission = page.waitForRequest(request => {
    const url = new URL(request.url());
    return request.method() === "POST" && url.origin === app.origin && url.pathname === "/auth/login";
  });

  await page.getByLabel("Email").fill("client.e2e@example.test");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();

  // Next.js 15 Server Actions throw HTTP 500 when the navigation-mode POST
  // carries Origin: null. The same-origin referrer policy prevents that case.
  const formPost = await submission;
  expect(formPost.headers()["origin"]).toBe(app.origin);
  await expect(page).toHaveURL(/\/workspace\/client\/?$/, { timeout: 25_000 });
  // JavaScript is intentionally disabled to force the native form POST path.
  // The authenticated workspace shell server-renders, but its streaming
  // dashboard can remain at its Suspense fallback without hydration.
  // Confirm a real signed-in client session rather than a hydrated heading.
  await expect(page.getByRole("navigation", { name: "Workspace navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to Client workspace home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open account settings" })).toContainText("E2E Client");
});
