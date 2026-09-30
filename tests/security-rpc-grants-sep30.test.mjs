import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("internal database helpers are not executable by browser roles", async () => {
  const source = await readFile(
    new URL("../supabase/migrations/20260930132534_revoke_browser_execute_from_internal_helpers.sql", import.meta.url),
    "utf8",
  );

  for (const fn of [
    "classify_lead_type()",
    "crm_normalize_company_name(text)",
    "ensure_job_slug()",
    "payments_touch_updated_at()",
    "touch_updated_at()",
    "validate_review_parties()",
  ]) {
    const escaped = fn.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
    assert.match(source, new RegExp(`revoke execute on function public\\.${escaped} from public, anon, authenticated;`, "i"));
    assert.match(source, new RegExp(`grant execute on function public\\.${escaped} to service_role;`, "i"));
  }
});
