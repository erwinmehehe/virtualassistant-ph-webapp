import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = String(process.env.VISUAL_BASE_URL || "").replace(/\/$/, "");
if (!baseUrl) throw new Error("VISUAL_BASE_URL is required.");

const outputDir = path.resolve("artifacts/client-kiro-visual");
await fs.mkdir(outputDir, { recursive: true });

const qualityIssues = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const fixture of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: fixture.width, height: fixture.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const response = await page.goto(`${baseUrl}/visual/client-kiro`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    if (!response?.ok()) throw new Error(`Client Kiro fixture returned HTTP ${response?.status() || "unknown"}.`);

    await page.getByRole("heading", { name: "Good afternoon, Erwin!" }).waitFor();
    await page.getByRole("heading", { name: "3 recruiter-selected VAs ready" }).first().waitFor();

    const hero = page.locator(".client-kiro-rendered-hero");
    const image = page.locator(".client-kiro-rendered-image");
    await hero.waitFor();
    await image.waitFor();

    const naturalWidth = await image.evaluate((node) =>
      node instanceof HTMLImageElement ? node.naturalWidth : 0
    );
    if (naturalWidth < 300) {
      qualityIssues.push(`${fixture.name}: Kiro delivered image is only ${naturalWidth}px wide.`);
    }

    const heroBox = await hero.boundingBox();
    const imageBox = await image.boundingBox();
    if (!heroBox || !imageBox) throw new Error("Could not measure the rendered Kiro hero.");
    if (imageBox.x < heroBox.x - 1 || imageBox.y < heroBox.y - 1) {
      qualityIssues.push(`${fixture.name}: Kiro is clipped outside the hero.`);
    }
    if (imageBox.x + imageBox.width > heroBox.x + heroBox.width + 1) {
      qualityIssues.push(`${fixture.name}: Kiro overflows the hero horizontally.`);
    }

    await page.screenshot({
      path: path.join(outputDir, `client-kiro-${fixture.name}.png`),
      fullPage: true,
    });

    if (consoleErrors.length) {
      qualityIssues.push(`${fixture.name} console errors:\n${consoleErrors.join("\n")}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (qualityIssues.length) {
  throw new Error(`Kiro visual quality gate failed:\n${qualityIssues.join("\n")}`);
}
