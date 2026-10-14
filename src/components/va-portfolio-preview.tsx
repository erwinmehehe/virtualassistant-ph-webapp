import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  GraduationCap,
  Layers3,
  Pencil,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { PublicAvatar } from "@/components/public-avatar";
import { TrainingCredentials } from "@/components/training-credentials";
import type { TrainingCredential } from "@/lib/training-credentials";
import styles from "./va-portfolio-preview.module.css";

type PortfolioAudience = "self" | "recruiter";

export type VaPortfolioPreviewProps = {
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  categories: string[];
  skills: string[];
  tools: string[];
  industries: string[];
  languages: string[];
  yearsExperience?: number | null;
  weeklyHours?: number | null;
  schedule?: string | null;
  overlapHours?: number | null;
  portfolioUrl?: string | null;
  trainingCredentials: TrainingCredential[];
  audience: PortfolioAudience;
  backHref: string;
};

function safePortfolioUrl(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function TagList({
  values,
  empty,
}: {
  values: string[];
  empty: string;
}) {
  if (!values.length) return <p className={styles.empty}>{empty}</p>;
  return (
    <div className={styles.tags}>
      {values.map((value, index) => (
        <span className={styles.tag} key={value + "-" + index}>{value}</span>
      ))}
    </div>
  );
}

/**
 * Original VAPH portfolio presentation for an authenticated VA or recruiter.
 * Never pass resumes, private addresses, email, phone, rates, notes, test
 * answers, identity documents, or recruiter operational data into this view.
 */
export function VaPortfolioPreview({
  name,
  avatarUrl,
  headline,
  bio,
  categories,
  skills,
  tools,
  industries,
  languages,
  yearsExperience,
  weeklyHours,
  schedule,
  overlapHours,
  portfolioUrl,
  trainingCredentials,
  audience,
  backHref,
}: VaPortfolioPreviewProps) {
  const isSelf = audience === "self";
  const position = headline?.trim() || categories[0] || "Virtual Assistant";
  const description = bio?.trim() || (
    isSelf
      ? "Add a professional summary to introduce the work you do, the tools you use, and the teams you support."
      : "No professional summary has been supplied."
  );
  const years = Number(yearsExperience);
  const hours = Number(weeklyHours);
  const overlap = Number(overlapHours);
  const hasYears = Number.isFinite(years) && years > 0;
  const hasHours = Number.isFinite(hours) && hours > 0;
  const hasOverlap = Number.isFinite(overlap) && overlap > 0;
  const workLink = safePortfolioUrl(portfolioUrl);
  const editHref = "/workspace/va/profile#professional";
  const nextAction = isSelf ? editHref : backHref;

  return (
    <div className={styles.page}>
      <div className={styles.privacy}>
        <ShieldCheck size={17} aria-hidden="true" />
        <span>
          <strong>Private portfolio preview.</strong>{" "}
          {isSelf
            ? "Only you can open this preview. Your public listing preferences are managed separately."
            : "Internal recruiter view. This portfolio is not a public candidate page."}
        </span>
      </div>

      <div className={styles.shell}>
        <aside className={styles.rail} aria-label="Portfolio sidebar">
          <Link href={backHref} className={styles.back}>
            <ArrowLeft size={15} aria-hidden="true" />
            {isSelf ? "Back to my profile" : "Back to candidate"}
          </Link>

          <div className={styles.identity}>
            <div className={styles.photo}>
              <PublicAvatar name={name} src={avatarUrl} size="lg" />
            </div>
            <div className={styles.identityText}>
              <span className={styles.railEyebrow}>VirtualAssistant.com.ph</span>
              <h2>{name || "Virtual Assistant"}</h2>
              <p>{position}</p>
            </div>
          </div>

          <div className={styles.verified}>
            <BadgeCheck size={15} aria-hidden="true" />
            <span>{isSelf ? "Your professional profile" : "Recruiter profile review"}</span>
          </div>

          <nav className={styles.navigation} aria-label="Portfolio sections">
            <a href="#portfolio-overview"><Sparkles size={16} aria-hidden="true" /> Overview</a>
            <a href="#portfolio-expertise"><Layers3 size={16} aria-hidden="true" /> Expertise</a>
            <a href="#portfolio-experience"><BriefcaseBusiness size={16} aria-hidden="true" /> Experience</a>
            <a href="#portfolio-work"><Wrench size={16} aria-hidden="true" /> Work & tools</a>
            <a href="#portfolio-training"><GraduationCap size={16} aria-hidden="true" /> Credentials</a>
          </nav>

          <div className={styles.railBottom}>
            <p>
              {isSelf
                ? "Use this space to see how your professional story comes together."
                : "Use the candidate record for screening, notes, private contact details, and hiring actions."}
            </p>
            <Link href={nextAction} className={styles.railAction}>
              {isSelf ? <Pencil size={15} aria-hidden="true" /> : <ArrowLeft size={15} aria-hidden="true" />}
              {isSelf ? "Edit my portfolio" : "Return to candidate record"}
            </Link>
          </div>
        </aside>

        <div className={styles.content}>
          <section className={styles.hero} id="portfolio-overview" aria-labelledby="portfolio-heading">
            <div className={styles.contour} aria-hidden="true" />
            <span className={styles.eyebrow}><Sparkles size={14} aria-hidden="true" /> TALENT PORTFOLIO</span>
            <p className={styles.heroIntro}>{isSelf ? "Your story, at a glance" : "Candidate overview"}</p>
            <h1 id="portfolio-heading">{position}</h1>
            <p className={styles.heroDescription}>{description}</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href={nextAction}>
                {isSelf ? "Update my profile" : "Review candidate"}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <a className={styles.ghostButton} href="#portfolio-expertise">
                Explore the profile <span aria-hidden="true">↓</span>
              </a>
            </div>
          </section>

          <div className={styles.bento}>
            <section className={styles.metrics} aria-label="Professional highlights">
              <div>
                <span className={styles.metricIcon}><BriefcaseBusiness size={17} aria-hidden="true" /></span>
                <strong>{hasYears ? years + "+ years" : "Not listed"}</strong>
                <span>Professional experience</span>
              </div>
              <div>
                <span className={styles.metricIcon}><Clock3 size={17} aria-hidden="true" /></span>
                <strong>{hasHours ? hours + " hrs" : "Not listed"}</strong>
                <span>Hours per week listed</span>
              </div>
              <div>
                <span className={styles.metricIcon}><Layers3 size={17} aria-hidden="true" /></span>
                <strong>{categories.length || "Not listed"}</strong>
                <span>Professional specialties</span>
              </div>
            </section>

            <section className={[styles.panel, styles.expertise].join(" ")} id="portfolio-expertise">
              <div className={styles.panelHeading}>
                <span className={styles.panelIcon}><Layers3 size={19} aria-hidden="true" /></span>
                <span className={styles.panelLabel}>WHAT I DO</span>
              </div>
              <h2>Expertise & core skills</h2>
              <p>The professional strengths listed in this profile.</p>
              {categories.length ? (
                <div className={styles.specialties}>
                  {categories.map((category, index) => (
                    <span key={category + "-" + index}>{category}</span>
                  ))}
                </div>
              ) : null}
              <TagList values={skills} empty={isSelf ? "Add your skills in Edit profile." : "Skills not supplied."} />
            </section>

            <section className={[styles.panel, styles.availability].join(" ")} id="portfolio-experience">
              <div className={styles.panelHeading}>
                <span className={styles.panelIcon}><Clock3 size={19} aria-hidden="true" /></span>
                <span className={styles.panelLabel}>WORKING TOGETHER</span>
              </div>
              <h2>Experience & schedule</h2>
              <div className={styles.availabilityRows}>
                <div><span>Experience</span><strong>{hasYears ? years + "+ years" : "Not provided"}</strong></div>
                <div><span>Weekly hours</span><strong>{hasHours ? hours + " hours" : "Not provided"}</strong></div>
                <div><span>Schedule</span><strong>{schedule?.trim() || "Not provided"}</strong></div>
                {hasOverlap ? <div><span>Time overlap</span><strong>{overlap + " hours"}</strong></div> : null}
              </div>
              <small>These are saved profile details, not live availability confirmation.</small>
            </section>

            <section className={[styles.panel, styles.tools].join(" ")} id="portfolio-work">
              <div className={styles.panelHeading}>
                <span className={styles.panelIcon}><Wrench size={19} aria-hidden="true" /></span>
                <span className={styles.panelLabel}>MY WORKSPACE</span>
              </div>
              <h2>Tools & platforms</h2>
              <p>Software and systems listed on this profile.</p>
              <TagList values={tools} empty={isSelf ? "Add the tools you work with in Edit profile." : "Tools not supplied."} />
            </section>

            <section className={[styles.panel, styles.work].join(" ")}>
              <div className={styles.panelHeading}>
                <span className={styles.panelIcon}><BriefcaseBusiness size={19} aria-hidden="true" /></span>
                <span className={styles.panelLabel}>WORK SAMPLES</span>
              </div>
              <h2>Portfolio & proof of work</h2>
              <p>{workLink ? "A work-sample link provided in the candidate profile." : "No work-sample link has been added to this profile yet."}</p>
              {workLink ? (
                <a className={styles.workLink} href={workLink} target="_blank" rel="noopener noreferrer nofollow">
                  Open submitted portfolio <ExternalLink size={15} aria-hidden="true" />
                </a>
              ) : isSelf ? (
                <Link className={styles.workLink} href={editHref}>
                  Add my work samples <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              ) : null}
            </section>

            {(industries.length > 0 || languages.length > 0) ? (
              <section className={[styles.panel, styles.background].join(" ")}>
                <div className={styles.panelHeading}>
                  <span className={styles.panelIcon}><Sparkles size={19} aria-hidden="true" /></span>
                  <span className={styles.panelLabel}>ADDITIONAL BACKGROUND</span>
                </div>
                <h2>Industries & languages</h2>
                {industries.length ? (
                  <>
                    <h3>Industries</h3>
                    <TagList values={industries} empty="" />
                  </>
                ) : null}
                {languages.length ? (
                  <>
                    <h3>Languages</h3>
                    <TagList values={languages} empty="" />
                  </>
                ) : null}
              </section>
            ) : null}

            <section className={[styles.panel, styles.training].join(" ")} id="portfolio-training">
              <div className={styles.panelHeading}>
                <span className={styles.panelIcon}><GraduationCap size={19} aria-hidden="true" /></span>
                <span className={styles.panelLabel}>VERIFIABLE PROGRESS</span>
              </div>
              <h2>Training & credentials</h2>
              {trainingCredentials.length ? (
                <TrainingCredentials
                  credentials={trainingCredentials}
                  heading="Completed training"
                  audience={isSelf ? "self" : "recruiter"}
                />
              ) : (
                <p className={styles.empty}>
                  {isSelf
                    ? "Verified VAPH course certificates will appear here after you complete a published course."
                    : "No completed VAPH course certificates are recorded for this candidate."}
                </p>
              )}
              <small>Training completion is supporting evidence, not proof of employment or a hiring guarantee.</small>
            </section>
          </div>

          <footer className={styles.footer}>
            <div>
              <strong>VirtualAssistant.com.ph</strong>
              <span>Portfolio presentation based only on existing profile information.</span>
            </div>
            <Link href={nextAction}>
              {isSelf ? "Continue editing" : "Return to candidate record"}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
