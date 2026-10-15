import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
  }

  // Also fetch system school settings
  const settingsRes = await query("SELECT key, value FROM app_school_management_settings");
  const settings: Record<string, any> = {};
  for (const row of settingsRes.rows) {
    settings[row.key] = row.value;
  }

  return successResponse({
    user,
    settings,
  });
}
