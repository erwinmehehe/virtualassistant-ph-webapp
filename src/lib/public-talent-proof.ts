import "server-only";

import { unstable_cache } from "next/cache";
import { getHomepageFeaturedVas } from "@/lib/homepage-data";

export type PublicTalentProof = {
  avatars: { user_id: string; full_name: string; avatar_url: string }[];
};

/**
 * The avatar sample is limited to consented, publicly visible VA profiles.
 * It is intentionally distinct from the user-confirmed site-wide total
 * of 700 VA profiles displayed by PublicTalentProof.
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

    return { avatars };
  },
  ["public-talent-proof-v2"],
  { revalidate: 300, tags: ["public-va-directory"] },
);
