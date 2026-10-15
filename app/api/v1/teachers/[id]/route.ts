import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "teachers", "view", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  const res = await query(
    `SELECT * FROM app_school_management_teachers WHERE id = $1 AND is_deleted = false`,
    [id]
  );

  if (res.rows.length === 0) {
    return errorResponse("Teacher not found", "NOT_FOUND", 404);
  }

  // Also fetch salary payments for this teacher
  const salRes = await query(
    `SELECT * FROM app_school_management_salary_payments 
     WHERE teacher_id = $1 AND is_deleted = false 
     ORDER BY salary_month DESC`,
    [id]
  );

  return successResponse({
    teacher: res.rows[0],
    salaries: salRes.rows,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "teachers", "edit", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to edit teacher", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const allowedFields = [
      "name", "phone", "email", "qualification", "designation", "monthly_salary",
      "status", "photo", "department", "subjects", "class_teacher_of", "date_of_birth",
      "gender", "bank_account", "ifsc", "pan", "leave_balance"
    ];

    const updates: string[] = [];
    const values: unknown[] = [];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        values.push(body[key]);
        updates.push(`${key} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return errorResponse("No valid fields provided for update", "VALIDATION_ERROR", 400);
    }

    values.push(user.username);
    updates.push(`updated_by = $${values.length}`);
    updates.push(`updated_at = NOW()`);

    values.push(id);
    const sql = `UPDATE app_school_management_teachers 
                 SET ${updates.join(", ")} 
                 WHERE id = $${values.length} AND is_deleted = false 
                 RETURNING *`;

    const res = await query(sql, values);
    if (res.rows.length === 0) {
      return errorResponse("Teacher not found or already deleted", "NOT_FOUND", 404);
    }

    await logAuditEvent(
      user.username,
      "TEACHER_UPDATED",
      `Teacher ID ${id} (${res.rows[0].name}) updated`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(res.rows[0], "Teacher updated successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update teacher", "SERVER_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "teachers", "delete", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to delete teacher", "FORBIDDEN", 403);
  }

  const res = await query(
    `UPDATE app_school_management_teachers 
     SET is_deleted = true, updated_by = $1, updated_at = NOW() 
     WHERE id = $2 AND is_deleted = false 
     RETURNING name, employee_id`,
    [user.username, id]
  );

  if (res.rows.length === 0) {
    return errorResponse("Teacher not found or already deleted", "NOT_FOUND", 404);
  }

  await logAuditEvent(
    user.username,
    "TEACHER_DELETED",
    `Teacher ${res.rows[0].name} (${res.rows[0].employee_id}) soft-deleted`,
    req.headers.get("x-forwarded-for") || undefined
  );

  return successResponse(null, "Teacher deleted successfully");
}
