import Link from "next/link";
import { CheckCircle2, GraduationCap } from "lucide-react";
import type { TrainingCredential } from "@/lib/training-credentials";

function issuedLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function TrainingCredentials({
  credentials,
  heading = "Training completed",
  showEmpty = false,
  selfService = false,
}: {
  credentials: TrainingCredential[];
  heading?: string;
  showEmpty?: boolean;
  selfService?: boolean;
}) {
  if (!credentials.length && !showEmpty) return null;

  return (
    <section className="training-credentials-card">
      <div className="training-credentials-head">
        <div>
          <span className="training-credentials-kicker"><GraduationCap size={14}/> Training</span>
          <h3>{heading}</h3>
        </div>
        {credentials.length ? <span className="badge badge-success">{credentials.length} completed</span> : null}
      </div>

      {credentials.length ? (
        <div className="training-credential-list">
          {credentials.map((credential) => (
            <div className="training-credential-item" key={credential.id}>
              <span className="training-credential-check"><CheckCircle2 size={17}/></span>
              <div>
                <strong>{credential.courseTitle}</strong>
                <span>Completed {issuedLabel(credential.issuedAt)}</span>
                <small>Verified course completion</small>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="training-credentials-empty">No completed training courses yet.</p>
      )}

      <p className="training-credentials-note">
        Training is supporting evidence only. It is not required for recruiter approval or client selection.
      </p>

      {selfService ? (
        <Link className="btn btn-sm" href="/workspace/training">Open training</Link>
      ) : null}
    </section>
  );
}
