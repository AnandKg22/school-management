import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "students", "view", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to view student", "FORBIDDEN", 403);
  }

  const res = await query(
    `SELECT * FROM app_school_management_students WHERE id = $1 AND is_deleted = false`,
    [id]
  );

  if (res.rows.length === 0) {
    return errorResponse("Student not found", "NOT_FOUND", 404);
  }

  // Also fetch payment history for this student
  const feesRes = await query(
    `SELECT * FROM app_school_management_fee_payments 
     WHERE student_id = $1 AND is_deleted = false 
     ORDER BY fee_month DESC`,
    [id]
  );

  return successResponse({
    student: res.rows[0],
    fees: feesRes.rows,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "students", "edit", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to edit student", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const allowedFields = [
      "name", "class", "gender", "dob", "father_name", "mother_name", "guardian_phone",
      "address", "monthly_fee", "status", "photo", "section", "roll_no", "academic_year",
      "category", "transport_route", "transport_fee", "discount_percent", "sibling_group",
      "blood_group", "emergency_contact", "date_of_leaving", "tc_issued"
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
    const sql = `UPDATE app_school_management_students 
                 SET ${updates.join(", ")} 
                 WHERE id = $${values.length} AND is_deleted = false 
                 RETURNING *`;

    const res = await query(sql, values);
    if (res.rows.length === 0) {
      return errorResponse("Student not found or already deleted", "NOT_FOUND", 404);
    }

    await logAuditEvent(
      user.username,
      "STUDENT_UPDATED",
      `Student ID ${id} (${res.rows[0].name}) updated`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(res.rows[0], "Student updated successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update student", "SERVER_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "students", "delete", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to delete student", "FORBIDDEN", 403);
  }

  const res = await query(
    `UPDATE app_school_management_students 
     SET is_deleted = true, updated_by = $1, updated_at = NOW() 
     WHERE id = $2 AND is_deleted = false 
     RETURNING name, admission_no`,
    [user.username, id]
  );

  if (res.rows.length === 0) {
    return errorResponse("Student not found or already deleted", "NOT_FOUND", 404);
  }

  await logAuditEvent(
    user.username,
    "STUDENT_DELETED",
    `Student ${res.rows[0].name} (${res.rows[0].admission_no}) soft-deleted`,
    req.headers.get("x-forwarded-for") || undefined
  );

  return successResponse(null, "Student deleted successfully");
}
