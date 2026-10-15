import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.isSuper) {
    return errorResponse("Access denied: only Super Admin can access RBAC roles", "FORBIDDEN", 403);
  }

  const res = await query("SELECT * FROM app_school_management_roles ORDER BY sort ASC");
  return successResponse(res.rows);
}

export async function PUT(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.isSuper) {
    return errorResponse("Access denied: only Super Admin can modify permissions", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const { id, label, color, permissions } = body;

    if (!id || !permissions) {
      return errorResponse("Role ID and permissions object are required", "VALIDATION_ERROR", 400);
    }

    const checkRes = await query("SELECT role_key, is_super FROM app_school_management_roles WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return errorResponse("Role not found", "NOT_FOUND", 404);
    }

    const role = checkRes.rows[0];

    const updateRes = await query(
      `UPDATE app_school_management_roles 
       SET label = COALESCE($1, label), color = COALESCE($2, color), permissions = $3, updated_at = NOW() 
       WHERE id = $4 RETURNING *`,
      [label || null, color || null, JSON.stringify(permissions), id]
    );

    await logAuditEvent(
      user.username,
      "ROLE_PERMISSIONS_UPDATED",
      `Permissions updated for role ${role.role_key}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(updateRes.rows[0], "Permissions updated successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update role", "SERVER_ERROR", 500);
  }
}
