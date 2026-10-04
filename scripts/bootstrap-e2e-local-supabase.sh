#!/usr/bin/env bash
set -euo pipefail

SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-2.113.0}"
BASELINE_MIGRATION="supabase/migrations/20260806000000_e2e_baseline.sql"
BASELINE_COMPAT_MIGRATION="supabase/migrations/20260806000001_e2e_baseline_compat.sql"

supabase_cli() {
  npx -y "supabase@${SUPABASE_CLI_VERSION}" "$@"
}

cleanup() {
  rm -f "$BASELINE_MIGRATION" "$BASELINE_COMPAT_MIGRATION"
}
trap cleanup EXIT

for path in "$BASELINE_MIGRATION" "$BASELINE_COMPAT_MIGRATION"; do
  if [ -e "$path" ]; then
    echo "Refusing to overwrite $path" >&2
    exit 1
  fi
done

echo "Staging schema.sql as a local-only pre-migration baseline..."
cp supabase/schema.sql "$BASELINE_MIGRATION"

cat > "$BASELINE_COMPAT_MIGRATION" <<'SQL'
-- schema.sql is a current production snapshot, while the versioned migrations
-- replay historical shapes. Derived views must therefore be removed before the
-- old migrations rebuild them in their original order. Base tables/functions
-- remain intact and are what the migration chain actually evolves.
drop view if exists public.public_va_reviews;
drop view if exists public.public_va_directory;
SQL

echo "Starting isolated Supabase with the baseline followed by every real migration..."
supabase_cli start -x studio,imgproxy,realtime,storage-api,postgres-meta,edge-runtime,logflare,vector,supavisor

supabase_cli status -o env > .supabase-e2e.env

echo "Local Supabase baseline + migrations are ready."
