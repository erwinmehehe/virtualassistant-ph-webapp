import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recruiter CRM uses a scoped hierarchy-first visual system", async () => {
  const [page, styles] = await Promise.all([
    read("src/app/workspace/recruiter/leads/page.tsx"),
    read("src/app/workspace/recruiter/leads/leads.module.css")
  ]);

  assert.match(page, /import styles from "\.\/leads\.module\.css"/);
  assert.match(page, /className=\{styles\.crmPage\}/);
  assert.match(page, /crm-attention-strip/);
  assert.match(page, /Pipeline control/);
  assert.match(page, /Apply filters/);
  assert.match(styles, /\.crmPage :global\(\.crm-metrics\)/);
  assert.match(styles, /\.crmPage :global\(\.crm-lead-card\.needs-attention\)/);
  assert.match(styles, /@media \(max-width: 640px\)/);
  assert.match(styles, /prefers-reduced-motion/);
});
