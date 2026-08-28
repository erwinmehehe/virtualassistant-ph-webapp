-- v4.10.8: skill certifications.
-- Auto-derived from existing skills test results -- no new input required
-- from VAs. A VA is "certified" in a category once their reviewed final
-- score meets or exceeds that test's passing score. This is a read-only
-- view over data that already exists (va_test_attempts / skills_tests).

create or replace view public.public_va_certifications as
select
  vta.va_id,
  st.category,
  st.title as test_title,
  vta.final_score,
  st.passing_score,
  vta.reviewed_at
from public.va_test_attempts vta
join public.skills_tests st on st.id = vta.test_id
where st.active = true
  and vta.final_score is not null
  and vta.final_score >= st.passing_score;

grant select on public.public_va_certifications to anon, authenticated;
