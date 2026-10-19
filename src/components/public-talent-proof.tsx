import Link from "next/link";
import { UsersRound } from "lucide-react";
import { PublicAvatar } from "@/components/public-avatar";
import type { PublicTalentProof as PublicTalentProofData } from "@/lib/public-talent-proof";

export function PublicTalentProof({
  proof,
  className = "",
}: {
  proof: PublicTalentProofData;
  className?: string;
}) {
  const count = proof.directoryCount;
  const hasVerifiedCount = typeof count === "number" && Number.isSafeInteger(count) && count > 0;

  return (
    <Link
      href="/find-talent"
      className={["va-public-proof", className].filter(Boolean).join(" ")}
      aria-label={hasVerifiedCount
        ? count.toLocaleString("en-US") + " vetted Filipino VA profiles in our public directory. Browse candidates."
        : "Browse vetted Filipino Virtual Assistant profiles"}
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
        {hasVerifiedCount ? (
          <>
            <strong>{count.toLocaleString("en-US")}</strong>
            <span> vetted Filipino VA profiles</span>
          </>
        ) : (
          <>
            <strong>Meet vetted Filipino VAs</strong>
            <span> in our public directory</span>
          </>
        )}
      </span>
    </Link>
  );
}
