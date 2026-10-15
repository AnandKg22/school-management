import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { calculateFee } from "@/lib/financial-formulas";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "fees", "view", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to view fees", "FORBIDDEN", 403);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const feeMonth = searchParams.get("month")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const studentId = searchParams.get("studentId")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["f.is_deleted = false"];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(f.student_name ILIKE $${params.length} OR f.receipt_no ILIKE $${params.length} OR s.admission_no ILIKE $${params.length})`);
  }

  if (feeMonth) {
    params.push(feeMonth);
    conditions.push(`f.fee_month = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`f.status = $${params.length}`);
  }

  if (studentId) {
    params.push(studentId);
    conditions.push(`f.student_id = $${params.length}`);
  }

  const whereClause = conditions.join(" AND ");

  const countRes = await query(
    `SELECT COUNT(*) as total 
     FROM app_school_management_fee_payments f
     LEFT JOIN app_school_management_students s ON f.student_id = s.id
     WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0]?.total || "0", 10);

  const listParams = [...params, limit, offset];
  const listRes = await query(
    `SELECT f.*, s.admission_no, s.class, s.father_name, s.guardian_phone, s.roll_no, s.section
     FROM app_school_management_fee_payments f
     LEFT JOIN app_school_management_students s ON f.student_id = s.id
     WHERE ${whereClause} 
     ORDER BY f.created_at DESC 
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
  if (!user || !hasPermission(user.permissions, "fees", "add", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to record fees", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const {
      student_id,
      fee_month,
      amount,
      paid_amount = 0,
      discount = 0,
      late_fee = 0,
      payment_date,
      payment_mode = "Cash",
      fee_type = "Tuition",
      remarks,
      academic_year = "2026-2027",
      txn_reference,
    } = body;

    if (!student_id || !fee_month) {
      return errorResponse("Student and Fee Month (YYYY-MM) are required", "VALIDATION_ERROR", 400);
    }

    if (!/^\d{4}-\d{2}$/.test(fee_month)) {
      return errorResponse("Fee month must be in canonical format YYYY-MM", "VALIDATION_ERROR", 400);
    }

    // Check student existence
    const stuRes = await query(
      "SELECT id, name, admission_no, monthly_fee, status FROM app_school_management_students WHERE id = $1 AND is_deleted = false",
      [student_id]
    );
    if (stuRes.rows.length === 0) {
      return errorResponse("Student record not found", "NOT_FOUND", 404);
    }
    const student = stuRes.rows[0];

    // Duplicate check: one active fee per student per month
    const dupRes = await query(
      "SELECT id, receipt_no FROM app_school_management_fee_payments WHERE student_id = $1 AND fee_month = $2 AND is_deleted = false",
      [student_id, fee_month]
    );
    if (dupRes.rows.length > 0) {
      return errorResponse(
        `Fee already exists for ${student.name} in month ${fee_month} (Receipt: ${dupRes.rows[0].receipt_no})`,
        "DUPLICATE_ENTRY",
        409
      );
    }

    // Canonical calculations
    const calc = calculateFee({
      amount: amount !== undefined ? Number(amount) : Number(student.monthly_fee),
      discount: Number(discount),
      lateFee: Number(late_fee),
      paidAmount: Number(paid_amount),
    });

    // Concurrency-safe receipt generation
    const seqRes = await query("SELECT nextval('app_school_management_rcpt_seq') as seq");
    const receipt_no = `RCPT-${seqRes.rows[0].seq}`;

    const insertRes = await query(
      `INSERT INTO app_school_management_fee_payments (
        receipt_no, student_id, student_name, fee_month, amount, paid_amount,
        discount, late_fee, due_amount, status, payment_date, payment_mode,
        remarks, fee_type, academic_year, collected_by, txn_reference, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        receipt_no,
        student_id,
        student.name,
        fee_month,
        calc.amount,
        calc.paidAmount,
        calc.discount,
        calc.lateFee,
        calc.dueAmount,
        calc.status,
        payment_date || new Date().toISOString().slice(0, 10),
        payment_mode,
        remarks || null,
        fee_type,
        academic_year,
        user.username,
        txn_reference || null,
        user.username,
        user.username,
      ]
    );

    await logAuditEvent(
      user.username,
      "FEE_COLLECTED",
      `Receipt ${receipt_no} generated for ${student.name} (${fee_month}): Paid ₹${calc.paidAmount}, Due ₹${calc.dueAmount}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(insertRes.rows[0], "Fee payment recorded successfully", 201);
  } catch (err: any) {
    if (err.code === "23505") {
      return errorResponse("A fee payment with this receipt number or for this month already exists", "CONFLICT", 409);
    }
    return errorResponse(err.message || "Failed to record fee payment", "SERVER_ERROR", 500);
  }
}
