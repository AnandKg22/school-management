import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
  }

  const res = await query("SELECT key, value, updated_at, updated_by FROM app_school_management_settings");
  const settings: Record<string, any> = {};
  for (const row of res.rows) {
    settings[row.key] = row.value;
  }

  return successResponse(settings);
}

export async function PUT(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.isSuper) {
    return errorResponse("Access denied: only Super Admin can update school settings", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || !value) {
      return errorResponse("Setting key and value are required", "VALIDATION_ERROR", 400);
    }

    const res = await query(
      `INSERT INTO app_school_management_settings (key, value, updated_at, updated_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW(), updated_by = $3
       RETURNING *`,
      [key, JSON.stringify(value), user.username]
    );

    await logAuditEvent(
      user.username,
      "SETTINGS_UPDATED",
      `Setting '${key}' updated`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(res.rows[0], "Settings updated successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update settings", "SERVER_ERROR", 500);
  }
}
