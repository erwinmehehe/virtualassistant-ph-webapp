import Link from "next/link";
import {
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  ExternalLink,
  Eye,
  EyeOff,
  FolderKanban,
  GraduationCap,
  Headphones,
  HeartPulse,
  Home,
  Megaphone,
  Search,
  ShieldCheck,
  ShoppingCart,
  WalletCards,
} from "lucide-react";
import { updateTrainingCertificateVisibilityAction } from "@/app/actions/training-credentials";
import type { TrainingCredential } from "@/lib/training-credentials";

function issuedLabel(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function durationLabel(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes || 0)));
  if (safeMinutes < 60) return `${safeMinutes} min`;
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function categoryLabel(value: string) {
  if (value === "foundation") return "Foundation";
  if (value === "software") return "Software";
  if (value === "industry") return "Industry";
  if (value === "skill") return "Role skill";
  return "Training";
}

function credentialVisual(credential: TrainingCredential) {
  const slug = credential.courseSlug.toLowerCase();

  if (/seo/.test(slug)) return { Icon: Search, tone: "indigo" };
  if (/bookkeep|payroll|xero|myob/.test(slug)) return { Icon: Calculator, tone: "emerald" };
  if (/medical|health|cliniko|ndis/.test(slug)) return { Icon: HeartPulse, tone: "rose" };
  if (/support/.test(slug)) return { Icon: Headphones, tone: "cyan" };
  if (/marketing|social/.test(slug)) return { Icon: Megaphone, tone: "violet" };
  if (/ecommerce/.test(slug)) return { Icon: ShoppingCart, tone: "amber" };
  if (/project|operations/.test(slug)) return { Icon: FolderKanban, tone: "blue" };
  if (/executive|calendar/.test(slug)) return { Icon: CalendarDays, tone: "purple" };
  if (/real-estate|property|airbnb|rental/.test(slug)) return { Icon: Home, tone: "teal" };
  if (/sales|lead-generation|mortgage/.test(slug)) return { Icon: BriefcaseBusiness, tone: "sky" };
  if (/servicem8/.test(slug)) return { Icon: WalletCards, tone: "amber" };
  if (/foundation|fundamentals/.test(slug)) return { Icon: BookOpenCheck, tone: "indigo" };
  return { Icon: GraduationCap, tone: "slate" };
}

export function TrainingCredentials({
  credentials,
  heading = "Training completed",
  showEmpty = false,
  selfService = false,
  audience = "default",
}: {
  credentials: TrainingCredential[];
  heading?: string;
  showEmpty?: boolean;
  selfService?: boolean;
  audience?: "default" | "self" | "recruiter";
}) {
  if (!credentials.length && !showEmpty) return null;

  const intro =
    audience === "recruiter"
      ? "Platform-issued course completions that can be independently verified."
      : audience === "self"
        ? "Certificates are added here automatically after you pass a course. You choose which ones may appear on your public talent card."
        : "Verified course completions from the training workspace.";

  const note =
    audience === "recruiter"
      ? "Training completion is supporting evidence only. It does not verify employment history, role experience, or hiring eligibility."
      : selfService
        ? "Your private profile and recruiters can see completed training automatically. Public display is optional per certificate and only matters when your overall public-profile consent and listing are active."
        : "Training completion supports your profile, but it is separate from work experience and is never required for recruiter approval or client selection.";

  return (
    <section className={`training-credentials-card training-credentials-${audience}`}>
      <div className="training-credentials-head">
        <div>
          <span className="training-credentials-kicker">
            <BadgeCheck size={14}/> Verified training
          </span>
          <h3>{heading}</h3>
          <p>{intro}</p>
        </div>
        {credentials.length ? (
          <span className="training-credentials-count">
            <ShieldCheck size={13}/> {credentials.length} verified
          </span>
        ) : null}
      </div>

      {credentials.length ? (
        <div className="training-credential-list">
          {credentials.map((credential) => {
            const { Icon, tone } = credentialVisual(credential);
            const verifyHref = `/training/certificates/${encodeURIComponent(credential.credentialCode)}`;

            return (
              <article className="training-credential-item" key={credential.id}>
                <span className={`training-credential-icon training-credential-tone-${tone}`}>
                  <Icon size={18}/>
                </span>

                <div className="training-credential-copy">
                  <div className="training-credential-title-row">
                    <strong>{credential.courseTitle}</strong>
                    <span className="training-credential-verified">
                      <BadgeCheck size={12}/> Verified
                    </span>
                  </div>

                  <div className="training-credential-meta">
                    <span>{categoryLabel(credential.category)}</span>
                    <span>{durationLabel(credential.estimatedMinutes)}</span>
                    <span>Completed {issuedLabel(credential.issuedAt)}</span>
                  </div>

                  <div className="training-credential-proof">
                    <div>
                      <span>Credential</span>
                      <code>{credential.credentialCode}</code>
                    </div>
                    <Link
                      className="training-credential-verify"
                      href={verifyHref}
                      target="_blank"
                    >
                      Verify credential <ExternalLink size={13}/>
                    </Link>
                  </div>

                  {selfService ? (
                    <form
                      action={updateTrainingCertificateVisibilityAction}
                      className="training-credential-visibility"
                    >
                      <input type="hidden" name="certificate_id" value={credential.id}/>
                      <input
                        type="hidden"
                        name="public_visible"
                        value={credential.publicVisible ? "false" : "true"}
                      />
                      <input type="hidden" name="return_to" value="/workspace/va/profile"/>
                      <span className={credential.publicVisible ? "is-visible" : "is-private"}>
                        {credential.publicVisible ? <Eye size={13}/> : <EyeOff size={13}/>}
                        {credential.publicVisible ? "Public profile: shown" : "Public profile: private"}
                      </span>
                      <button className="btn btn-sm" type="submit">
                        {credential.publicVisible ? "Hide publicly" : "Show publicly"}
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="training-credentials-empty">
          <GraduationCap size={20}/>
          <div>
            <strong>No completed training yet</strong>
            <span>Passed courses and their verifiable certificates will appear here automatically.</span>
          </div>
        </div>
      )}

      <div className="training-credentials-footer">
        <p className="training-credentials-note">{note}</p>
        {selfService ? (
          <Link className="btn btn-sm" href="/workspace/training">
            {credentials.length ? "Continue training" : "Browse training"}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
