import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const LAB_FILE = path.resolve("docs/training-v2/foundations/practice-inbox-lab.html");
const LAB_URL = pathToFileURL(LAB_FILE).href;

test.describe("Foundations V2 pilot — offline fictional inbox", () => {
  test("demonstrations, separate evidence panel, persistent tab drafts and CSV export", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (request) => {
      if (/^https?:\/\//i.test(request.url())) external.push(request.url());
    });
    await page.goto(LAB_URL);

    await expect(page.getByRole("heading", { name: /Practice Inbox/ })).toBeVisible();
    await expect(page.locator(".case-button")).toHaveCount(12);
    await expect(page.locator("#stage")).toHaveText("Instructor demonstration");
    await expect(page.locator("#worked")).toBeVisible();
    await expect(page.locator("#practiceForm")).toBeHidden();

    await page.locator('.case-button[data-id="M05"]').click();
    await expect(page.locator("#stage")).toHaveText("Independent practice");
    await expect(page.locator("#practiceForm")).toBeVisible();
    await expect(page.locator("#worked")).toBeHidden();
    await expect(page.locator("#sourceView")).toContainText("B-109");

    await page.locator("#priority").selectOption("P1");
    await page.locator("#impact").fill("Same-day appointment changes may affect the customer.");
    await page.locator("#facts").fill("bookings.csv:B-109 shows the original 11:00 slot.");
    await page.locator("#sourceRef").fill("bookings.csv:B-109");
    await page.locator("#deadline").fill("2026-11-04 10:27 AEDT");
    await page.locator("#checkpoint").fill("2026-11-04 09:15 AEDT");
    await page.locator("#statusField").selectOption("Waiting for verification");

    await page.locator('.case-button[data-id="M06"]').click();
    await expect(page.locator("#sourceView")).toContainText("INV-219");
    await page.locator('.case-button[data-id="M05"]').click();

    await expect(page.locator("#priority")).toHaveValue("P1");
    await expect(page.locator("#facts")).toHaveValue(/B-109/);
    await expect(page.locator("#deadline")).toHaveValue("2026-11-04 10:27 AEDT");

    await page.getByRole("button", { name: "Check required fields" }).click();
    await expect(page.locator("#status")).toContainText("Missing fields:");
    await expect(page.locator("#status")).not.toContainText("passed");
    await test.info().attach("foundations-v2-desktop-review", {
      body: await page.screenshot({ fullPage: true, animations: "disabled" }),
      contentType: "image/png",
    });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Export all eight practice records/ }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("vaph-foundations-v2-inbox-triage-draft.csv");
    const exported = await readFile(await download.path(), "utf8");
    const rows = exported.trim().split(/\r?\n/);
    expect(rows).toHaveLength(9); // header + eight unique independent records
    expect(rows[0]).toContain("hard_deadline_aedt,next_checkpoint_aedt");
    expect(exported).toContain("bookings.csv:B-109");
    expect(exported).not.toContain("M01,");
    expect(external).toEqual([]);
  });

  test("mobile viewport keeps readable panels and keyboard navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LAB_URL);
    await expect(page.locator("#mail-title")).toBeVisible();
    await page.locator('.case-button[data-id="M12"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#record")).toHaveText("INV-407");
    await expect(page.locator("#practiceForm")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
    await test.info().attach("foundations-v2-mobile-review", {
      body: await page.screenshot({ fullPage: true, animations: "disabled" }),
      contentType: "image/png",
    });
    await expect(page.getByRole("button", { name: /Export all eight practice records/ })).toBeVisible();
  });
});

