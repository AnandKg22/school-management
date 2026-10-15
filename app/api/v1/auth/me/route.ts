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

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword, themeMode } = body;

    if (newPassword) {
      if (!currentPassword) {
        return errorResponse("Current password is required to set a new password", "INVALID_INPUT", 400);
      }

      // Fetch user's current password hash
      const userRes = await query(
        "SELECT password_hash FROM app_school_management_users WHERE id = $1",
        [user.id]
      );

      if (userRes.rows.length === 0) {
        return errorResponse("User not found", "NOT_FOUND", 404);
      }

      const { hashPassword, verifyPassword, logAuditEvent } = await import("@/lib/auth");
      const isMatch = verifyPassword(currentPassword, userRes.rows[0].password_hash);
      if (!isMatch) {
        await logAuditEvent(user.username, "PASSWORD_CHANGE_FAILED", "Incorrect current password");
        return errorResponse("Current password is incorrect", "UNAUTHORIZED", 401);
      }

      const newHash = hashPassword(newPassword);
      await query(
        "UPDATE app_school_management_users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        [newHash, user.id]
      );

      await logAuditEvent(user.username, "PASSWORD_CHANGED", "User successfully changed password");
    }

    if (themeMode) {
      await query(
        "UPDATE app_school_management_users SET theme_mode = $1, updated_at = NOW() WHERE id = $2",
        [themeMode, user.id]
      );
    }

    return successResponse({ updated: true }, "Account settings updated successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update account", "SERVER_ERROR", 500);
  }
}
