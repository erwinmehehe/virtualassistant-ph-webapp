# QA Report — Client Job Posting, Social Login, VA Photos

## Implemented

- Confirmed the existing protected client job creation page at `/workspace/client/jobs/new`.
- Promoted **Post a job** to the primary desktop client-menu CTA and kept it in the mobile account menu.
- Added Supabase OAuth entry points for **Google** and **Microsoft** login.
- Added Google/Microsoft social signup for **clients**, preserving client role and requested destination through the auth callback.
- Kept VA signup on the email registration form so a profile photo can be required during registration.
- Added a required VA profile photo field at signup (JPG/PNG/WEBP, max 3 MB).
- Added server-side VA photo validation; the browser `required` attribute is not the only protection.
- If the required VA photo cannot be stored/attached, the newly-created auth user is rolled back so a photo-less VA registration is not silently accepted.
- Existing VA profile editing requires a photo when one is missing.
- VA profiles cannot remain directory-visible without a profile photo.
- Homepage featured VA query excludes null photos and applies a second application-level non-empty-photo filter before rendering.

## Access / functionality QA

- Client job creation route calls `requireRole("client")`.
- Job create action also calls `requireRole("client")`, so direct server-action submission is protected.
- OAuth callback only accepts public signup roles (`client` or `va`) from the callback query and never allows recruiter/admin role creation.
- Workspace redirect protection remains role-aware after login.
- `npm run typecheck`: PASS.

## Production build check

`npm run build` could not complete in this sandbox because Next.js attempted to download the Linux SWC package from `registry.npmjs.org`, while outbound registry/network access is unavailable. The failure occurred while loading the compiler, before application compilation. TypeScript validation passes.

## Deployment setup required for social login

The application code is wired for Supabase OAuth, but Google and Microsoft must be enabled in the project's Supabase Authentication provider settings with valid provider credentials. The deployed `/auth/callback` URL must also be allowed in Supabase/provider redirect settings.
