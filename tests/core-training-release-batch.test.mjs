import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const releases = [
  ["supabase/migrations/20260923143500_release_real_estate_va_training.sql", "real-estate-virtual-assistant"],
  ["supabase/migrations/20260923144000_release_medical_healthcare_va_training.sql", "medical-healthcare-virtual-assistant"],
  ["supabase/migrations/20260923144500_release_bookkeeping_administration_training.sql", "bookkeeping-administration"],
  ["supabase/migrations/20260923145000_release_payroll_administration_training.sql", "payroll-administration"],
];

for (const [path, slug] of releases) {
  test(`${slug} release requires reviewed lessons and a practical assessment gate`, async () => {
    const sql = await readFile(path, "utf8");
    assert.match(sql, new RegExp(slug));
    assert.match(sql, /is_published = true/);
    assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
    assert.match(sql, /last_reviewed_at = now\(\)/);
    assert.match(sql, /pass_score = 80/);
    assert.match(sql, /status = 'published'/);
    assert.match(sql, /content_version = greatest\(content_version, 2\)/);
  });
}

test("written source migrations contain substantive practical course content", async () => {
  const files = [
    "supabase/migrations/20260923053000_write_real_estate_va_training.sql",
    "supabase/migrations/20260923110000_write_medical_healthcare_va_training.sql",
    "supabase/migrations/20260923122500_write_bookkeeping_administration_va_training.sql",
    "supabase/migrations/20260923133000_write_payroll_va_training.sql",
  ];
  for (const path of files) {
    const sql = await readFile(path, "utf8");
    assert.match(sql, /simulation/i);
    assert.match(sql, /scenario/i);
  }

  const roadmap = await readFile("supabase/migrations/20260923050000_seed_training_15_course_roadmap.sql", "utf8");
  for (const title of [
    "Real Estate Virtual Assistant",
    "Medical / Healthcare Virtual Assistant",
    "Bookkeeping Administration for Virtual Assistants",
    "Payroll Administration for Virtual Assistants",
  ]) {
    assert.ok(roadmap.includes(title), `Roadmap assessment missing course: ${title}`);
  }
  assert.match(roadmap, /'practical'/i);
});
