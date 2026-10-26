import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// React cache is request-scoped, unlike the shared curriculum cache.
// Reuse one *verified* auth.getUser() result among the training layout,
// dashboard, and shell, without caching identity across visitors.
export const getTrainingVerifiedAuthUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});
