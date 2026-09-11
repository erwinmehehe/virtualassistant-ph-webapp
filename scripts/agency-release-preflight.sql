-- Read-only agency release preflight. Run against the intended production project.
-- No customer identifiers, emails, proposal tokens, or secrets are returned.
begin transaction read only;
select version, name from supabase_migrations.schema_migrations
where name in ('v4144_sales_crm','v4145_discovery_proposals','v4146_proposal_table_hardening','v4147_finish_agency_sales_handoff','v4148_harden_public_directory_views')
order by version;
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename in ('lead_proposals','recruiter_activity','recruiter_notes','workflow_reminders');
select conname, pg_get_constraintdef(oid) as definition from pg_constraint
where conname in ('lead_proposals_status_check','workflow_reminders_subject_type_check');
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='lead_proposals' and grantee in ('anon','authenticated');
select policyname, roles, qual, with_check from pg_policies
where schemaname='public' and tablename='lead_proposals';
select c.relname, c.reloptions
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('public_va_directory','public_company_profiles','public_va_reviews','public_va_certifications')
order by c.relname;
select exists(select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='application_status' and e.enumlabel='offered') as offered_stage_exists;
select count(*) as accepted_active_roles_missing_access
from public.jobs j join public.job_commercials c on c.job_id=j.id
left join public.job_candidate_access a on a.job_id=j.id
where j.client_id is not null and j.status in ('pending','published')
and c.commercial_status='accepted' and (a.job_id is null or a.access_status not in ('paid','comped'));
select count(*) as proposal_count from public.lead_proposals;
select count(*) as accepted_proposals_missing_role_or_commercials
from public.lead_proposals p left join public.jobs j on j.id=p.job_id
left join public.job_commercials c on c.job_id=p.job_id
where p.status='accepted' and (j.id is null or c.commercial_status is distinct from 'accepted');
rollback;
