import Link from "next/link";
import { UsersRound } from "lucide-react";
import { PublicAvatar } from "@/components/public-avatar";
import type { PublicTalentProof as PublicTalentProofData } from "@/lib/public-talent-proof";

// User-confirmed total across VA profiles as of 2026-10-19.
// This is NOT the number of vetted or publicly listed directory profiles.
// Update this figure when the confirmed total changes.
const VA_PROFILE_TOTAL = 700;

export function PublicTalentProof({
  proof,
  className = "",
}: {
  proof: PublicTalentProofData;
  className?: string;
}) {
  return (
    <Link
      href="/find-talent"
      className={["va-public-proof", className].filter(Boolean).join(" ")}
      aria-label={VA_PROFILE_TOTAL.toLocaleString("en-US") + " VA profiles. Browse publicly listed Filipino virtual assistants."}
    >
      {proof.avatars.length > 0 ? (
        <div className="va-public-proof-faces" aria-hidden="true">
          {proof.avatars.slice(0, 5).map((va) => (
            <PublicAvatar key={va.user_id} name={va.full_name} src={va.avatar_url} size="sm" />
          ))}
        </div>
      ) : (
        <span className="va-public-proof-icon" aria-hidden="true"><UsersRound size={17} /></span>
      )}
      <span className="va-public-proof-copy">
        <strong>{VA_PROFILE_TOTAL.toLocaleString("en-US")}</strong>
        <span> VA profiles</span>
      </span>
    </Link>
  );
}
