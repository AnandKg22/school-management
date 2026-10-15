import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "teachers", "view", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to view teachers", "FORBIDDEN", 403);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["is_deleted = false"];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(name ILIKE $${params.length} OR employee_id ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length} OR designation ILIKE $${params.length})`
    );
  }

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.join(" AND ");

  const countRes = await query(`SELECT COUNT(*) as total FROM app_school_management_teachers WHERE ${whereClause}`, params);
  const total = parseInt(countRes.rows[0]?.total || "0", 10);

  const listParams = [...params, limit, offset];
  const listRes = await query(
    `SELECT * FROM app_school_management_teachers 
     WHERE ${whereClause} 
     ORDER BY employee_id ASC 
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    listParams
  );

  return successResponse(listRes.rows, undefined, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "teachers", "add", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to add teachers", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    let {
      employee_id,
      name,
      phone,
      email,
      qualification,
      designation,
      monthly_salary,
      join_date,
      status,
      photo,
      department,
      subjects,
      class_teacher_of,
      date_of_birth,
      gender,
      bank_account,
      ifsc,
      pan,
      leave_balance,
    } = body;

    if (!name) {
      return errorResponse("Teacher name is required", "VALIDATION_ERROR", 400);
    }

    if (!employee_id || String(employee_id).trim() === "") {
      const seqRes = await query("SELECT nextval('app_school_management_emp_seq') as seq");
      employee_id = `EMP-${seqRes.rows[0].seq}`;
    }

    const insertRes = await query(
      `INSERT INTO app_school_management_teachers (
        employee_id, name, phone, email, qualification, designation, monthly_salary,
        join_date, status, photo, department, subjects, class_teacher_of, date_of_birth,
        gender, bank_account, ifsc, pan, leave_balance, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *`,
      [
        employee_id,
        name,
        phone || null,
        email || null,
        qualification || null,
        designation || "Teacher",
        Number(monthly_salary) || 25000.0,
        join_date || new Date().toISOString().slice(0, 10),
        status || "Active",
        photo || null,
        department || "General",
        subjects || null,
        class_teacher_of || null,
        date_of_birth || null,
        gender || "Female",
        bank_account || null,
        ifsc || null,
        pan || null,
        Number(leave_balance) || 15,
        user.username,
        user.username,
      ]
    );

    await logAuditEvent(
      user.username,
      "TEACHER_CREATED",
      `Teacher ${name} (${employee_id}) registered`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(insertRes.rows[0], "Teacher registered successfully", 201);
  } catch (err: any) {
    if (err.code === "23505") {
      return errorResponse("A teacher with this employee ID already exists", "CONFLICT", 409);
    }
    return errorResponse(err.message || "Failed to create teacher", "SERVER_ERROR", 500);
  }
}
