import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "students", "view", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to view students", "FORBIDDEN", 403);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const className = searchParams.get("class")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["is_deleted = false"];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(name ILIKE $${params.length} OR admission_no ILIKE $${params.length} OR guardian_phone ILIKE $${params.length} OR roll_no ILIKE $${params.length})`
    );
  }

  if (className) {
    params.push(className);
    conditions.push(`class = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.join(" AND ");

  // Count total matching
  const countRes = await query(`SELECT COUNT(*) as total FROM app_school_management_students WHERE ${whereClause}`, params);
  const total = parseInt(countRes.rows[0]?.total || "0", 10);

  // Paginated list
  const listParams = [...params, limit, offset];
  const listRes = await query(
    `SELECT * FROM app_school_management_students 
     WHERE ${whereClause} 
     ORDER BY admission_no ASC 
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
  if (!user || !hasPermission(user.permissions, "students", "add", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to add students", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    let {
      admission_no,
      name,
      class: className,
      gender,
      dob,
      father_name,
      mother_name,
      guardian_phone,
      address,
      admission_date,
      monthly_fee,
      status,
      photo,
      section,
      roll_no,
      academic_year,
      category,
      transport_route,
      transport_fee,
      discount_percent,
      sibling_group,
      blood_group,
      emergency_contact,
    } = body;

    if (!name || !className) {
      return errorResponse("Name and Class are required fields", "VALIDATION_ERROR", 400);
    }

    // Auto-generate Admission Number if omitted
    if (!admission_no || String(admission_no).trim() === "") {
      const seqRes = await query("SELECT nextval('app_school_management_adm_seq') as seq");
      admission_no = `ADM-${seqRes.rows[0].seq}`;
    }

    // Monthly fee default based on class if not provided
    if (monthly_fee === undefined || monthly_fee === null || monthly_fee === "") {
      if (["Nursery", "LKG", "UKG"].includes(className)) {
        monthly_fee = 650.0;
      } else {
        monthly_fee = 700.0;
      }
    }

    const insertRes = await query(
      `INSERT INTO app_school_management_students (
        admission_no, name, class, gender, dob, father_name, mother_name, guardian_phone,
        address, admission_date, monthly_fee, status, photo, section, roll_no, academic_year,
        category, transport_route, transport_fee, discount_percent, sibling_group, blood_group,
        emergency_contact, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22,
        $23, $24, $25
      ) RETURNING *`,
      [
        admission_no,
        name,
        className,
        gender || "Male",
        dob || null,
        father_name || null,
        mother_name || null,
        guardian_phone || null,
        address || null,
        admission_date || new Date().toISOString().slice(0, 10),
        Number(monthly_fee) || 650.0,
        status || "Active",
        photo || null,
        section || "A",
        roll_no || null,
        academic_year || "2026-2027",
        category || "General",
        transport_route || null,
        Number(transport_fee) || 0.0,
        Number(discount_percent) || 0.0,
        sibling_group || null,
        blood_group || null,
        emergency_contact || null,
        user.username,
        user.username,
      ]
    );

    await logAuditEvent(
      user.username,
      "STUDENT_CREATED",
      `Student ${name} (${admission_no}) enrolled in class ${className}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(insertRes.rows[0], "Student enrolled successfully", 201);
  } catch (err: any) {
    if (err.code === "23505") {
      return errorResponse("A student with this admission number already exists", "CONFLICT", 409);
    }
    return errorResponse(err.message || "Failed to create student", "SERVER_ERROR", 500);
  }
}
