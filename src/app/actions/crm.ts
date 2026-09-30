"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLeadCrmStage, legacyLeadStatus } from "@/lib/lead-crm";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

const CRM_OBJECTS = new Set(["lead", "company", "contact"]);
const FIELD_TYPES = new Set(["text", "number", "date", "boolean", "select"]);
const WORKFLOW_ACTIONS = new Set(["create_task", "set_follow_up"]);
const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
const DASHBOARD_WIDGETS = new Set(["active", "needs_action", "discovery", "qualified", "pipeline_value"]);
const CLOSING_NEXT_STEPS = new Set(["proposal", "qualified", "follow_up", "nurture"]);

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function withParam(path: string, key: string, value = "1") {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function slugKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
      continue;
    }
    value += char;
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function csvObjects(text: string) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((cell) => cell.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, String(cells[index] || "").trim()])));
}

export async function saveCrmViewAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const objectType = String(formData.get("object_type") || "lead");
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm");
  if (name.length < 2 || !CRM_OBJECTS.has(objectType)) redirect(withParam(returnTo, "view_error", "Add a valid view name."));

  const filters = {
    view: String(formData.get("view") || "active"),
    owner: String(formData.get("owner") || ""),
    q: String(formData.get("q") || "").slice(0, 120),
    mode: String(formData.get("mode") || "table") === "board" ? "board" : "table",
  };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_saved_views")
    .upsert(
      { user_id: user.id, object_type: objectType, name, filters, updated_at: new Date().toISOString() },
      { onConflict: "user_id,object_type,name" },
    )
    .select("id")
    .single();
  if (error) redirect(withParam(returnTo, "view_error", error.message));
  revalidatePath("/workspace/recruiter/crm");
  redirect(`/workspace/recruiter/crm?saved=${data.id}&view_saved=1`);
}

export async function deleteCrmViewAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const viewId = String(formData.get("view_id") || "");
  const admin = createAdminClient();
  if (viewId) await admin.from("crm_saved_views").delete().eq("id", viewId).eq("user_id", user.id);
  revalidatePath("/workspace/recruiter/crm");
  redirect("/workspace/recruiter/crm?view_deleted=1");
}

export async function saveCrmDashboardPreferencesAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const widgets = formData
    .getAll("widgets")
    .map(String)
    .filter((value) => DASHBOARD_WIDGETS.has(value));
  const admin = createAdminClient();
  const { error } = await admin.from("crm_dashboard_preferences").upsert({
    user_id: user.id,
    widgets: widgets.length ? widgets : ["active", "needs_action", "pipeline_value"],
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  revalidatePath("/workspace/recruiter/crm");
  redirect("/workspace/recruiter/crm?dashboard_saved=1");
}

export async function createCrmCustomFieldAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm");
  const objectType = String(formData.get("object_type") || "lead");
  const label = String(formData.get("label") || "").trim().slice(0, 80);
  const fieldType = String(formData.get("field_type") || "text");
  const fieldKey = slugKey(String(formData.get("field_key") || label));
  const options = String(formData.get("options") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 30);

  if (!CRM_OBJECTS.has(objectType) || !FIELD_TYPES.has(fieldType) || label.length < 2 || fieldKey.length < 2) {
    redirect(withParam(returnTo, "field_error", "Add a valid field name and type."));
  }
  if (fieldType === "select" && !options.length) redirect(withParam(returnTo, "field_error", "Add at least one select option."));

  const { error } = await createAdminClient().from("crm_custom_fields").insert({
    object_type: objectType,
    field_key: fieldKey,
    label,
    field_type: fieldType,
    options,
    created_by: user.id,
  });
  if (error) redirect(withParam(returnTo, "field_error", error.message));
  revalidatePath(returnTo.split("?")[0]);
  redirect(withParam(returnTo, "field_saved"));
}

