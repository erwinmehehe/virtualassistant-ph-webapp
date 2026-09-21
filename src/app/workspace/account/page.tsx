import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  Camera,
  CheckCircle2,
  Download,
  Globe2,
  KeyRound,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SessionList } from "@/components/account-security/session-list";
import {
  cancelAccountDeletionRequestAction,
  changeAccountPasswordAction,
  requestAccountDeletionAction,
  requestAccountEmailChangeAction,
  updateAccountDisplayPreferencesAction,
  updateAccountProfileAction,
  updateNotificationPreferencesAction,
} from "@/app/actions/account-security";
import { requireAnyRole } from "@/lib/auth";
import { parseAccountDevice } from "@/lib/account-device";
import {
  getAccountDisplayPreferences,
  getPendingAccountDeletionRequest,
  type AccountDisplayPreferences,
} from "@/lib/account-display-preferences";
import { getAccountSecurityState, type SecurityEvent, type SecurityEventType } from "@/lib/account-security";
import { getAccountNotificationPreferences, getPendingEmailChange } from "@/lib/account-preferences";
import type { Role } from "@/lib/types";

export const metadata = { robots: { index: false, follow: false } };

type AccountTab = "profile" | "security" | "notifications" | "preferences" | "privacy";

const eventLabels: Record<SecurityEventType, string> = {
  login_succeeded: "Signed in",
  login_failed: "Failed sign-in attempt",
  logout_current: "Signed out this device",
  logout_others: "Signed out other devices",
  logout_all: "Signed out everywhere",
  session_revoked: "Signed out a device",
  session_reported: "Reported an unrecognized session",
  password_changed: "Password changed",
  profile_updated: "Personal profile updated",
  email_change_requested: "Email change requested",
  email_changed: "Email address changed",
  account_deletion_requested: "Account deletion requested",
  account_deletion_cancelled: "Account deletion request cancelled",
};

const commonTimeZones = [
  "UTC",
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
];

function formatDate(value: string | null | undefined, preferences: AccountDisplayPreferences) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  const options: Intl.DateTimeFormatOptions = {
    dateStyle: preferences.date_format,
    timeStyle: "short",
    hour12: preferences.time_format === "12h",
    timeZone: preferences.timezone,
  };

  try {
    return new Intl.DateTimeFormat("en", options).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", {
      ...options,
      timeZone: "UTC",
    }).format(date);
  }
}

function metadataString(event: SecurityEvent, key: string) {
  const value = event.metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function eventDevice(event: SecurityEvent) {
  const browser = metadataString(event, "browser");
  const device = metadataString(event, "device");
  if (browser && device) return `${browser} on ${device}`;
  const parsed = parseAccountDevice(event.user_agent);
  return parsed.device === "Unknown device"
    ? `${parsed.browser} on ${parsed.os}`
    : `${parsed.browser} on ${parsed.device}`;
}

function eventLocation(event: SecurityEvent) {
  const values = [
    metadataString(event, "city"),
    metadataString(event, "region"),
    metadataString(event, "country"),
  ].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index);
  return values.length ? values.join(", ") : null;
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
      description: "Agency and platform settings remain in the Admin workspace.",
      icon: ShieldCheck,
    };
  }
  return {
    href: "/workspace/recruiter",
    label: "Recruiter workspace",
    description: "Leads, matching, and recruiter operations remain in your recruiter workspace.",
    icon: BriefcaseBusiness,
  };
}

