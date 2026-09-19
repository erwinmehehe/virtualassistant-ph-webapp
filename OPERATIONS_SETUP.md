# Production operations setup — v4.9.1

This release turns the four current launch gaps into explicit setup steps and adds in-app readiness checks under **Admin → System setup**.

## 1. Bootstrap the first Admin

Public signup intentionally exposes only Client and VA accounts. The first Admin must be promoted out-of-band; after that, Admin → Users can promote trusted accounts to Recruiter.

### Preferred command

Create or sign in with the account that should become Admin, then run:

```bash
npm run bootstrap:admin -- you@company.com
```

The command reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the environment, `.env.local`, or `.env.ops`. It updates both the public profile role and the user's Auth app metadata.

### SQL fallback

Edit and run:

```text
supabase/bootstrap-first-admin.sql
```

Replace `CHANGE_ME@example.com` with an existing Supabase Auth email before executing it in the Supabase SQL Editor.

After promotion, log out and back in, then open `/workspace/admin`. From **Users**, promote a trusted account to Recruiter.

## 2. Protect `/api/leads`

The external lead-ingestion API is server-to-server only. Native website forms submit through server actions and do not need this secret in the browser.

Generate a strong value:

```bash
npm run secret:lead
```

Set the output as the server-only environment variable:

```text
LEAD_INGEST_SECRET=<generated value>
```

External integrations must send the same value in the `x-lead-secret` request header.

The route now **fails closed**: if `LEAD_INGEST_SECRET` is missing or shorter than 32 characters, `/api/leads` returns `503` and ingests nothing. An incorrect supplied secret returns `401`.

## 3. Configure application notification email with Resend

Set these production variables:

```text
RESEND_API_KEY=
EMAIL_FROM=VirtualAssistant.com.ph <notifications@your-verified-domain.com>
LEAD_NOTIFICATION_EMAIL=
APPLICATION_CC_EMAIL=jrvsaccad@gmail.com
```

`EMAIL_FROM` must use a sender/domain you have verified with Resend. The application no longer treats an `example.com` sender as configured.

Application and lead records are saved independently of email delivery, so a temporary provider outage does not discard a valid application or lead. Admin → System setup shows whether app email is configured and can send a test message to the signed-in Admin.

## 4. Move Supabase Auth email to Resend SMTP

Supabase Auth confirmation and password-reset emails are separate from the app's own Resend API calls. Configure custom SMTP in Supabase for production.

Resend's current Supabase SMTP settings are:

```text
Host: smtp.resend.com
Port: 465
Username: resend
Password: your Resend API key
```

Use a verified sender address for Supabase Auth.

### Dashboard method

In Supabase, open the project and go to Authentication → Email → SMTP Settings. Enable custom SMTP and enter the sender plus the Resend SMTP credentials above.

### Optional Management API command

For a repeatable one-time configuration, copy `.env.ops.example` to `.env.ops`, fill in the values, and run:

```bash
npm run configure:auth-smtp
```

Required one-time values:

```text
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
AUTH_EMAIL_FROM=no-reply@your-verified-domain.com
AUTH_EMAIL_SENDER_NAME=VirtualAssistant.com.ph
AUTH_SMTP_PASSWORD=
```

`AUTH_SMTP_PASSWORD` may be a dedicated Resend API key. If it is blank, the script falls back to `RESEND_API_KEY`.

Treat `SUPABASE_ACCESS_TOKEN` as a high-privilege operations secret. Do not expose it as a `NEXT_PUBLIC_*` variable and do not keep it in production runtime settings after the one-time operation if you do not need it there.

## 5. Configure automatic Google Calendar + Google Meet

Public discovery bookings create the real Google Calendar event before the booking is saved. Google Calendar then creates the Meet conference and sends the client the official calendar invitation.

Enable the **Google Calendar API** in the Google Cloud project that owns your OAuth client, then create or use an OAuth 2.0 client for the Google account/calendar that should own discovery calls.

The production runtime needs:

```text
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary
```

`GOOGLE_CALENDAR_ID` is optional. Leave it as `primary` to book on the authenticated account's primary calendar, or set it to a shared team calendar ID if the team should manage bookings from a shared calendar.

The refresh token must be issued with offline access and permission to manage Calendar events. The application creates, reads, updates, and cancels Calendar events and requests Google Meet conference data. A suitable OAuth scope is:

```text
https://www.googleapis.com/auth/calendar.events.owned
```

One practical one-time setup path is Google OAuth 2.0 Playground using your own OAuth client credentials:

1. Add `https://developers.google.com/oauthplayground` as an authorized redirect URI on the OAuth client.
2. In OAuth Playground settings, enable **Use your own OAuth credentials** and enter that client ID and secret.
3. Authorize the Calendar events scope above with the Google account that owns the booking calendar.
4. Exchange the authorization code and copy the returned refresh token.
5. Add all four values to the **Production** environment in Vercel. Environment-variable changes only take effect on a new deployment.
6. Redeploy production and open **Admin → System setup**. Google Calendar + Meet must show **Configured** before relying on automatic booking.

Do not expose the client secret or refresh token as `NEXT_PUBLIC_*` variables.

## 6. Run the readiness check

Before production launch:

```bash
npm run setup:check -- --strict
```

It checks:

- `LEAD_INGEST_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_APP_URL`
- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REFRESH_TOKEN`

Supabase Auth SMTP remains a manual/project-level verification because the app should not infer or expose SMTP credentials at runtime.

## 7. Acceptance test

1. Log in as Admin and open `/workspace/admin/system`.
2. Confirm lead-ingestion secret, app email, and production URL show **Configured**.
3. Confirm Google Calendar + Meet shows **Configured**.
4. Send the Admin email test and confirm delivery.
5. Book one test discovery call and verify the event appears on the configured Google Calendar with a Google Meet link and the client receives the official Calendar invitation.
6. Promote a test account to Recruiter from Admin → Users.
7. Log in as Recruiter and verify the vetting queue/scorecard flow.
8. Submit a VA through vetting and verify the Admin finalist approval flow.
9. Sign up a new test user and confirm the Supabase Auth confirmation email arrives through your custom SMTP sender.
10. Trigger a password reset and verify that email too.
11. Submit a public role brief and verify the lead exists even if email delivery is temporarily unavailable.
12. Test `/api/leads` once with no secret, once with a bad secret, and once with the correct server-to-server secret.
