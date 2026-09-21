import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Bell,
  Camera,
  CheckCircle2,
  Clock3,
  KeyRound,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SessionList } from "@/components/account-security/session-list";
import {
  requestAccountEmailChangeAction,
  updateAccountProfileAction,
  updateNotificationPreferencesAction,
} from "@/app/actions/account-security";
import { requireAnyRole } from "@/lib/auth";
import { getAccountSecurityState, type SecurityEventType } from "@/lib/account-security";
import { getAccountNotificationPreferences, getPendingEmailChange } from "@/lib/account-preferences";
import type { Role } from "@/lib/types";

export const metadata = { robots: { index: false, follow: false } };

const eventLabels: Record<SecurityEventType, string> = {
  login_succeeded: "Signed in",
  login_failed: "Failed sign-in attempt",
  logout_current: "Signed out this device",
  logout_others: "Signed out other devices",
  logout_all: "Signed out everywhere",
  session_revoked: "Signed out a device",
  password_changed: "Password changed",
  profile_updated: "Personal profile updated",
  email_change_requested: "Email change requested",
  email_changed: "Email address changed",
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function eventDevice(userAgent: string | null) {
  if (!userAgent) return null;
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Safari\//.test(userAgent)) return "Safari";
  return "Browser";
}

function roleLabel(role: Role) {
  if (role === "va") return "Virtual Assistant";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.split("@")[0] || "Account";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function providerLabel(provider: string) {
  if (provider === "email") return "Email & password";
  if (provider === "google") return "Google";
  if (provider === "azure") return "Microsoft";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function workspaceProfile(role: Role) {
  if (role === "client") {
    return {
      href: "/workspace/client/company",
      label: "Company profile",
      description: "Manage company details, hiring context, logo, and public company visibility.",
      icon: Building2,
    };
  }
  if (role === "va") {
    return {
      href: "/workspace/va/profile",
      label: "Professional VA profile",
      description: "Manage your professional summary, skills, availability, rate, proof, and public profile.",
      icon: BriefcaseBusiness,
    };
  }
  if (role === "admin") {
    return {
      href: "/workspace/admin",
      label: "Admin workspace",
      description: "Personal identity stays here. Agency and platform settings remain in the Admin workspace.",
      icon: ShieldCheck,
    };
  }
  return {
    href: "/workspace/recruiter",
    label: "Recruiter workspace",
    description: "Personal identity stays here. Leads, matching, and recruiter operations remain in your workspace.",
    icon: BriefcaseBusiness,
  };
}

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; message?: string; error?: string; saved?: string }>;
}) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter", "client", "va"]);
  const [state, preferences, pendingEmailChange] = await Promise.all([
    getAccountSecurityState(),
    getAccountNotificationPreferences(user.id),
    getPendingEmailChange(user.id),
  ]);
  const params = await searchParams;
  const tab = params.tab === "security" || params.tab === "notifications" ? params.tab : "account";
  const role = profile.role as Role;
  const roleName = roleLabel(role);
  const email = state.user.email || user.email || "";
  const emailVerified = Boolean(profile.email_verified || user.email_confirmed_at);
  const destination = workspaceProfile(role);
  const DestinationIcon = destination.icon;
  const currentSession = state.sessions.find((session) => session.current);
  const activeSessions = state.sessions.length;
  const providers = state.signInProviders.length
    ? state.signInProviders.map(providerLabel)
    : ["Email & password"];
  const lastActive = profile.last_active_at || user.last_sign_in_at;
  const memberSince = user.created_at;
  const accountStatus = String(profile.account_status || "active");
  const displayName = profile.full_name || email.split("@")[0] || "Account";

  return (
    <AppShell userId={user.id} role={role} name={profile.full_name} title="Account settings">
      <div className="account-center">
        {params.saved ? <div className="success-banner" role="status">Personal profile updated.</div> : null}
        {params.message ? <div className="success-banner" role="status">{params.message}</div> : null}
        {params.error ? <div className="alert" role="alert">{params.error}</div> : null}

        <section className="account-identity-hero">
          <div className="account-identity-main">
            <div className="account-avatar account-avatar-xl" aria-hidden="true">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : (
                <span>{initials(profile.full_name, email)}</span>
              )}
            </div>
            <div className="account-identity-copy">
              <div className="account-badge-row">
                <span className="account-role-badge">{roleName}</span>
                {emailVerified ? (
                  <span className="account-verified-badge"><BadgeCheck size={14} /> Email verified</span>
                ) : null}
              </div>
              <h1>{displayName}</h1>
              <p>{email || "No email available"}</p>
              <span className="account-identity-note">Personal account for your VirtualAssistant.com.ph workspace.</span>
            </div>
          </div>
          <div className="account-hero-actions">
            <a className="btn btn-primary" href="#personal-info"><UserRound size={16} /> Edit profile</a>
            <Link className="btn" href="/workspace/account?tab=security"><ShieldCheck size={16} /> Security</Link>
          </div>
        </section>

        <nav className="account-tabs" aria-label="Account settings sections">
          <Link
            className={tab === "account" ? "active" : ""}
            aria-current={tab === "account" ? "page" : undefined}
            href="/workspace/account?tab=account"
          >
            <UserRound size={17} />
            <span>Account</span>
          </Link>
          <Link
            className={tab === "notifications" ? "active" : ""}
            aria-current={tab === "notifications" ? "page" : undefined}
            href="/workspace/account?tab=notifications"
          >
            <Bell size={17} />
            <span>Notifications</span>
          </Link>
          <Link
            className={tab === "security" ? "active" : ""}
            aria-current={tab === "security" ? "page" : undefined}
            href="/workspace/account?tab=security"
          >
            <ShieldCheck size={17} />
            <span>Security</span>
            <small>{activeSessions}</small>
          </Link>
        </nav>

        {tab === "account" ? (
          <div className="account-layout">
            <main className="account-main-stack">
              <section className="card account-panel" id="personal-info">
                <div className="account-panel-head">
                  <div>
                    <span className="account-panel-eyebrow">Personal profile</span>
                    <h2>Profile information</h2>
                    <p>Keep your personal identity current. Role-specific business or professional details stay in your workspace profile.</p>
                  </div>
                </div>

                <form action={updateAccountProfileAction} className="account-profile-form" encType="multipart/form-data">
                  <div className="account-photo-editor">
                    <div className="account-avatar account-avatar-lg" aria-hidden="true">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" />
                      ) : (
                        <span>{initials(profile.full_name, email)}</span>
                      )}
                    </div>
                    <div className="account-photo-copy">
                      <strong>Profile photo</strong>
                      <span>JPG, PNG, or WEBP up to 3 MB.</span>
                      <label className="btn btn-sm account-upload-button">
                        <Camera size={15} />
                        Choose photo
                        <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" />
                      </label>
                    </div>
                  </div>

                  <div className="account-form-grid">
                    <div className="field">
                      <label htmlFor="account-full-name">Full name</label>
                      <input id="account-full-name" name="full_name" defaultValue={profile.full_name || ""} required maxLength={100} />
                      <span className="field-help">Used in your workspace and internal team views.</span>
                    </div>

                    <div className="field">
                      <label htmlFor="account-email">Email address</label>
                      <div className="account-readonly-field">
                        <Mail size={16} />
                        <span id="account-email">{email || "Not available"}</span>
                        {emailVerified ? <CheckCircle2 size={16} className="account-readonly-check" /> : null}
                      </div>
                      <span className="field-help">Email changes require a separate verified account flow. Use the secure email section below.</span>
                    </div>

                    <div className="field">
                      <label>Workspace role</label>
                      <div className="account-readonly-field">
                        <UserRound size={16} />
                        <span>{roleName}</span>
                      </div>
                      <span className="field-help">Roles are controlled by workspace administrators.</span>
                    </div>

                    <div className="field">
                      <label>Sign-in methods</label>
                      <div className="account-readonly-field">
                        <KeyRound size={16} />
                        <span>{providers.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="account-form-actions">
                    <span>Your changes apply across your workspace immediately.</span>
                    <button className="btn btn-primary" type="submit">Save changes</button>
                  </div>
                </form>
              </section>

              <section className="card account-panel account-email-card" id="email-settings">
                <div className="account-panel-head">
                  <div>
                    <span className="account-panel-eyebrow">Sign-in email</span>
                    <h2>Change email securely</h2>
                    <p>Your current email stays active until you confirm the new address from its inbox.</p>
                  </div>
                  <span className="account-security-lock"><ShieldCheck size={15} /> Verification required</span>
                </div>

                <div className="account-current-email">
                  <span>Current email</span>
                  <strong>{email || "Not available"}</strong>
                  {emailVerified ? <small><BadgeCheck size={14} /> Verified</small> : null}
                </div>

                {pendingEmailChange ? (
                  <div className="account-pending-change" role="status">
                    <Mail size={18} />
                    <div>
                      <strong>Verification pending for {pendingEmailChange.new_email}</strong>
                      <span>Use the link in that inbox before {formatDate(pendingEmailChange.expires_at)}. A new request replaces the previous link.</span>
                    </div>
                  </div>
                ) : null}

                <form action={requestAccountEmailChangeAction} className="account-email-change-form">
                  <div className="field">
                    <label htmlFor="new-account-email">New email address</label>
                    <input
                      id="new-account-email"
                      name="new_email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      required
                      maxLength={254}
                    />
                    <span className="field-help">We send a one-hour verification link to the new address. The account email does not change before confirmation.</span>
                  </div>
                  <button className="btn btn-primary" type="submit">Send verification</button>
                </form>
              </section>

              <section className="card account-panel account-workspace-card">
                <div className="account-workspace-icon"><DestinationIcon size={20} /></div>
                <div>
                  <span className="account-panel-eyebrow">Role-specific details</span>
                  <h2>{destination.label}</h2>
                  <p>{destination.description}</p>
                </div>
                <Link className="btn" href={destination.href}>
                  Open {destination.label}
                  <ArrowUpRight size={15} />
                </Link>
              </section>
            </main>

            <aside className="account-sidebar-stack">
              <section className="card account-overview-card">
                <div className="account-panel-head compact">
                  <div>
                    <span className="account-panel-eyebrow">Account overview</span>
                    <h2>At a glance</h2>
                  </div>
                </div>
                <dl className="account-overview-list">
                  <div>
                    <dt>Email</dt>
                    <dd>{emailVerified ? <span className="account-status-good">Verified</span> : "Pending verification"}</dd>
                  </div>
                  <div>
                    <dt>Account status</dt>
                    <dd className="account-capitalize">{accountStatus}</dd>
                  </div>
                  <div>
                    <dt>Active sessions</dt>
                    <dd>{activeSessions}</dd>
                  </div>
                  <div>
                    <dt>Last active</dt>
                    <dd>{formatDate(lastActive)}</dd>
                  </div>
                  <div>
                    <dt>Member since</dt>
                    <dd>{formatDate(memberSince)}</dd>
                  </div>
                </dl>
              </section>

              <section className="account-security-promo">
                <div className="account-security-promo-icon"><ShieldCheck size={20} /></div>
                <div>
                  <strong>Account security</strong>
                  <p>Review signed-in devices and remove sessions you do not recognize.</p>
                </div>
                <Link href="/workspace/account?tab=security">Review security <ArrowUpRight size={14} /></Link>
              </section>
            </aside>
          </div>
        ) : tab === "notifications" ? (
          <div className="account-security-stack">
            <section className="card account-panel">
              <div className="account-panel-head">
                <div>
                  <span className="account-panel-eyebrow">Email notifications</span>
                  <h2>Choose what reaches your inbox</h2>
                  <p>Control optional account emails without moving company, hiring, skills, rates, or other role-specific profile data into Account Settings.</p>
                </div>
              </div>

              <form action={updateNotificationPreferencesAction} className="account-preferences-form">
                <label className="account-preference-row">
                  <span className="account-preference-copy">
                    <strong>Hiring & recruiter updates</strong>
                    <small>Non-critical follow-ups about active hiring requests and recruiter workflow updates.</small>
                  </span>
                  <span className="account-switch">
                    <input type="checkbox" name="hiring_updates" defaultChecked={preferences.hiring_updates} />
                    <span aria-hidden="true" />
                  </span>
                </label>

                <label className="account-preference-row">
                  <span className="account-preference-copy">
                    <strong>Booking reminders</strong>
                    <small>Reminder emails before scheduled discovery or hiring calls. Booking confirmations still send.</small>
                  </span>
                  <span className="account-switch">
                    <input type="checkbox" name="booking_reminders" defaultChecked={preferences.booking_reminders} />
                    <span aria-hidden="true" />
                  </span>
                </label>

                <label className="account-preference-row">
                  <span className="account-preference-copy">
                    <strong>Candidate activity</strong>
                    <small>Application, shortlist, and candidate-progress notifications that are not security-critical.</small>
                  </span>
                  <span className="account-switch">
                    <input type="checkbox" name="candidate_activity" defaultChecked={preferences.candidate_activity} />
                    <span aria-hidden="true" />
                  </span>
                </label>

                <label className="account-preference-row">
                  <span className="account-preference-copy">
                    <strong>Product emails</strong>
                    <small>Optional product updates and feature announcements. Off by default.</small>
                  </span>
                  <span className="account-switch">
                    <input type="checkbox" name="product_emails" defaultChecked={preferences.product_emails} />
                    <span aria-hidden="true" />
                  </span>
                </label>

                <div className="account-preference-row is-locked">
                  <span className="account-preference-copy">
                    <strong><ShieldCheck size={16} /> Security alerts</strong>
                    <small>Password, verified email, and new or unusual sign-in notices are mandatory for account protection.</small>
                  </span>
                  <span className="account-mandatory-badge">Always on</span>
                </div>

                <div className="account-form-actions">
                  <span>Security alerts cannot be disabled.</span>
                  <button className="btn btn-primary" type="submit">Save preferences</button>
                </div>
              </form>
            </section>
          </div>
        ) : (
          <div className="account-security-stack">
            <section className="account-security-summary">
              <article className="account-summary-card">
                <span><MonitorSmartphone size={18} /></span>
                <div><strong>{activeSessions}</strong><small>Active session{activeSessions === 1 ? "" : "s"}</small></div>
              </article>
              <article className="account-summary-card">
                <span><ShieldCheck size={18} /></span>
                <div><strong>{currentSession ? "Recognized" : "Unavailable"}</strong><small>Current device</small></div>
              </article>
              <article className="account-summary-card">
                <span><Clock3 size={18} /></span>
                <div><strong>{formatDate(user.last_sign_in_at)}</strong><small>Last sign-in</small></div>
              </article>
              <article className="account-summary-card">
                <span><KeyRound size={18} /></span>
                <div><strong>{providers[0]}</strong><small>Primary sign-in</small></div>
              </article>
            </section>

            <section className="card account-panel account-password-card">
              <div className="account-password-icon"><KeyRound size={20} /></div>
              <div>
                <h2>Password</h2>
                <p>Use a strong, unique password. Changing it does not require changing your workspace profile.</p>
              </div>
              <Link className="btn" href="/auth/update-password?source=account">Change password</Link>
            </section>

            <section className="card account-panel account-security-alert-card">
              <div className="account-password-icon"><Bell size={20} /></div>
              <div>
                <h2>New-login alerts</h2>
                <p>We email you when a successful sign-in comes from a browser and operating-system combination we have not seen recently. Normal repeat logins stay quiet.</p>
              </div>
              <span className="account-mandatory-badge">Always on</span>
            </section>

            <section className="account-security-section">
              <div className="account-section-heading">
                <div>
                  <span className="account-panel-eyebrow">Sessions</span>
                  <h2>{"Where you're logged in"}</h2>
                  <p>Review browsers and devices that currently have access to your account.</p>
                </div>
              </div>
              <SessionList sessions={state.sessions} />
            </section>

            <section className="card account-panel">
              <div className="account-panel-head">
                <div>
                  <span className="account-panel-eyebrow">Audit trail</span>
                  <h2>Recent security activity</h2>
                  <p>Security-sensitive account actions appear here so you can spot changes you did not make.</p>
                </div>
              </div>
              {state.events.length ? (
                <div className="account-activity-list">
                  {state.events.map((event) => {
                    const device = eventDevice(event.user_agent);
                    return (
                      <div className="account-activity-row" key={event.id}>
                        <span className="account-activity-dot" aria-hidden="true" />
                        <div>
                          <strong>{eventLabels[event.event_type] || event.event_type}</strong>
                          <small>
                            {[formatDate(event.created_at), event.ip ? `IP ${event.ip}` : null, device]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="account-empty-activity">
                  <ShieldCheck size={22} />
                  <div>
                    <strong>No recent security changes</strong>
                    <p>Session revocations, password changes, and profile updates will appear here.</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
