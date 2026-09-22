import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("GSC priority pages receive multiple contextual authority links", () => {
  const links = source("src/lib/seo-priority-links.ts");
  const expectedMinimums = new Map([
    ["/average-hourly-rate-virtual-assistants-philippines", 8],
    ["/blog/do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va", 4],
    ["/blog/hourly-rates-for-filipino-virtual-project-manager", 3],
    ["/blog/get-paid-virtual-assistant-philippines", 3],
    ["/blog/general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines", 5],
    ["/blog/how-to-pay-a-filipino-virtual-assistant-directly", 3]
  ]);

  for (const [href, minimum] of expectedMinimums) {
    const count = links.split(`href: "${href}"`).length - 1;
    // Constants are referenced by multiple source maps, so count both the
    // canonical declaration and the mapped source references via the symbol.
    const symbols = {
      "/average-hourly-rate-virtual-assistants-philippines": "RATE_GUIDE",
      "/blog/do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va": "SSS_GUIDE",
      "/blog/hourly-rates-for-filipino-virtual-project-manager": "PROJECT_MANAGER_RATES",
      "/blog/get-paid-virtual-assistant-philippines": "GET_PAID_GUIDE",
      "/blog/general-virtual-assistant-vs-executive-virtual-assistant-which-should-you-hire-in-the-philippines": "GENERAL_VS_EXECUTIVE",
      "/blog/how-to-pay-a-filipino-virtual-assistant-directly": "DIRECT_PAYMENT"
    };
    const symbol = symbols[href];
    const references = links.split(symbol).length - 1;
    assert.ok(count >= 1, `${href}: canonical link missing`);
    assert.ok(references >= minimum, `${href}: expected at least ${minimum - 1} contextual sources, got ${references - 1}`);
  }
});

test("priority links render on current, archive, and service content", () => {
  const blog = source("src/components/blog-article.tsx");
  const archive = source("src/components/archive-article.tsx");
  const service = source("src/app/service/[slug]/page.tsx");

  assert.match(blog, /seoPriorityLinksForBlog/);
  assert.match(blog, /SeoPriorityLinks/);
  assert.match(archive, /seoPriorityLinksForArchive/);
  assert.match(archive, /SeoPriorityLinks/);
  assert.match(service, /seoPriorityLinksForService/);
  assert.match(service, /Research and comparisons/);
});
