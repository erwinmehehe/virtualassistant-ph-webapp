-- v3.1.0 step 1: commit the recruiter enum value before later migrations use it.
alter type public.user_role add value if not exists 'recruiter' after 'va';