const navigation: Array<{ tab: AccountTab; label: string; icon: typeof UserRound }> = [
  { tab: "profile", label: "Profile", icon: UserRound },
  { tab: "security", label: "Sign-in & security", icon: ShieldCheck },
  { tab: "notifications", label: "Notifications", icon: Bell },
  { tab: "preferences", label: "Preferences", icon: Globe2 },
  { tab: "privacy", label: "Privacy & account", icon: Trash2 },
];

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; message?: string; error?: string; saved?: string }>;
}) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter", "client", "va"]);
  const [
    state,
    notificationPreferences,
    displayPreferences,
    pendingEmailChange,
    pendingDeletionRequest,
  ] = await Promise.all([
    getAccountSecurityState(),
    getAccountNotificationPreferences(user.id),
    getAccountDisplayPreferences(user.id),
    getPendingEmailChange(user.id),
    getPendingAccountDeletionRequest(user.id),
  ]);

  const params = await searchParams;
  const tab: AccountTab = params.tab === "account"
    ? "profile"
    : params.tab === "security" || params.tab === "notifications" || params.tab === "preferences" || params.tab === "privacy" || params.tab === "profile"
      ? params.tab
      : "profile";

  const role = profile.role as Role;
  const roleName = roleLabel(role);
  const email = state.user.email || user.email || "";
  const emailVerified = Boolean(profile.email_verified || user.email_confirmed_at);
  const destination = workspaceProfile(role);
  const DestinationIcon = destination.icon;
  const activeSessions = state.sessions.length;
  const providers = state.signInProviders.length
    ? state.signInProviders.map(providerLabel)
    : ["Email & password"];
  const displayName = profile.full_name || email.split("@")[0] || "Account";

  return (
    <AppShell userId={user.id} role={role} name={profile.full_name} title="Account settings">
      <div className="account-center">
        {params.saved ? <div className="success-banner" role="status">Personal profile updated.</div> : null}
        {params.message ? <div className="success-banner" role="status">{params.message}</div> : null}
        {params.error ? <div className="alert" role="alert">{params.error}</div> : null}

        <header className="account-settings-header">
          <div className="account-avatar account-avatar-compact" aria-hidden="true">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{initials(profile.full_name, email)}</span>}
          </div>
          <div className="account-settings-header-copy">
            <span className="account-panel-eyebrow">Account settings</span>
            <h1>{displayName}</h1>
            <div className="account-settings-identity">
              <span>{email || "No email available"}</span>
              {emailVerified ? <span className="account-verified-badge"><BadgeCheck size={13} /> Verified</span> : null}
              <span className="account-role-badge">{roleName}</span>
            </div>
            <p>Manage your personal profile, sign-in security, notifications, and account preferences.</p>
          </div>
        </header>

        <div className="account-settings-shell">
          <nav className="account-settings-nav" aria-label="Account settings sections">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = tab === item.tab;
              return (
                <Link
                  key={item.tab}
                  href={`/workspace/account?tab=${item.tab}`}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.tab === "security" ? <small>{activeSessions}</small> : null}
                </Link>
              );
            })}
          </nav>

          <main className="account-settings-content">
            {tab === "profile" ? (
              <div className="account-settings-stack">
                <section className="account-settings-section" id="personal-info">
                  <div className="account-settings-section-head">
                    <div>
                      <span className="account-panel-eyebrow">Personal profile</span>
                      <h2>Profile</h2>
                      <p>Keep your personal identity current. Company, hiring, skills, rates, and other role-specific details stay in their dedicated workspace profiles.</p>
                    </div>
                  </div>

                  <form action={updateAccountProfileAction} className="account-profile-form" encType="multipart/form-data">
                    <div className="account-setting-row account-photo-row">
                      <div className="account-setting-copy">
                        <strong>Profile photo</strong>
                        <small>JPG, PNG, or WEBP up to 3 MB.</small>
                      </div>
                      <div className="account-photo-control">
                        <div className="account-avatar account-avatar-lg" aria-hidden="true">
                          {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{initials(profile.full_name, email)}</span>}
                        </div>
                        <label className="btn btn-sm account-upload-button">
                          <Camera size={15} />
                          Change photo
                          <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" />
                        </label>
                      </div>
                    </div>

                    <div className="account-setting-row account-setting-row-form">
                      <div className="account-setting-copy">
                        <label htmlFor="account-full-name"><strong>Full name</strong></label>
                        <small>Used in your workspace and internal team views.</small>
                      </div>
                      <input
                        id="account-full-name"
                        name="full_name"
                        defaultValue={profile.full_name || ""}
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="account-settings-actions">
                      <span>Profile changes apply across your workspace.</span>
                      <button className="btn btn-primary" type="submit">Save profile</button>
                    </div>
                  </form>
                </section>

                <section className="account-settings-section">
                  <div className="account-settings-section-head">
                    <div>
                      <span className="account-panel-eyebrow">Sign-in email</span>
                      <h2>Change email securely</h2>
                      <p>Email changes require a separate verified account flow. Your current email stays active until you confirm the new address.</p>
                    </div>
                  </div>

                  <div className="account-setting-row">
                    <div className="account-setting-copy">
                      <strong>Email address</strong>
                      <small>Used to sign in and receive account security notices.</small>
                    </div>
                    <div className="account-setting-value">
                      <span className="account-email-value">{email || "Not available"}</span>
                      {emailVerified ? <span className="account-inline-status is-good"><CheckCircle2 size={14} /> Verified</span> : null}
                    </div>
                  </div>

                  {pendingEmailChange ? (
                    <div className="account-pending-change" role="status">
                      <Mail size={18} />
                      <div>
                        <strong>Verification pending for {pendingEmailChange.new_email}</strong>
                        <span>Use the link in that inbox before {formatDate(pendingEmailChange.expires_at, displayPreferences)}. A new request replaces the previous link.</span>
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
                      <span className="field-help">We send a one-hour verification link to the new inbox before anything changes.</span>
                    </div>
                    <div className="field">
                      <label htmlFor="email-change-current-password">Confirm current password</label>
                      <input
                        id="email-change-current-password"
                        name="current_password"
                        type="password"
                        autoComplete="current-password"
                        required
                      />
                      <span className="field-help">Required before a sign-in email can be changed. Google/Microsoft-only accounts can set a password through password recovery first.</span>
                    </div>
                    <button className="btn" type="submit">Send verification</button>
                  </form>
                </section>

                <section className="account-settings-section">
                  <div className="account-settings-section-head">
                    <div>
                      <span className="account-panel-eyebrow">Workspace access</span>
                      <h2>Account access</h2>
                    </div>
                  </div>

                  <div className="account-setting-row">
                    <div className="account-setting-copy">
                      <strong>Workspace role</strong>
                      <small>Roles are managed by workspace administrators.</small>
                    </div>
                    <div className="account-setting-value"><span>{roleName}</span></div>
                  </div>

                  <div className="account-setting-row">
                    <div className="account-setting-copy">
                      <strong>Sign-in methods</strong>
                      <small>Ways currently associated with this account.</small>
                    </div>
                    <div className="account-setting-value"><span>{providers.join(", ")}</span></div>
                  </div>

                  <div className="account-setting-row">
                    <div className="account-setting-copy">
                      <strong>{destination.label}</strong>
                      <small>{destination.description}</small>
                    </div>
                    <Link className="account-text-action" href={destination.href}>
                      <DestinationIcon size={16} />
                      Open
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </section>
              </div>
            ) : null}

            {tab === "security" ? (
              <div className="account-settings-stack">
                <section className="account-settings-section">
                  <div className="account-settings-section-head">
                    <div>
                      <span className="account-panel-eyebrow">Account protection</span>
                      <h2>Sign-in & security</h2>
                      <p>Review sign-in methods, devices, and recent security-sensitive activity.</p>
                    </div>
                  </div>

                  <div className="account-setting-row account-setting-row-form">
                    <div className="account-setting-copy">
                      <strong>Change password</strong>
                      <small>Confirm your current password first. A successful change signs out every other session.</small>
                    </div>
                    <form action={changeAccountPasswordAction} className="account-password-form">
                      <input name="current_password" type="password" autoComplete="current-password" placeholder="Current password" aria-label="Current password" required />
                      <input name="new_password" type="password" autoComplete="new-password" placeholder="New password" aria-label="New password" minLength={12} required />
                      <input name="confirm_password" type="password" autoComplete="new-password" placeholder="Confirm new password" aria-label="Confirm new password" minLength={12} required />
                      <button className="btn btn-sm" type="submit"><KeyRound size={15} /> Change password</button>
                    </form>
                  </div>

                  <div className="account-setting-row">
                    <div className="account-setting-copy">
                      <strong>Sign-in methods</strong>
                      <small>{providers.join(", ")}</small>
                    </div>
                    <span className="account-inline-status"><KeyRound size={14} /> {providers[0]}</span>
                  </div>

                  <div className="account-setting-row">
                    <div className="account-setting-copy">
                      <strong>Last sign-in</strong>
                      <small>{formatDate(user.last_sign_in_at, displayPreferences)}</small>
                    </div>
                    <span className="account-inline-status"><MonitorSmartphone size={14} /> {activeSessions} active session{activeSessions === 1 ? "" : "s"}</span>
                  </div>

                  <div className="account-setting-row">
                    <div className="account-setting-copy">
                      <strong>New sign-in tracking</strong>
                      <small>Successful sign-ins are recorded in your security activity so you can review devices without consuming email quota.</small>
                    </div>
                    <span className="account-mandatory-badge"><ShieldCheck size={14} /> Recorded</span>
                  </div>
                </section>

                <section className="account-settings-section account-session-section">
                  <div className="account-settings-section-head">
                    <div>
                      <span className="account-panel-eyebrow">Sessions</span>
                      <h2>{"Where you're logged in"}</h2>
                      <p>Locations are approximate from the connection IP and can differ when using a VPN, mobile carrier, or company network.</p>
                    </div>
                  </div>
                  <SessionList sessions={state.sessions} preferences={displayPreferences} />
                </section>

                <section className="account-settings-section">
                  <div className="account-settings-section-head">
                    <div>
                      <span className="account-panel-eyebrow">Audit trail</span>
                      <h2>Recent security activity</h2>
                      <p>Review security-sensitive account actions and sign-ins.</p>
                    </div>
                  </div>

                  {state.events.length ? (
                    <div className="account-activity-list">
                      {state.events.map((event) => {
                        const location = eventLocation(event);
                        const details = [
                          formatDate(event.created_at, displayPreferences),
                          eventDevice(event),
                          location,
                          event.ip ? `IP ${event.ip}` : null,
                        ].filter(Boolean);
                        return (
                          <div className="account-activity-row" key={event.id}>
                            <span className="account-activity-dot" aria-hidden="true" />
                            <div>
                              <strong>{eventLabels[event.event_type] || event.event_type}</strong>
                              <small>{details.join(" · ")}</small>
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
                        <p>Sign-ins, session revocations, password changes, and verified email changes will appear here.</p>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {tab === "notifications" ? (
              <section className="account-settings-section">
                <div className="account-settings-section-head">
                  <div>
                    <span className="account-panel-eyebrow">Email notifications</span>
                    <h2>Notifications</h2>
                    <p>Choose optional account emails. Security notices stay enabled to protect your account.</p>
                  </div>
                </div>

                <form action={updateNotificationPreferencesAction} className="account-preferences-form">
                  <div className="account-preference-group">
                    <h3>Hiring</h3>
                    <label className="account-preference-row">
                      <span className="account-preference-copy">
                        <strong>Hiring & recruiter updates</strong>
                        <small>Non-critical follow-ups about active hiring requests and recruiter workflow updates.</small>
                      </span>
                      <span className="account-switch">
                        <input type="checkbox" name="hiring_updates" defaultChecked={notificationPreferences.hiring_updates} />
                        <span aria-hidden="true" />
                      </span>
                    </label>
                    <label className="account-preference-row">
                      <span className="account-preference-copy">
                        <strong>Candidate activity</strong>
                        <small>Application, shortlist, and candidate-progress notifications that are not security-critical.</small>
                      </span>
                      <span className="account-switch">
                        <input type="checkbox" name="candidate_activity" defaultChecked={notificationPreferences.candidate_activity} />
                        <span aria-hidden="true" />
                      </span>
                    </label>
                  </div>

                  <div className="account-preference-group">
                    <h3>Calendar</h3>
                    <label className="account-preference-row">
                      <span className="account-preference-copy">
                        <strong>Booking reminders</strong>
                        <small>Reminder emails before scheduled discovery or hiring calls. Booking confirmations still send.</small>
                      </span>
                      <span className="account-switch">
                        <input type="checkbox" name="booking_reminders" defaultChecked={notificationPreferences.booking_reminders} />
                        <span aria-hidden="true" />
                      </span>
                    </label>
                  </div>

                  <div className="account-preference-group">
                    <h3>Product</h3>
                    <label className="account-preference-row">
                      <span className="account-preference-copy">
                        <strong>Product emails</strong>
                        <small>Optional product updates and feature announcements. Off by default.</small>
                      </span>
                      <span className="account-switch">
                        <input type="checkbox" name="product_emails" defaultChecked={notificationPreferences.product_emails} />
                        <span aria-hidden="true" />
                      </span>
                    </label>
                  </div>

                  <div className="account-preference-group">
                    <h3>Security</h3>
                    <div className="account-preference-row is-locked">
                      <span className="account-preference-copy">
                        <strong><ShieldCheck size={16} /> Security alerts</strong>
                        <small>Password, verified email, and new or unusual sign-in notices are mandatory for account protection.</small>
                      </span>
                      <span className="account-mandatory-badge">Always on</span>
                    </div>
                  </div>

                  <div className="account-settings-actions">
                    <span>Security alerts cannot be disabled.</span>
                    <button className="btn btn-primary" type="submit">Save notifications</button>
                  </div>
                </form>
              </section>
            ) : null}

            {tab === "preferences" ? (
              <section className="account-settings-section">
                <div className="account-settings-section-head">
                  <div>
                    <span className="account-panel-eyebrow">Personal display</span>
                    <h2>Preferences</h2>
                    <p>These settings control how account and security timestamps appear to you. They do not change company, booking, or Virtual Assistant availability timezones.</p>
                  </div>
                </div>

                <form action={updateAccountDisplayPreferencesAction} className="account-display-preferences-form">
                  <div className="account-setting-row account-setting-row-form">
                    <div className="account-setting-copy">
                      <label htmlFor="account-timezone"><strong>Timezone</strong></label>
                      <small>Use an IANA timezone such as Asia/Manila or America/New_York.</small>
                    </div>
                    <div>
                      <input
                        id="account-timezone"
                        name="timezone"
                        list="account-timezones"
                        defaultValue={displayPreferences.timezone}
                        autoComplete="off"
                        required
                      />
                      <datalist id="account-timezones">
                        {commonTimeZones.map((zone) => <option value={zone} key={zone} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="account-setting-row account-setting-row-form">
                    <div className="account-setting-copy">
                      <label htmlFor="account-date-format"><strong>Date format</strong></label>
                      <small>Choose a compact or more descriptive date style.</small>
                    </div>
                    <select id="account-date-format" name="date_format" defaultValue={displayPreferences.date_format}>
                      <option value="medium">Sep 21, 2026</option>
                      <option value="short">9/21/26</option>
                    </select>
                  </div>

                  <div className="account-setting-row account-setting-row-form">
                    <div className="account-setting-copy">
                      <label htmlFor="account-time-format"><strong>Time format</strong></label>
                      <small>Choose 12-hour or 24-hour time.</small>
                    </div>
                    <select id="account-time-format" name="time_format" defaultValue={displayPreferences.time_format}>
                      <option value="12h">12-hour</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>

                  <div className="account-settings-actions">
                    <span>Current timezone: {displayPreferences.timezone}</span>
                    <button className="btn btn-primary" type="submit">Save preferences</button>
                  </div>
                </form>
              </section>
            ) : null}

            {tab === "privacy" ? (
              <div className="account-settings-stack">
                <section className="account-settings-section">
                  <div className="account-settings-section-head">
                    <div>
                      <span className="account-panel-eyebrow">Your data</span>
                      <h2>Privacy & account</h2>
                      <p>Export your personal account settings and manage account lifecycle requests.</p>
                    </div>
                  </div>

                  <div className="account-setting-row">
                    <div className="account-setting-copy">
                      <strong>Download account data</strong>
                      <small>Download your profile, account preferences, notification settings, and recent account security activity as JSON.</small>
                    </div>
                    <Link className="btn btn-sm" href="/workspace/account/export" prefetch={false}><Download size={15} /> Download</Link>
                  </div>
                </section>

                <section className="account-settings-section account-danger-zone">
                  <div className="account-settings-section-head">
                    <div>
                      <span className="account-panel-eyebrow">Danger zone</span>
                      <h2>Request account deletion</h2>
                      <p>This sends a deletion request for review. It does not immediately remove your login or linked hiring, placement, interview, billing, or audit records.</p>
                    </div>
                  </div>

                  {pendingDeletionRequest ? (
                    <div className="account-deletion-pending" role="status">
                      <Trash2 size={18} />
                      <div>
                        <strong>
                          {pendingDeletionRequest.status === "reviewing"
                            ? "Deletion request under review"
                            : pendingDeletionRequest.status === "approved"
                              ? "Deletion request approved for controlled review"
                              : pendingDeletionRequest.status === "rejected"
                                ? "Deletion request not approved"
                                : "Deletion request pending"}
                        </strong>
                        <span>Requested {formatDate(pendingDeletionRequest.requested_at, displayPreferences)}. Permanent deletion is never automatic.</span>
                        {pendingDeletionRequest.review_note ? <span>Review note: {pendingDeletionRequest.review_note}</span> : null}
                        {pendingDeletionRequest.status === "pending" || pendingDeletionRequest.status === "reviewing" ? (
                          <form action={cancelAccountDeletionRequestAction}>
                            <button className="btn btn-sm" type="submit">Cancel deletion request</button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <form action={requestAccountDeletionAction} className="account-deletion-form">
                      <div className="field">
                        <label htmlFor="account-delete-confirmation">Type <strong>DELETE MY ACCOUNT</strong> to confirm</label>
                        <input
                          id="account-delete-confirmation"
                          name="confirmation"
                          autoComplete="off"
                          required
                          placeholder="DELETE MY ACCOUNT"
                        />
                        <span className="field-help">This creates a review request only. Permanent deletion is not automatic.</span>
                      </div>
                      <div className="field">
                        <label htmlFor="delete-current-password">Confirm current password</label>
                        <input
                          id="delete-current-password"
                          name="current_password"
                          type="password"
                          autoComplete="current-password"
                          required
                        />
                        <span className="field-help">A deletion request is security-sensitive, so your current password is required.</span>
                      </div>
                      <button className="btn btn-danger" type="submit">Request deletion</button>
                    </form>
                  )}
                </section>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
