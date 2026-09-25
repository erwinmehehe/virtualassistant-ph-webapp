"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { sendVaTrainingAnnouncementBatch } from "@/lib/va-training-announcement";

export async function sendVaTrainingAnnouncementBatchAction() {
  await requireRole("admin");
  await sendVaTrainingAnnouncementBatch(20);
  revalidatePath("/workspace/admin/email-health");
}
