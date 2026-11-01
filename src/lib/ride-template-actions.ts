"use server";

import { getCurrentUser } from "@/lib/auth";
import { listRideTemplates, type RideTemplate } from "@/lib/ride-templates";

// Yalnızca oturumdaki sürücünün KENDİ önceki yolculukları döner.
export async function listRideTemplatesAction(): Promise<RideTemplate[] | null> {
  const user = await getCurrentUser();

  if (!user || user.role !== "driver") {
    return null;
  }

  try {
    return await listRideTemplates(user.id);
  } catch {
    return null;
  }
}