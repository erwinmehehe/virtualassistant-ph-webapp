#!/usr/bin/env bash
set -euo pipefail

SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-2.113.0}"
DB_URL="${LOCAL_SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

supabase_cli() {
  npx -y "supabase@${SUPABASE_CLI_VERSION}" "$@"
}

command -v psql >/dev/null || {
  echo "psql is required for the clean-baseline contract lane." >&2
  exit 1
}

echo "Starting isolated local Supabase Postgres..."
supabase_cli db start

for _ in $(seq 1 60); do
  if pg_isready -d "$DB_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
pg_isready -d "$DB_URL" >/dev/null

echo "Applying repository baseline schema..."
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/schema.sql

echo "Replaying every versioned migration over the baseline..."
supabase_cli db push --local --include-all

echo "Restarting as a reduced full Supabase stack for Auth + PostgREST browser tests..."
supabase_cli stop
supabase_cli start -x studio,imgproxy,realtime,storage-api,postgres-meta,edge-runtime,logflare,vector,supavisor

supabase_cli status -o env > .supabase-e2e.env

echo "Local Supabase baseline + migrations are ready."
