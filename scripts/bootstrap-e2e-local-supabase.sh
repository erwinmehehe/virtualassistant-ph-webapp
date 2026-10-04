#!/usr/bin/env bash
set -euo pipefail

SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-2.113.0}"
BASELINE_MIGRATION="supabase/migrations/20260806000000_e2e_baseline.sql"
BASELINE_COMPAT_MIGRATION="supabase/migrations/20260806000001_e2e_baseline_compat.sql"
MIGRATION_STASH="$(mktemp -d)"

supabase_cli() {
  npx -y "supabase@${SUPABASE_CLI_VERSION}" "$@"
}

restore_migrations() {
  rm -f "$BASELINE_MIGRATION" "$BASELINE_COMPAT_MIGRATION"
  if compgen -G "$MIGRATION_STASH/*.sql" >/dev/null; then
    mv "$MIGRATION_STASH"/*.sql supabase/migrations/
  fi
  rmdir "$MIGRATION_STASH" 2>/dev/null || true
}
trap restore_migrations EXIT

if [ -e "$BASELINE_MIGRATION" ] || [ -e "$BASELINE_COMPAT_MIGRATION" ]; then
  echo "Refusing to overwrite local E2E baseline files." >&2
  exit 1
fi

echo "Stashing versioned migrations so duplicate historical version prefixes do not confuse the CLI..."
mv supabase/migrations/*.sql "$MIGRATION_STASH"/

echo "Staging schema.sql as the local-only baseline..."
cp supabase/schema.sql "$BASELINE_MIGRATION"

cat > "$BASELINE_COMPAT_MIGRATION" <<'SQL'
-- schema.sql is a current production snapshot, while historical migrations
-- temporarily replay older derived view shapes. Remove only the derived views;
-- base tables/functions remain intact.
drop view if exists public.public_va_reviews;
drop view if exists public.public_va_directory;

-- The production project predates Supabase's 2026 explicit Data API grant
-- default and already has service_role CRUD privileges on application tables.
-- Fresh local projects no longer inherit those grants, so reproduce the trusted
-- server role's production access here.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Production also retains legacy authenticated SELECT grants on these
-- role/profile tables. RLS still limits each user to their own rows, and no
-- browser write privilege is restored here.
grant select on table
  public.profiles,
  public.client_profiles,
  public.va_profiles,
  public.va_vetting
to authenticated;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;
SQL

echo "Starting isolated Supabase with the baseline only..."
supabase_cli start -x studio,imgproxy,realtime,storage-api,postgres-meta,edge-runtime,logflare,vector,supavisor
supabase_cli status -o env > .supabase-e2e.env

set -a
source .supabase-e2e.env
set +a
: "${DB_URL:?Local Supabase DB_URL is required}"

echo "Replaying every repository migration with psql in deterministic chronological order..."
migration_order_file="$(mktemp)"
trap 'rm -f "$migration_order_file"; restore_migrations' EXIT

for file in "$MIGRATION_STASH"/*.sql; do
  name="$(basename "$file")"
  version="${name%%_*}"
  sortable="$version"
  while [ "${#sortable}" -lt 14 ]; do
    sortable="${sortable}0"
  done
  printf '%s\t%s\n' "$sortable" "$file" >> "$migration_order_file"
done

sort -k1,1 -k2,2 "$migration_order_file" | while IFS=$'\t' read -r _ file; do
  echo "Applying repository migration $(basename "$file")..."
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file"
done

echo "Local Supabase baseline + all repository migrations are ready."
