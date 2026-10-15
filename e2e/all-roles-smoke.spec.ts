import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

type Route = { name: string; path: string };
type RoleScenario = {
  role: string;
  email?: string;
  home: string;
  routes: Route[];
  navigation: { from: string; href: string; destination: string };
};
type Viewport = { name: string; width: number; height: number };
type Audit = {
  route: string;
  status: number | null;
  resolvedPath: string | null;
  findings: string[];
  image: string;
};

const PASSWORD = process.env.E2E_PASSWORD || "E2e-Only!Pass12345";
const OUTPUT = path.resolve("artifacts/all-roles-smoke");
const VIEWPORTS: Viewport[] = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const SCENARIOS: RoleScenario[] = [
  {
    role: "public",
    home: "/",
    routes: [
      { name: "homepage", path: "/" },
      { name: "hire", path: "/hire" },
      { name: "jobs", path: "/jobs" },
      { name: "training-catalogue", path: "/training" },
      { name: "contact", path: "/contact" },
      { name: "booking", path: "/book-client-call" },
      { name: "login", path: "/auth/login" },
      { name: "va-signup", path: "/auth/join/va" },
    ],
    navigation: { from: "/", href: "#hero-hiring-form", destination: "#hero-hiring-form" },
  },
  {
    role: "client",
    email: "client.e2e@example.test",
    home: "/workspace/client",
    routes: [
      { name: "dashboard", path: "/workspace/client" },
      { name: "jobs", path: "/workspace/client/jobs" },
      { name: "new-job", path: "/workspace/client/jobs/new" },
      { name: "company", path: "/workspace/client/company" },
      { name: "messages", path: "/workspace/client/messages" },
      { name: "payments", path: "/workspace/client/payments" },
    ],
    navigation: { from: "/workspace/client", href: "/workspace/client/jobs/new", destination: "/workspace/client/jobs/new" },
  },
  {
    role: "va",
    email: "va.e2e@example.test",
    home: "/workspace/va",
    routes: [
      { name: "dashboard", path: "/workspace/va" },
      { name: "profile", path: "/workspace/va/profile" },
      { name: "jobs", path: "/workspace/va/jobs" },
      { name: "applications", path: "/workspace/va/applications" },
      { name: "vetting", path: "/workspace/va/vetting" },
      { name: "work-readiness", path: "/workspace/va/work-readiness" },
    ],
    navigation: { from: "/workspace/va", href: "/workspace/va/jobs", destination: "/workspace/va/jobs" },
  },
  {
    role: "recruiter",
    email: "recruiter.e2e@example.test",
    home: "/workspace/recruiter/today",
    routes: [
      { name: "today", path: "/workspace/recruiter/today" },
      { name: "roles", path: "/workspace/recruiter/roles" },
      { name: "talent", path: "/workspace/recruiter/talent" },
      { name: "crm", path: "/workspace/recruiter/crm" },
      { name: "discovery", path: "/workspace/recruiter/discovery" },
      { name: "messages", path: "/workspace/recruiter/messages" },
    ],
    navigation: { from: "/workspace/recruiter/today", href: "/workspace/recruiter/roles", destination: "/workspace/recruiter/roles" },
  },
  {
    role: "admin",
    email: "admin.e2e@example.test",
    home: "/workspace/admin/today",
    routes: [
      { name: "today", path: "/workspace/admin/today" },
      { name: "leads", path: "/workspace/admin/leads" },
      { name: "users", path: "/workspace/admin/users" },
      { name: "jobs", path: "/workspace/admin/jobs" },
      { name: "training", path: "/workspace/admin/training" },
      { name: "funnel", path: "/workspace/admin/funnel" },
    ],
    navigation: { from: "/workspace/admin/today", href: "/workspace/admin/funnel", destination: "/workspace/admin/funnel" },
  },
  {
    // Learning is an authenticated workspace shared across existing account roles.
    role: "learner",
    email: "va.e2e@example.test",
    home: "/workspace/training",
    routes: [
      { name: "training-home", path: "/workspace/training" },
      { name: "foundations-course", path: "/workspace/training/courses/virtual-assistant-foundations" },
      { name: "training-account", path: "/workspace/training/account" },
    ],
    navigation: { from: "/workspace/training", href: "/training", destination: "/training" },
  },
  {
    // Client Success is an admin/recruiter-only function, not a fifth account role.
    role: "client-success",
    email: "recruiter.e2e@example.test",
    home: "/workspace/client-success",
    routes: [
      { name: "placements", path: "/workspace/client-success" },
      { name: "support", path: "/workspace/client-success/support" },
      { name: "retention", path: "/workspace/client-success/retention" },
    ],
    navigation: { from: "/workspace/client-success", href: "/workspace/client-success/support", destination: "/workspace/client-success/support" },
  },
];

function isLoopbackUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

function assertIsolatedEnvironment() {
  const app = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  const database = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!isLoopbackUrl(app) || !isLoopbackUrl(database)) {
    throw new Error("Role smoke tests require a loopback app AND an isolated loopback Supabase database. Refusing remote credentials or production data.");
  }
}

function safeMessage(raw: unknown): string {
  return String(raw || "")
    .replace(/(?:eyJ[a-zA-Z0-9_-]{12,}[.][a-zA-Z0-9_.-]+)/g, "[redacted-token]")
    .replace(/(password|token|secret|authorization)[\s:=]+[^\s]+/gi, "$1=[redacted]")
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}/gi, "[redacted-email]")
    .replace(/https?:\/\/[^\s]+/g, "[redacted-url]")
    .slice(0, 260);
}

function samePath(value: string, expected: string) {
  return (value.replace(/\/+$/, "") || "/") === (expected.replace(/\/+$/, "") || "/");
}

async function signIn(page: Page, email: string, next: string) {
  await page.goto("/auth/login?next=" + encodeURIComponent(next), { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /^Log in(?: to training)?$/ }).click();
  await page.waitForURL(url => samePath(url.pathname, next), { timeout: 25_000 });
}

async function auditRoute(page: Page, route: Route, screenshotPath: string): Promise<Audit> {
  const findings: string[] = [];
  const errors = { page: [] as string[], console: [] as string[], server: [] as string[], network: [] as string[] };
  let status: number | null = null;
  let resolvedPath: string | null = null;

  const onPageError = (error: Error) => errors.page.push(safeMessage(error.message));
  const onConsole = (message: import("@playwright/test").ConsoleMessage) => {
    if (message.type() === "error") errors.console.push(safeMessage(message.text()));
  };
  const onResponse = (response: import("@playwright/test").Response) => {
    if (response.status() >= 500) {
      const url = new URL(response.url());
      // Do not include query strings, tokens or user-supplied values in evidence.
      if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
        errors.server.push(String(response.status()) + " " + url.pathname);
      }
    }
  };
  const onRequestFailed = (request: import("@playwright/test").Request) => {
    const url = new URL(request.url());
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return;
    const reason = request.failure()?.errorText || "unknown network failure";
    // Client-side navigation deliberately aborts stale prefetches; ignore only those cancellations.
    if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(reason)) return;
    errors.network.push(url.pathname + " " + safeMessage(reason));
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);

  try {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 35_000 });
    status = response?.status() ?? null;
    resolvedPath = new URL(page.url()).pathname;

    if (status !== 200) findings.push("Expected HTTP 200, got " + String(status));
    if (!samePath(resolvedPath, route.path)) findings.push("Unexpected redirect to " + resolvedPath);

    try {
      await page.locator("main").first().waitFor({ state: "visible", timeout: 14_000 });
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 14_000 });
    } catch {
      findings.push("Main content or primary heading did not appear");
    }

    // Allow hydration to surface browser runtime errors after streamed HTML loads.
    await page.waitForTimeout(220);
    const ui = await page.evaluate(() => {
      const main = document.querySelector("main") as HTMLElement | null;
      const h1 = Array.from(document.querySelectorAll("h1"))
        .filter(element => element.getClientRects().length > 0);
      const headingRect = h1[0]?.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const controls = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          'input:not([type="hidden"]),textarea,select'
        )
      ).filter(element => {
        const style = getComputedStyle(element);
        return element.getClientRects().length > 0
          && style.visibility !== "hidden"
          && !element.closest('[aria-hidden="true"]');
      });
      const unnamedControls = controls.filter(element => {
        const type = element.getAttribute("type");
        if (type === "submit" || type === "button" || type === "reset") return false;
        return !element.labels?.length
          && !element.getAttribute("aria-label")
          && !element.getAttribute("aria-labelledby")
          && !element.getAttribute("title")
          && !element.getAttribute("placeholder");
      }).length;
      const brokenImages = Array.from(document.images).filter(image =>
        image.getClientRects().length > 0
        && image.complete
        && Boolean(image.currentSrc)
        && image.naturalWidth === 0
      ).length;
      const missingAlt = Array.from(document.images).filter(image =>
        image.getClientRects().length > 0 && !image.hasAttribute("alt")
      ).length;
      return {
        titlePresent: Boolean(document.title.trim()),
        mainTextLength: main?.innerText.trim().length ?? 0,
        visibleH1Count: h1.length,
        primaryHeadingClipped: Boolean(headingRect && (headingRect.left < -2 || headingRect.right > width + 2 || headingRect.width < 1)),
        horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - width),
        unnamedControls,
        brokenImages,
        missingAlt,
        frameworkErrorOverlay: document.querySelectorAll(
          '[data-nextjs-dialog],.vite-error-overlay,[data-react-error-overlay]'
        ).length,
        errorBoundary: /application error:|a client.side exception has occurred|an error occurred in the server components render/i.test(document.body.innerText),
      };
    });

    if (!ui.titlePresent) findings.push("Document title missing");
    if (ui.mainTextLength < 35) findings.push("Main content appears blank or incomplete");
    if (ui.visibleH1Count !== 1) findings.push("Expected one visible H1, found " + ui.visibleH1Count);
    if (ui.primaryHeadingClipped) findings.push("Primary heading is clipped horizontally");
    if (ui.horizontalOverflowPx > 2) findings.push("Document horizontally overflows viewport by " + ui.horizontalOverflowPx + "px");
    if (ui.unnamedControls) findings.push(ui.unnamedControls + " visible form control(s) lack a label");
    if (ui.brokenImages) findings.push(ui.brokenImages + " broken visible image(s)");
    if (ui.missingAlt) findings.push(ui.missingAlt + " visible image(s) lack alt");
    if (ui.frameworkErrorOverlay) findings.push("Framework error overlay present");
    if (ui.errorBoundary) findings.push("Error boundary or application crash text rendered");
  } catch (error) {
    findings.push("Navigation/audit exception: " + safeMessage(error instanceof Error ? error.message : error));
  } finally {
    // Errors raised while taking the screenshot should not hide navigation findings.
    try {
      await page.screenshot({ path: screenshotPath, animations: "disabled", timeout: 15_000 });
    } catch (error) {
      findings.push("Could not capture screenshot: " + safeMessage(error instanceof Error ? error.message : error));
    }
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
    page.off("response", onResponse);
    page.off("requestfailed", onRequestFailed);
  }

  if (errors.page.length) findings.push("JavaScript exceptions: " + errors.page.slice(0, 3).join(" | "));
  if (errors.console.length) findings.push("Console errors: " + errors.console.slice(0, 3).join(" | "));
  if (errors.server.length) findings.push("Server 5xx responses: " + errors.server.slice(0, 3).join(" | "));
  if (errors.network.length) findings.push("Failed local network requests: " + errors.network.slice(0, 3).join(" | "));
  return { route: route.path, status, resolvedPath, findings, image: path.basename(screenshotPath) };
}

