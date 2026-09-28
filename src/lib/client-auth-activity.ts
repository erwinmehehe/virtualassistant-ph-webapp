import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getClientLastLogin(userId: string | null | undefined) {
  if (!userId) return null;
  const client = createAdminClient();
  const result = await client.auth.admin.getUserById(userId);
  if (result.error) return null;
  return result.data.user?.last_sign_in_at || null;
}
