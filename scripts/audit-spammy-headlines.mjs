import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await admin.from("va_profiles").select("user_id,headline,primary_category").not("headline", "is", null);
if (error) { console.error(error); process.exit(1); }

const MAX_LENGTH = 80;
const MAX_SEPARATORS = 2;
const flagged = data.filter((row) => {
  const h = row.headline || "";
  const separators = (h.match(/[|,]/g) || []).length;
  return h.length > MAX_LENGTH || separators > MAX_SEPARATORS;
});

console.log(`${data.length} VAs with a headline set, ${flagged.length} exceed the new limit.`);
for (const row of flagged) {
  console.log(`- ${row.user_id} (${row.primary_category}): [${row.headline.length} chars] ${row.headline}`);
}
