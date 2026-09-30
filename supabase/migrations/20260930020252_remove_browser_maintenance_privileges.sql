-- PostgreSQL 17 adds MAINTAIN as a table privilege. Browser roles do not
-- need table-maintenance or schema-definition privileges through the Data API.

alter default privileges for role postgres in schema public
  revoke maintain on tables from anon, authenticated;

revoke truncate, references, trigger, maintain
  on all tables in schema public
  from anon, authenticated;
