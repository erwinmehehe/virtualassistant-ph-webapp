-- These functions are invoked only by database triggers. They should not be
-- callable through the public Data API as RPC endpoints.

revoke execute on function public.archive_proposed_shortlist_when_role_closes()
from public, anon, authenticated;

revoke execute on function public.enforce_va_approval_completion_floor()
from public, anon, authenticated;
