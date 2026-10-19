import "server-only";

import { unstable_cache } from "next/cache";
import { getHomepageFeaturedVas } from "@/lib/homepage-data";
import { createPublicClient } from "@/lib/supabase/public";

export type PublicTalentProof = {
  directoryCount: number | null;
  avatars: { user_id: string; full_name: string; avatar_url: string }[];
};

/**
 * Public proof only: photos already displayed in the consent-gated public
 * directory and an exact count of rows in that same public view.
 *
 * A public-directory count is NOT a count of all registered VAs. Never infer
 * or hard-code a registered-user total from the sample marketing graphic.
 */
export const getPublicTalentProof = unstable_cache(
  async (): Promise<PublicTalentProof> => {
    const featured = await getHomepageFeaturedVas().catch(() => []);
    const avatars = featured
      .filter((va) => typeof va.avatar_url === "string" && va.avatar_url.trim())
      .slice(0, 5)
      .map((va) => ({
        user_id: String(va.user_id),
        full_name: String(va.full_name || "Filipino virtual assistant"),
        avatar_url: String(va.avatar_url),
      }));

    const client = createPublicClient();
    if (!client) return { directoryCount: null, avatars };

    try {
      const { count, error } = await client
        .from("public_va_directory")
        .select("user_id", { count: "exact", head: true });

      if (error) {
        console.warn("[public-talent-proof] directory count unavailable", { code: error.code });
        return { directoryCount: null, avatars };
      }

      return {
        directoryCount: typeof count === "number" && Number.isSafeInteger(count) && count > 0 ? count : null,
        avatars,
      };
    } catch {
      return { directoryCount: null, avatars };
    }
  },
  ["public-talent-proof-v1"],
  { revalidate: 300, tags: ["public-va-directory"] },
);
