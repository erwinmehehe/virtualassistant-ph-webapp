import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const releases = [
  ["supabase/migrations/20260923145500_release_australian_va_fundamentals.sql", "australian-va-fundamentals"],
  ["supabase/migrations/20260923150000_release_australian_trades_administration.sql", "australian-trades-administration"],
  ["supabase/migrations/20260923150500_release_australian_allied_health_administration.sql", "australian-allied-health-administration"],
  ["supabase/migrations/20260923151000_release_australian_bookkeeping_administration.sql", "australian-bookkeeping-administration"],
];

for (const [path, slug] of releases) {
  test(`${slug} release is reviewer-gated and assessment-gated`, async () => {
    const sql = await readFile(path, "utf8");
    assert.match(sql, new RegExp(slug));
    assert.match(sql, /is_published = true/);
    assert.match(sql, /pass_score = 80/);
    assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
    assert.match(sql, /last_reviewed_at = now\(\)/);
    assert.match(sql, /status = 'published'/);
  });
}

test("Australia core specialization source content is practical rather than placeholder curriculum", async () => {
  const files = [
    "supabase/migrations/20260923061000_build_australia_va_trades_servicem8.sql",
    "supabase/migrations/20260923062100_build_australian_allied_health.sql",
    "supabase/migrations/20260923062300_build_australian_bookkeeping.sql",
  ];
  for (const path of files) {
    const sql = await readFile(path, "utf8");
    assert.match(sql, /scenario/i);
    assert.match(sql, /simulation/i);
    assert.match(sql, /handoff|quality|qa/i);
  }
});
