import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = String(process.env.PRODUCTION_BASE_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
const outputDir = path.resolve("artifacts/production-browser-smoke");
await fs.mkdir(outputDir, { recursive: true });

const routes = [
  { name: "home", path: "/", status: 200, minText: 200 },
  { name: "hire", path: "/hire", status: 200, minText: 200 },
  { name: "training", path: "/training", status: 200, minText: 200 },
  // Read-only production auth coverage. Never submit forms or consume a real
  // learner's token in the scheduled smoke run.
  { name: "training-login", path: "/auth/login?next=%2Fworkspace%2Ftraining", status: 200, minText: 160 },
  { name: "training-signup", path: "/auth/join/training", status: 200, minText: 190 },
  { name: "password-recovery", path: "/auth/forgot", status: 200, minText: 100 },
  { name: "booking", path: "/book-client-call", status: 200, minText: 150 },
  { name: "contact", path: "/contact", status: 200, minText: 120 },
  { name: "proposal-not-found", path: "/proposal/not-found", status: 404, minText: 20, expectedHeading: "We couldn’t find this hiring proposal." },
];

// Unlike direct URL visits, these read-only journeys exercise real clickable
// links on the public production site. No login, booking or form submission.
const navigationJourneys = [
  {
    name: "home-to-hire",
    from: "/",
    to: "/hire",
    desktopLink: '.site-header a.header-hire-cta[href="/hire"]',
    mobileLink: 'nav[aria-label="Mobile navigation"] a[href="/hire"]',
    openMobileMenu: true,
  },
  {
    name: "home-to-training",
    from: "/",
    to: "/training",
    desktopLink: 'nav[aria-label="Primary navigation"] a[href="/training"]',
    mobileLink: 'nav[aria-label="Mobile navigation"] a[href="/training"]',
    openMobileMenu: true,
  },
  {
    name: "training-signup-to-login",
    from: "/auth/join/training",
    to: "/auth/login",
    label: "Log in and use the same account",
  },
  {
    name: "proposal-recovery-to-contact",
    from: "/proposal/not-found",
    to: "/contact",
    label: "Contact the recruiting team",
  },
];

const browser = await chromium.launch({ headless: true });
const report = [];
const navigationReport = [];
try {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 1000 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      timezoneId: "America/New_York",
    });

    for (const route of routes) {
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const response = await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });

      const status = response?.status() ?? 0;
      // A Next.js not-found boundary can stream after DOMContentLoaded. Wait for
      // the actual recovery content; a bare 404 status is not a passing check.
      if (route.expectedHeading) {
        try {
          await page.getByRole("heading", { name: route.expectedHeading }).waitFor({ state: "visible", timeout: 20000 });
        } catch {
          await page.screenshot({ path: path.join(outputDir, `${route.name}-${viewport.name}-failed.png`), fullPage: true });
          await fs.writeFile(path.join(outputDir, `${route.name}-${viewport.name}-failed.html`), await page.content());
          throw new Error(`${route.name} did not render its recovery heading after waiting for streamed content`);
        }
      }
      const bodyText = (await page.locator("body").innerText()).trim();
      const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);

      if (status !== route.status) {
        // Preserve the platform error code and a public-page screenshot when
        // Vercel serves a disabled deployment or an unexpected error page.
        // Do not record response cookies or private request headers.
        const vercelError = response?.headers()["x-vercel-error"] ?? null;
        const vercelRequestId = response?.headers()["x-vercel-id"] ?? null;
        const failureName = `${route.name}-${viewport.name}-failed`;
        await fs.writeFile(
          path.join(outputDir, `${failureName}.json`),
          JSON.stringify({
            route: route.path,
            viewport: viewport.name,
            status,
            expectedStatus: route.status,
            vercelError,
            vercelRequestId,
          }, null, 2),
        );
        await page.screenshot({ path: path.join(outputDir, `${failureName}.png`), fullPage: true }).catch(() => {});
        await fs.writeFile(path.join(outputDir, `${failureName}.html`), await page.content()).catch(() => {});
        throw new Error(
          `${route.name} returned HTTP ${status}; expected ${route.status}` +
          (vercelError ? `; x-vercel-error=${vercelError}` : ""),
        );
      }
      if (bodyText.length < route.minText) {
        await page.screenshot({ path: path.join(outputDir, `${route.name}-${viewport.name}-failed.png`), fullPage: true });
        await fs.writeFile(path.join(outputDir, `${route.name}-${viewport.name}-failed.html`), await page.content());
        throw new Error(`${route.name} rendered too little content (${bodyText.length} chars)`);
      }
      if (route.name === "proposal-not-found") {
        await page.getByRole("link", { name: "Contact the recruiting team" }).waitFor({ state: "visible", timeout: 5000 });
      }
      if (overlay) throw new Error(`${route.name} rendered a framework error overlay`);
      if (horizontalOverflow) throw new Error(`${route.name} has horizontal overflow on ${viewport.name}`);
      if (pageErrors.length) throw new Error(`${route.name} page errors: ${pageErrors.join(" | ")}`);

      const authActions = {
        "training-login": "login",
        "training-signup": "training_join",
        "password-recovery": "password_reset",
      };
      const authAction = authActions[route.name];
      if (authAction) {
        await page.locator('[data-turnstile-action="' + authAction + '"]').waitFor({ state: "attached", timeout: 15000 });
        await page.locator('input[name="cf-turnstile-response"]').first().waitFor({ state: "attached", timeout: 15000 });
      }

      if (route.name === "hire") {
        await page.locator('form[action], form').first().waitFor({ state: "visible", timeout: 15000 });
        await page.locator('input[name="email"]').first().waitFor({ state: "attached", timeout: 15000 });
      }

      if (route.name === "booking") {
        await page.getByRole("heading", { name: /book a discovery call/i }).waitFor({ timeout: 15000 });
        const timezone = page.locator('input[name="timezone"]');
        await timezone.waitFor({ state: "attached", timeout: 15000 });
        await page.waitForFunction(
          () => Boolean(document.querySelector('input[name="timezone"]')?.value),
          { timeout: 15000 },
        );
        if (await page.locator(".booking-time-grid button").count() < 1) {
          throw new Error("booking has no visible appointment times");
        }
      }

      await page.screenshot({
        path: path.join(outputDir, `${route.name}-${viewport.name}.png`),
        fullPage: route.name === "home" || route.name === "hire" || route.name === "booking",
      });

      report.push({
        route: route.path,
        viewport: viewport.name,
        status,
        textLength: bodyText.length,
        horizontalOverflow,
        pageErrors,
      });
      await page.close();
    }


    // Exercise actual header/mobile-menu links and the 404 recovery CTA.
    for (const journey of navigationJourneys) {
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      try {
        await page.goto(baseUrl + journey.from, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });

        if (viewport.name === "mobile" && journey.openMobileMenu) {
          await page.locator('details.va-mobile-drawer summary[aria-label="Navigation menu"]')
            .click({ timeout: 15000 });
        }

        const link = journey.label
          ? page.getByRole("link", { name: journey.label, exact: true })
          : page.locator(
              viewport.name === "mobile" ? journey.mobileLink : journey.desktopLink
            ).first();
        await link.waitFor({ state: "visible", timeout: 15000 });
        await link.click({ timeout: 15000 });
        await page.waitForURL(
          (url) => url.origin === new URL(baseUrl).origin && url.pathname === journey.to,
          { timeout: 20000 },
        );
        await page.locator("main h1").first().waitFor({ state: "visible", timeout: 20000 });
        if (journey.name === "training-signup-to-login") {
          await page.locator('[data-turnstile-action="login"]').waitFor({ state: "attached", timeout: 15000 });
          await page.locator('input[name="cf-turnstile-response"]').first().waitFor({ state: "attached", timeout: 15000 });
        }
        await page.waitForTimeout(250);

        const destinationText = (await page.locator("main").first().innerText()).trim();
        if (destinationText.length < 100) {
          throw new Error("Destination main content was blank or incomplete");
        }
        if (pageErrors.length) {
          throw new Error("Browser exceptions: " + pageErrors.join(" | "));
        }

        await page.screenshot({
          path: path.join(outputDir, journey.name + "-" + viewport.name + ".png"),
        });
        navigationReport.push({
          name: journey.name,
          viewport: viewport.name,
          from: journey.from,
          to: journey.to,
          resolvedPath: new URL(page.url()).pathname,
          pageErrors: [],
        });
      } catch (error) {
        await page.screenshot({
          path: path.join(outputDir, journey.name + "-" + viewport.name + "-failed.png"),
          fullPage: true,
        }).catch(() => {});
        throw new Error(
          "Navigation smoke " + journey.name + " (" + viewport.name + "): " +
          (error instanceof Error ? error.message : String(error))
        );
      } finally {
        await page.close();
      }
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(outputDir, "report.json"),
  JSON.stringify({ checkedAt: new Date().toISOString(), baseUrl, report, navigationReport }, null, 2),
);

console.log(JSON.stringify({ routes: report, navigation: navigationReport }, null, 2));
