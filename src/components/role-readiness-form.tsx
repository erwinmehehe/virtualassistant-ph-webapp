import { publicationMissingDetails, type PublicationJob } from "@/lib/job-publication";

type RoleReadinessFormProps = {
  job: PublicationJob & { id: string; status?: string | null };
  returnTo: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function RoleReadinessForm({ job, returnTo, action }: RoleReadinessFormProps) {
  const missing = publicationMissingDetails(job);
  if (!missing.length) return null;

  const needs = new Set(missing);
  return (
    <section id="role-readiness" className="card" style={{ marginTop: 18 }}>
      <div className="row-between wrap">
        <div>
          <div className="kicker">Role readiness</div>
          <h2 style={{ margin: "4px 0 0" }}>Complete required hiring details</h2>
          <p className="small muted" style={{ margin: "7px 0 0", maxWidth: 760 }}>
            Add only confirmed client information. Saving this form does not change commercial terms or the role&apos;s publication state.
            {job.status === "published" ? " This role is already live, so saved details will update the live brief." : ""}
          </p>
        </div>
        <span className="badge badge-warning">{missing.length} missing</span>
      </div>

      <form action={action} className="stack" style={{ marginTop: 18 }}>
        <input type="hidden" name="job_id" value={job.id} />
        <input type="hidden" name="return_to" value={returnTo} />

        <div className="grid-2">
          {needs.has("title") ? (
            <div className="field">
              <label htmlFor="role-readiness-title">Role title</label>
              <input id="role-readiness-title" name="title" minLength={3} maxLength={140} required />
            </div>
          ) : null}

          {needs.has("hours") ? (
            <div className="field">
              <label htmlFor="role-readiness-hours">Hours per week</label>
              <input id="role-readiness-hours" name="hours_per_week" type="number" min="1" max="168" step="1" required />
            </div>
          ) : null}

          {needs.has("timezone") ? (
            <div className="field">
              <label htmlFor="role-readiness-timezone">Client timezone / working region</label>
              <input id="role-readiness-timezone" name="timezone" maxLength={100} placeholder="Australia/Sydney" required />
            </div>
          ) : null}

          {needs.has("budget") ? (
            <div className="field">
              <label htmlFor="role-readiness-budget">Minimum VA budget, USD/hour</label>
              <input id="role-readiness-budget" name="min_hourly_rate" type="number" min="5" step="0.01" required />
            </div>
          ) : null}

          {needs.has("start timing") ? (
            <div className="field">
              <label htmlFor="role-readiness-start">Preferred start</label>
              <input
                id="role-readiness-start"
                name="start_timing"
                maxLength={100}
                placeholder="ASAP, within 2 weeks, or a confirmed date"
                required
              />
            </div>
          ) : null}
        </div>

        {needs.has("summary") ? (
          <div className="field">
            <label htmlFor="role-readiness-summary">Role outcome / summary</label>
            <textarea id="role-readiness-summary" name="summary" minLength={20} maxLength={1200} rows={4} required />
          </div>
        ) : null}

        {needs.has("responsibilities") ? (
          <div className="field">
            <label htmlFor="role-readiness-responsibilities">Responsibilities</label>
            <textarea
              id="role-readiness-responsibilities"
              name="responsibilities"
              rows={5}
              placeholder={"One responsibility per line"}
              required
            />
          </div>
        ) : null}

        {needs.has("skills") ? (
          <div className="field">
            <label htmlFor="role-readiness-skills">Required skills</label>
            <input
              id="role-readiness-skills"
              name="required_skills"
              placeholder="Calendar management, client communication"
              required
            />
            <span className="small muted">Add at least two, separated by commas.</span>
          </div>
        ) : null}

        <div className="row wrap">
          <button className="btn btn-primary" type="submit">Save role details</button>
          <span className="small muted">Missing: {missing.join(", ")}.</span>
        </div>
      </form>
    </section>
  );
}
