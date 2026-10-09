import "server-only";

import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildTrainingAccountActivation,
  type TrainingAccountActivation,
  type TrainingActivationEnrollment,
  type TrainingActivationLessonCompletion,
  type TrainingOriginAccount,
} from "@/lib/training-account-activation";

const AUTH_PAGE_SIZE = 500;
const MAX_AUTH_PAGES = 40;
const DB_PAGE_SIZE = 500;
const MAX_GROUP_ROWS = 100_000;

type AdminClient = ReturnType<typeof createAdminClient>;

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type TableConfig = {
  name: string;
  fields: string;
  filter: string;
  ordering: string[];
};

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

async function readByAccountIds<T>(
  admin: AdminClient,
  config: TableConfig,
  accountIds: string[],
): Promise<T[]> {
  const result: T[] = [];
  // Short IN filters avoid URL length limits. Explicit pagination avoids the
  // Data API default 1,000-row cap silently corrupting conversion rates.
  for (const batch of chunks(accountIds, 75)) {
    let finished = false;
    for (let offset = 0; offset < MAX_GROUP_ROWS; offset += DB_PAGE_SIZE) {
      let query = admin
        .from(config.name)
        .select(config.fields)
        .in(config.filter, batch);
      for (const order of config.ordering) query = query.order(order);
      const { data, error } = await query.range(offset, offset + DB_PAGE_SIZE - 1)
        as QueryResult<T>;
      if (error || !data) throw new Error("Training activation source query unavailable: " + config.name);
      result.push(...data);
      if (result.length > MAX_GROUP_ROWS) throw new Error("Training activation data capacity exceeded");
      if (data.length < DB_PAGE_SIZE) {
        finished = true;
        break;
      }
    }
    if (!finished) throw new Error("Training activation source truncated: " + config.name);
  }
  return result;
}

export async function getTrainingAccountActivation(): Promise<TrainingAccountActivation> {
  // Explicit authorization BEFORE initializing the service-role data client.
  await requireRoleFast("admin");
  const admin = createAdminClient();

  try {
    const accounts: TrainingOriginAccount[] = [];
    let exhausted = false;
    for (let page = 1; page <= MAX_AUTH_PAGES; page++) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: AUTH_PAGE_SIZE,
      });
      if (error || !data) throw new Error("Training account origin lookup unavailable");
      for (const user of data.users) {
        if (user.app_metadata?.account_type !== "training" ||
            user.is_anonymous === true || user.deleted_at) continue;
        accounts.push({ id: user.id, created_at: user.created_at });
      }
      if (data.users.length < AUTH_PAGE_SIZE) {
        exhausted = true;
        break;
      }
    }
    if (!exhausted) throw new Error("Training account origin lookup truncated");

    const ids = accounts.map(account => account.id);
    if (!ids.length) {
      return buildTrainingAccountActivation({
        accounts: [], enrollments: [], lessonCompletions: [],
        verifiedVaProfileUserIds: [], nowMs: Date.now(),
      });
    }

    type EnrollmentDb = TrainingActivationEnrollment & { id: string };
    type ProgressDb = TrainingActivationLessonCompletion & { lesson_id: string };
    const [enrollments, lessons, profiles, vaProfiles] = await Promise.all([
      readByAccountIds<EnrollmentDb>(admin, {
        name: "training_enrollments",
        fields: "id,user_id,started_at,completed_at",
        filter: "user_id",
        ordering: ["user_id", "id"],
      }, ids),
      readByAccountIds<ProgressDb>(admin, {
        name: "training_lesson_progress",
        fields: "user_id,lesson_id",
        filter: "user_id",
        ordering: ["user_id", "lesson_id"],
      }, ids),
      readByAccountIds<{id:string;role:string}>(admin, {
        name: "profiles", fields: "id,role", filter: "id", ordering: ["id"],
      }, ids),
      readByAccountIds<{user_id:string}>(admin, {
        name: "va_profiles", fields: "user_id", filter: "user_id", ordering: ["user_id"],
      }, ids),
    ]);

    // A VA candidate account is counted only when both role authority and
    // its candidate profile exist. User-editable signup metadata is irrelevant.
    const approvedRoleIds = new Set(profiles.filter(row => row.role === "va").map(row => row.id));
    const verifiedVaProfileUserIds = vaProfiles
      .map(row => row.user_id).filter(id => approvedRoleIds.has(id));

    return buildTrainingAccountActivation({
      accounts,
      enrollments,
      lessonCompletions: lessons,
      verifiedVaProfileUserIds,
      nowMs: Date.now(),
    });
  } catch (error) {
    // Do not leak learner identities, emails or service credentials to logs.
    console.error("[training activation] aggregate data unavailable",
      error instanceof Error ? error.message : "unknown");
    return buildTrainingAccountActivation({
      accounts: [], enrollments: [], lessonCompletions: [],
      verifiedVaProfileUserIds: [], nowMs: Date.now(), complete: false,
    });
  }
}