export async function setCrmCustomValueAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm");
  const fieldId = String(formData.get("field_id") || "");
  const objectId = String(formData.get("object_id") || "");
  const objectType = String(formData.get("object_type") || "");
  const raw = String(formData.get("value") || "").trim();
  if (!fieldId || !objectId || !CRM_OBJECTS.has(objectType)) redirect(withParam(returnTo, "field_error", "Custom field could not be saved."));

  const admin = createAdminClient();
  const { data: field, error: fieldError } = await admin
    .from("crm_custom_fields")
    .select("id,object_type,field_type,options")
    .eq("id", fieldId)
    .maybeSingle();
  if (fieldError || !field || field.object_type !== objectType) redirect(withParam(returnTo, "field_error", "Custom field not found."));

  let value: unknown = raw || null;
  if (field.field_type === "number") {
    const parsed = raw ? Number(raw) : null;
    if (raw && (parsed === null || !Number.isFinite(parsed))) redirect(withParam(returnTo, "field_error", "Enter a valid number."));
    value = parsed;
  } else if (field.field_type === "boolean") {
    value = raw === "true";
  } else if (field.field_type === "date") {
    if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) redirect(withParam(returnTo, "field_error", "Enter a valid date."));
  } else if (field.field_type === "select") {
    const options = Array.isArray(field.options) ? field.options.map(String) : [];
    if (raw && !options.includes(raw)) redirect(withParam(returnTo, "field_error", "Choose a valid option."));
  }

  const { error } = await admin.from("crm_custom_values").upsert(
    {
      field_id: fieldId,
      object_type: objectType,
      object_id: objectId,
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "field_id,object_id" },
  );
  if (error) redirect(withParam(returnTo, "field_error", error.message));
  revalidatePath(returnTo.split("?")[0]);
  redirect(withParam(returnTo, "field_value_saved"));
}

export async function saveCrmClosingControlAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "").trim();
  const returnTo = safePath(formData.get("return_to"), leadId ? `/workspace/recruiter/crm/${leadId}` : "/workspace/recruiter/crm");
  const failureRisks = String(formData.get("failure_risks") || "").trim().slice(0, 5000) || null;
  const additionalNotes = String(formData.get("additional_notes") || "").trim().slice(0, 5000) || null;
  const nextStep = String(formData.get("closing_next_step") || "follow_up").trim();
  const followUpRaw = String(formData.get("next_follow_up_at") || "").trim();
  const quickDaysRaw = String(formData.get("quick_followup_days") || "").trim();

  const fail = (message: string): never => redirect(withParam(returnTo, "closing_error", message));
  if (!leadId) fail("Client record not found.");
  if (!CLOSING_NEXT_STEPS.has(nextStep)) fail("Choose a valid closing next step.");

  let nextFollowUpAt: string | null | undefined;
  if (quickDaysRaw) {
    const days = Number(quickDaysRaw);
    if (![2, 7, 14].includes(days)) fail("Choose a valid follow-up interval.");
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + days);
    followUp.setHours(9, 0, 0, 0);
    nextFollowUpAt = followUp.toISOString();
  } else if (followUpRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(followUpRaw)) fail("Choose a valid follow-up date.");
    const parsed = new Date(`${followUpRaw}T09:00:00+08:00`);
    if (!Number.isFinite(parsed.getTime())) fail("Choose a valid follow-up date.");
    nextFollowUpAt = parsed.toISOString();
  }

  const admin = createAdminClient();
  const { data: lead, error: leadError } = await admin
    .from("lead_intake")
    .select("id,crm_stage,owner_id,job_id,next_follow_up_at")
    .eq("id", leadId)
    .eq("lead_type", "client_hiring")
    .maybeSingle();
  if (leadError) fail(leadError.message);
  if (!lead) fail("Client record not found.");
  const validatedLead = lead!;
  if (["won", "lost"].includes(String(validatedLead.crm_stage || ""))) fail("Closed clients do not need a closing follow-up plan.");

  const qualificationStatus = nextStep === "nurture"
    ? "nurture"
    : nextStep === "follow_up"
      ? "follow_up"
      : "ready";
  const now = new Date().toISOString();

  const { error: briefError } = await admin.from("lead_discovery_briefs").upsert({
    lead_id: leadId,
    failure_risks: failureRisks,
    additional_notes: additionalNotes,
    next_step: nextStep,
    qualification_status: qualificationStatus,
    updated_by: user.id,
    updated_at: now,
  }, { onConflict: "lead_id" });
  if (briefError) fail(briefError.message || "Could not save the closing plan.");

  const leadPatch: Record<string, unknown> = {
    owner_id: validatedLead.owner_id || user.id,
  };
  if (nextFollowUpAt !== undefined) leadPatch.next_follow_up_at = nextFollowUpAt;
  const { error: leadUpdateError } = await admin.from("lead_intake").update(leadPatch).eq("id", leadId).eq("lead_type", "client_hiring");
  if (leadUpdateError) fail(leadUpdateError.message || "Closing notes saved, but the follow-up date could not be updated.");

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: "closing_control_updated",
    description: "Recruiter updated objections, closing notes, next move, or follow-up timing.",
    actorId: user.id,
    metadata: {
      job_id: validatedLead.job_id || null,
      next_step: nextStep,
      next_follow_up_at: nextFollowUpAt === undefined ? validatedLead.next_follow_up_at : nextFollowUpAt,
      has_objection_notes: Boolean(failureRisks),
      has_closing_notes: Boolean(additionalNotes),
      quick_followup_days: quickDaysRaw ? Number(quickDaysRaw) : null,
    },
  });

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/crm");
  revalidatePath(`/workspace/recruiter/crm/${leadId}`);
  revalidatePath("/workspace/recruiter/today");
  redirect(withParam(returnTo, "closing_saved"));
}