async function checkNavigation(page: Page, scenario: RoleScenario): Promise<string[]> {
  const findings: string[] = [];
  try {
    await page.goto(scenario.navigation.from, { waitUntil: "domcontentloaded" });
    const link = page.locator('a[href="' + scenario.navigation.href + '"]:visible').first();
    await link.waitFor({ state: "visible", timeout: 12_000 });
    await link.click({ timeout: 15_000 });
    if (scenario.navigation.destination.startsWith("#")) {
      await page.waitForURL(url => url.hash === scenario.navigation.destination, { timeout: 15_000 });
    } else {
      await page.waitForURL(url => samePath(url.pathname, scenario.navigation.destination), { timeout: 15_000 });
    }
    const linkDestination = new URL(page.url());
    if (scenario.navigation.destination.startsWith("#")
      ? linkDestination.hash !== scenario.navigation.destination
      : !samePath(linkDestination.pathname, scenario.navigation.destination)) {
      findings.push("Click navigation did not reach intended destination");
    }
  } catch (error) {
    findings.push("Interactive navigation failed: " + safeMessage(error instanceof Error ? error.message : error));
  }
  return findings;
}

test.describe("All VAPH roles - isolated visual/runtime smoke", () => {
  test.beforeAll(assertIsolatedEnvironment);

  for (const scenario of SCENARIOS) {
    for (const viewport of VIEWPORTS) {
      test(scenario.role + " / " + viewport.name + " - critical pages and navigation", async ({ page }) => {
        test.setTimeout(240_000);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const directory = path.join(OUTPUT, scenario.role, viewport.name);
        await mkdir(directory, { recursive: true });
        const audited: Audit[] = [];
        const allFindings: string[] = [];

        try {
          if (scenario.email) {
            try {
              await signIn(page, scenario.email, scenario.home);
            } catch (error) {
              allFindings.push("Sign-in failed: " + safeMessage(error instanceof Error ? error.message : error));
            }
          }

          if (allFindings.length === 0) {
            for (const route of scenario.routes) {
              const result = await test.step("Audit " + route.path, () => auditRoute(
                page,
                route,
                path.join(directory, route.name + ".png"),
              ));
              audited.push(result);
              for (const issue of result.findings) {
                allFindings.push(route.path + ": " + issue);
              }
            }

            const navigationFindings = await test.step("Check primary link navigation", () =>
              checkNavigation(page, scenario)
            );
            for (const issue of navigationFindings) allFindings.push("navigation: " + issue);
          }
        } finally {
          await writeFile(
            path.join(directory, "report.json"),
            JSON.stringify({
              persona: scenario.role,
              viewport,
              checkedAt: new Date().toISOString(),
              auditedRoutes: audited.length,
              expectedRoutes: scenario.routes.length,
              routes: audited,
              findings: allFindings,
            }, null, 2) + "\n",
          );
        }
        expect(allFindings, scenario.role + " " + viewport.name + " smoke findings").toEqual([]);
        expect(audited.length, "Every configured route must have been audited").toBe(scenario.routes.length);
      });
    }
  }

  test("anonymous users cannot load protected owner, recruiter, client, VA, or learner pages", async ({ page }) => {
    for (const protectedPath of [
      "/workspace/admin/today",
      "/workspace/recruiter/today",
      "/workspace/client",
      "/workspace/va",
      "/workspace/training",
    ]) {
      await page.goto(protectedPath, { waitUntil: "domcontentloaded" });
      expect(new URL(page.url()).pathname, "Protected path " + protectedPath).toBe("/auth/login");
    }
  });

  test("client and VA sessions cannot open the admin workspace", async ({ page }) => {
    for (const account of [
      { email: "client.e2e@example.test", home: "/workspace/client" },
      { email: "va.e2e@example.test", home: "/workspace/va" },
    ]) {
      await page.context().clearCookies();
      await signIn(page, account.email, account.home);
      await page.goto("/workspace/admin/today", { waitUntil: "domcontentloaded" });
      expect(new URL(page.url()).pathname).toBe(account.home);
    }
  });
});
