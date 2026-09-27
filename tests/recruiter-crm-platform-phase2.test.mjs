import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("CRM phase 2 adds first-class company contact field view workflow and dashboard tables",async()=>{
  const migration=await read("supabase/migrations/20260928063000_crm_platform_phase2.sql");
  for(const table of [
    "crm_companies",
    "crm_contacts",
    "crm_custom_fields",
    "crm_custom_values",
    "crm_saved_views",
    "crm_workflows",
    "crm_dashboard_preferences",
  ]) assert.match(migration,new RegExp(`create table if not exists public\\.${table}`));
  assert.match(migration,/lead_intake_sync_crm_identity/);
  assert.ok(migration.includes("if new.lead_type <> 'client_hiring' then"));
  assert.ok(migration.includes("owner_id, lead_type"));
  assert.match(migration,/enable row level security/);
});

test("CRM main workspace supports saved views dashboard preferences companies contacts and automations",async()=>{
  const page=await read("src/app/workspace/recruiter/crm/page.tsx");
  assert.match(page,/crm_saved_views/);
  assert.match(page,/crm_dashboard_preferences/);
  assert.match(page,/saveCrmViewAction/);
  assert.match(page,/saveCrmDashboardPreferencesAction/);
  assert.match(page,/workspace\/recruiter\/crm\/companies/);
  assert.match(page,/workspace\/recruiter\/crm\/contacts/);
  assert.match(page,/workspace\/recruiter\/crm\/automations/);
  assert.match(page,/workspace\/recruiter\/crm\/export/);
});

test("CRM relationship pages expose companies contacts imports and workflow controls",async()=>{
  const [companies,company,contacts,automations,imports,exportRoute]=await Promise.all([
    read("src/app/workspace/recruiter/crm/companies/page.tsx"),
    read("src/app/workspace/recruiter/crm/companies/[companyId]/page.tsx"),
    read("src/app/workspace/recruiter/crm/contacts/page.tsx"),
    read("src/app/workspace/recruiter/crm/automations/page.tsx"),
    read("src/app/workspace/recruiter/crm/import/page.tsx"),
    read("src/app/workspace/recruiter/crm/export/route.ts"),
  ]);
  assert.match(companies,/crm_companies/);
  assert.match(company,/updateCrmCompanyAction/);
  assert.match(contacts,/updateCrmContactAction/);
  assert.match(automations,/createCrmWorkflowAction/);
  assert.match(imports,/importCrmCsvAction/);
  assert.match(exportRoute,/content-disposition/);
  assert.match(exportRoute,/requireRoleFast\("recruiter"\)/);
});

test("CRM records support custom fields and consolidated communication history",async()=>{
  const page=await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");
  assert.match(page,/crm_custom_fields/);
  assert.match(page,/crm_custom_values/);
  assert.match(page,/createCrmCustomFieldAction/);
  assert.match(page,/setCrmCustomValueAction/);
  assert.match(page,/Communication history/);
  assert.match(page,/crm_company_id/);
  assert.match(page,/crm_contact_id/);
});

test("CRM stage changes run automations only after an actual stage transition",async()=>{
  const [recruiter,runner]=await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/lib/crm-workflows.ts"),
  ]);
  assert.match(recruiter,/stage !== String\(lead\.crm_stage \|\| "new"\)/);
  assert.match(recruiter,/runCrmStageWorkflows/);
  assert.match(runner,/create_task/);
  assert.match(runner,/set_follow_up/);
  assert.match(runner,/recruiter_tasks/);
});

test("CRM CSV import caps batch size and skips duplicate hiring emails",async()=>{
  const actions=await read("src/app/actions/crm.ts");
  assert.match(actions,/slice\(0, 500\)/);
  assert.match(actions,/lead_type: "client_hiring"/);
  assert.match(actions,/seen\.has\(email\)/);
  assert.match(actions,/source_page: "crm_import"/);
});