export async function updateCrmCompanyAction(formData: FormData) {
  await requireAnyRole(["recruiter", "admin"]);
  const companyId = String(formData.get("company_id") || "");
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm/companies");
  const patch = {
    website: String(formData.get("website") || "").trim().slice(0, 500) || null,
    industry: String(formData.get("industry") || "").trim().slice(0, 120) || null,
    location: String(formData.get("location") || "").trim().slice(0, 160) || null,
    updated_at: new Date().toISOString(),
  };
  if (!companyId) redirect(withParam(returnTo, "company_error", "Company not found."));
  const { error } = await createAdminClient().from("crm_companies").update(patch).eq("id", companyId);
  if (error) redirect(withParam(returnTo, "company_error", error.message));
  revalidatePath(returnTo.split("?")[0]);
  redirect(withParam(returnTo, "company_saved"));
}

export async function updateCrmContactAction(formData: FormData) {
  await requireAnyRole(["recruiter", "admin"]);
  const contactId = String(formData.get("contact_id") || "");
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm/contacts");
  if (!contactId) redirect(withParam(returnTo, "contact_error", "Contact not found."));

  const admin = createAdminClient();
  const { data: contact } = await admin.from("crm_contacts").select("id,lead_id").eq("id", contactId).maybeSingle();
  if (!contact) redirect(withParam(returnTo, "contact_error", "Contact not found."));

  const fullName = String(formData.get("full_name") || "").trim().slice(0, 160) || null;
  const phone = String(formData.get("phone") || "").trim().slice(0, 80) || null;
  const title = String(formData.get("title") || "").trim().slice(0, 120) || null;
  const { error } = await admin.from("crm_contacts").update({ full_name: fullName, phone, title, updated_at: new Date().toISOString() }).eq("id", contactId);
  if (error) redirect(withParam(returnTo, "contact_error", error.message));
  if (contact.lead_id) await admin.from("lead_intake").update({ name: fullName, phone }).eq("id", contact.lead_id);
  revalidatePath(returnTo.split("?")[0]);
  redirect(withParam(returnTo, "contact_saved"));
}



const CRM_BULK_LEAD_LIMIT = 200;

export async function bulkUpdateCrmLeadsAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm");
  const leadIds = [...new Set(formData.getAll("lead_id").map(String).filter(Boolean))];
  const ownerRaw = String(formData.get("bulk_owner_id") || "").trim();
  const followUpRaw = String(formData.get("bulk_follow_up_at") || "").trim();

  const fail = (message: string): never => redirect(withParam(returnTo, "bulk_error", message));
  if (!leadIds.length) fail("Select at least one client record.");
  if (leadIds.length > CRM_BULK_LEAD_LIMIT) fail(`Bulk updates are limited to ${CRM_BULK_LEAD_LIMIT} client records at a time.`);
  if (!ownerRaw && !followUpRaw) fail("Choose an owner or follow-up date to update.");

  const admin = createAdminClient();
  const patch: Record<string, unknown> = {};
  let ownerId: string | null | undefined;

  if (ownerRaw) {
    if (ownerRaw === "__unassigned") {
      ownerId = null;
    } else {
      const { data: owner, error: ownerError } = await admin
        .from("profiles")
        .select("id,role,account_status")
        .eq("id", ownerRaw)
        .maybeSingle();
      if (ownerError) fail(ownerError.message);
      if (!owner || !["recruiter", "admin"].includes(String(owner.role)) || owner.account_status !== "active") {
        fail("Choose an active recruiter or admin.");
      }
      ownerId = owner!.id;
    }
    patch.owner_id = ownerId;
  }

  let followUpAt: string | undefined;
  if (followUpRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(followUpRaw)) fail("Choose a valid follow-up date.");
    const parsed = new Date(`${followUpRaw}T09:00:00+08:00`);
    if (!Number.isFinite(parsed.getTime())) fail("Choose a valid follow-up date.");
    followUpAt = parsed.toISOString();
    patch.next_follow_up_at = followUpAt;
  }

  const { data: selectedLeads, error: selectedError } = await admin
    .from("lead_intake")
    .select("id,crm_stage")
    .eq("lead_type", "client_hiring")
    .in("id", leadIds);
  if (selectedError) fail(selectedError.message);
  const validatedLeads = selectedLeads || [];
  if (!validatedLeads.length) fail("No client hiring records matched that selection.");

  if (followUpAt) {
    const closedCount = validatedLeads.filter((lead) => ["won", "lost"].includes(String(lead.crm_stage || ""))).length;
    if (closedCount) {
      fail(`Follow-up dates can only be set on active clients. ${closedCount} selected record${closedCount === 1 ? " is" : "s are"} already closed.`);
    }
  }

  const selectedLeadIds = validatedLeads.map((lead) => String(lead.id));
  const { data: updated, error } = await admin
    .from("lead_intake")
    .update(patch)
    .eq("lead_type", "client_hiring")
    .in("id", selectedLeadIds)
    .select("id");
  if (error) fail(error.message || "Could not update the selected client records.");

  const updatedIds = (updated || []).map((row) => String(row.id));
  await Promise.all(
    updatedIds.map((leadId) =>
      writeRecruiterActivity({
        subjectType: "lead",
        subjectId: leadId,
        action: "lead_bulk_followup_updated",
        description: "Recruiter updated client follow-up controls from the CRM pipeline.",
        actorId: user.id,
        metadata: {
          owner_id: ownerRaw ? ownerId ?? null : undefined,
          next_follow_up_at: followUpAt,
        },
      })
    )
  );

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/crm");
  revalidatePath("/workspace/recruiter/today");
  redirect(withParam(returnTo, "bulk_saved", String(updatedIds.length)));
}

function normalizeCompanyName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function createCrmCompanyAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm/companies");
  const name = String(formData.get("name") || "").trim().slice(0, 180);
  if (name.length < 2) redirect(withParam(returnTo, "company_error", "Add a company name."));

  const normalizedName = normalizeCompanyName(name);
  const admin = createAdminClient();
  const { data, error } = await admin.from("crm_companies").insert({
    name,
    normalized_name: normalizedName,
    website: String(formData.get("website") || "").trim().slice(0, 500) || null,
    industry: String(formData.get("industry") || "").trim().slice(0, 120) || null,
    location: String(formData.get("location") || "").trim().slice(0, 160) || null,
    owner_id: user.id,
    created_by: user.id,
  }).select("id").single();

  if (error?.code === "23505") {
    const { data: existing } = await admin.from("crm_companies").select("id").eq("normalized_name", normalizedName).maybeSingle();
    if (existing?.id) redirect(`/workspace/recruiter/crm/companies/${existing.id}?company_exists=1`);
  }
  if (error) redirect(withParam(returnTo, "company_error", error.message));
  revalidatePath("/workspace/recruiter/crm/companies");
  redirect(`/workspace/recruiter/crm/companies/${data.id}?company_created=1`);
}

export async function createCrmContactAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm/contacts");
  const fullName = String(formData.get("full_name") || "").trim().slice(0, 160) || null;
  const email = String(formData.get("email") || "").trim().toLowerCase().slice(0, 320) || null;
  const phone = String(formData.get("phone") || "").trim().slice(0, 80) || null;
  const title = String(formData.get("title") || "").trim().slice(0, 120) || null;
  const companyId = String(formData.get("company_id") || "").trim() || null;
  if (!fullName && !email) redirect(withParam(returnTo, "contact_error", "Add a contact name or email."));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(withParam(returnTo, "contact_error", "Enter a valid email address."));

  const admin = createAdminClient();
  if (companyId) {
    const { data: company } = await admin.from("crm_companies").select("id").eq("id", companyId).maybeSingle();
    if (!company) redirect(withParam(returnTo, "contact_error", "Choose a valid company."));
  }

  const { data, error } = await admin.from("crm_contacts").insert({
    company_id: companyId,
    full_name: fullName,
    email,
    phone,
    title,
    owner_id: user.id,
    created_by: user.id,
  }).select("id").single();
  if (error) redirect(withParam(returnTo, "contact_error", error.message));
  revalidatePath("/workspace/recruiter/crm/contacts");
  if (companyId) revalidatePath(`/workspace/recruiter/crm/companies/${companyId}`);
  redirect(`/workspace/recruiter/crm/contacts/${data.id}?contact_created=1`);
}

export async function createCrmWorkflowAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm/automations");
  const name = String(formData.get("name") || "").trim().slice(0, 100);
  const triggerStage = String(formData.get("trigger_stage") || "");
  const actionType = String(formData.get("action_type") || "");
  if (name.length < 3 || !isLeadCrmStage(triggerStage) || !WORKFLOW_ACTIONS.has(actionType)) {
    redirect(withParam(returnTo, "workflow_error", "Choose a valid trigger and action."));
  }

  const days = Math.max(0, Math.min(30, Number(formData.get("days") || 2)));
  const priorityRaw = String(formData.get("priority") || "normal");
  const actionConfig =
    actionType === "create_task"
      ? {
          title: String(formData.get("task_title") || "Follow up with {{company}}").trim().slice(0, 180),
          due_days: days,
          priority: PRIORITIES.has(priorityRaw) ? priorityRaw : "normal",
        }
      : { days };

  const { error } = await createAdminClient().from("crm_workflows").insert({
    name,
    trigger_stage: triggerStage,
    action_type: actionType,
    action_config: actionConfig,
    is_enabled: true,
    created_by: user.id,
  });
  if (error) redirect(withParam(returnTo, "workflow_error", error.message));
  revalidatePath("/workspace/recruiter/crm/automations");
  redirect(withParam(returnTo, "workflow_saved"));
}

export async function toggleCrmWorkflowAction(formData: FormData) {
  await requireAnyRole(["recruiter", "admin"]);
  const id = String(formData.get("workflow_id") || "");
  const enabled = String(formData.get("enabled") || "") === "true";
  if (id) await createAdminClient().from("crm_workflows").update({ is_enabled: enabled, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/workspace/recruiter/crm/automations");
}

export async function deleteCrmWorkflowAction(formData: FormData) {
  await requireAnyRole(["recruiter", "admin"]);
  const id = String(formData.get("workflow_id") || "");
  if (id) await createAdminClient().from("crm_workflows").delete().eq("id", id);
  revalidatePath("/workspace/recruiter/crm/automations");
}

export async function importCrmCsvAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) redirect("/workspace/recruiter/crm/import?import_error=Choose+a+CSV+file.");
  if (file.size > 2_000_000) redirect("/workspace/recruiter/crm/import?import_error=CSV+must+be+under+2MB.");

  const rows = csvObjects(await file.text()).slice(0, 500);
  if (!rows.length) redirect("/workspace/recruiter/crm/import?import_error=No+data+rows+were+found.");
  const emails = [...new Set(rows.map((row) => String(row.email || "").trim().toLowerCase()).filter(Boolean))];
  const admin = createAdminClient();
  const { data: existing } = emails.length
    ? await admin.from("lead_intake").select("email").eq("lead_type", "client_hiring").in("email", emails)
    : { data: [] };
  const seen = new Set((existing || []).map((item) => String(item.email || "").toLowerCase()));

  const inserts: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const row of rows) {
    const email = String(row.email || "").trim().toLowerCase();
    if (!email || seen.has(email)) {
      skipped += 1;
      continue;
    }
    const stageRaw = String(row.crm_stage || "new").trim();
    const stage = isLeadCrmStage(stageRaw) ? stageRaw : "new";
    const estimated = row.estimated_value_usd ? Number(row.estimated_value_usd) : null;
    inserts.push({
      name: String(row.name || "").slice(0, 160) || null,
      email,
      phone: String(row.phone || "").slice(0, 80) || null,
      company: String(row.company || "").slice(0, 180) || null,
      service: String(row.service || "").slice(0, 180) || null,
      hours: String(row.hours || "").slice(0, 80) || null,
      budget: String(row.budget || "").slice(0, 120) || null,
      timezone: String(row.timezone || "").slice(0, 120) || null,
      message: String(row.message || "").slice(0, 4000) || null,
      source_page: "crm_import",
      lead_type: "client_hiring",
      crm_stage: stage,
      status: legacyLeadStatus(stage),
      owner_id: user.id,
      estimated_value_usd: estimated !== null && Number.isFinite(estimated) && estimated >= 0 ? estimated : null,
      stage_updated_at: new Date().toISOString(),
    });
    seen.add(email);
  }

  if (inserts.length) {
    const { error } = await admin.from("lead_intake").insert(inserts);
    if (error) redirect(`/workspace/recruiter/crm/import?import_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/workspace/recruiter/crm");
  redirect(`/workspace/recruiter/crm/import?imported=${inserts.length}&skipped=${skipped}`);
}
