import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { calculateSalary } from "@/lib/financial-formulas";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "salaries", "view", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to view salaries", "FORBIDDEN", 403);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const salaryMonth = searchParams.get("month")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const teacherId = searchParams.get("teacherId")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["sal.is_deleted = false"];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(sal.teacher_name ILIKE $${params.length} OR sal.payslip_no ILIKE $${params.length} OR t.employee_id ILIKE $${params.length})`);
  }

  if (salaryMonth) {
    params.push(salaryMonth);
    conditions.push(`sal.salary_month = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`sal.status = $${params.length}`);
  }

  if (teacherId) {
    params.push(teacherId);
    conditions.push(`sal.teacher_id = $${params.length}`);
  }

  const whereClause = conditions.join(" AND ");

  const countRes = await query(
    `SELECT COUNT(*) as total 
     FROM app_school_management_salary_payments sal
     LEFT JOIN app_school_management_teachers t ON sal.teacher_id = t.id
     WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0]?.total || "0", 10);

  const listParams = [...params, limit, offset];
  const listRes = await query(
    `SELECT sal.*, t.employee_id, t.designation, t.department, t.join_date, t.bank_account, t.ifsc, t.pan
     FROM app_school_management_salary_payments sal
     LEFT JOIN app_school_management_teachers t ON sal.teacher_id = t.id
     WHERE ${whereClause} 
     ORDER BY sal.created_at DESC 
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
  if (!user || !hasPermission(user.permissions, "salaries", "add", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to record salary", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const {
      teacher_id,
      salary_month,
      amount,
      paid_amount = 0,
      basic = 0,
      allowances = 0,
      deductions = 0,
      bonus = 0,
      days_present = 30,
      payment_date,
      payment_mode = "Bank Transfer",
      bank_reference,
      remarks,
    } = body;

    if (!teacher_id || !salary_month) {
      return errorResponse("Teacher and Salary Month (YYYY-MM) are required", "VALIDATION_ERROR", 400);
    }

    if (!/^\d{4}-\d{2}$/.test(salary_month)) {
      return errorResponse("Salary month must be in canonical format YYYY-MM", "VALIDATION_ERROR", 400);
    }

    const tRes = await query(
      "SELECT id, name, employee_id, monthly_salary, bank_account, ifsc FROM app_school_management_teachers WHERE id = $1 AND is_deleted = false",
      [teacher_id]
    );
    if (tRes.rows.length === 0) {
      return errorResponse("Teacher record not found", "NOT_FOUND", 404);
    }
    const teacher = tRes.rows[0];

    // Duplicate guard: 1 active salary per teacher per salary month
    const dupRes = await query(
      "SELECT id, payslip_no FROM app_school_management_salary_payments WHERE teacher_id = $1 AND salary_month = $2 AND is_deleted = false",
      [teacher_id, salary_month]
    );
    if (dupRes.rows.length > 0) {
      return errorResponse(
        `Salary already processed for ${teacher.name} in month ${salary_month} (Payslip: ${dupRes.rows[0].payslip_no})`,
        "DUPLICATE_ENTRY",
        409
      );
    }

    // Canonical calculations
    const calc = calculateSalary({
      amount: amount !== undefined ? Number(amount) : Number(teacher.monthly_salary),
      basic: Number(basic),
      allowances: Number(allowances),
      deductions: Number(deductions),
      bonus: Number(bonus),
      paidAmount: Number(paid_amount),
    });

    const seqRes = await query("SELECT nextval('app_school_management_ps_seq') as seq");
    const payslip_no = `PS-${seqRes.rows[0].seq}`;

    const insertRes = await query(
      `INSERT INTO app_school_management_salary_payments (
        payslip_no, teacher_id, teacher_name, salary_month, amount, paid_amount,
        basic, allowances, deductions, bonus, net_pay, status, payment_date, payment_mode,
        remarks, days_present, bank_reference, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        payslip_no,
        teacher_id,
        teacher.name,
        salary_month,
        calc.amount,
        calc.paidAmount,
        calc.basic,
        calc.allowances,
        calc.deductions,
        calc.bonus,
        calc.netPay,
        calc.status,
        payment_date || new Date().toISOString().slice(0, 10),
        payment_mode,
        remarks || null,
        Number(days_present) || 30,
        bank_reference || null,
        user.username,
        user.username,
      ]
    );

    await logAuditEvent(
      user.username,
      "SALARY_DISBURSED",
      `Payslip ${payslip_no} created for ${teacher.name} (${salary_month}): Net ₹${calc.netPay}, Paid ₹${calc.paidAmount}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(insertRes.rows[0], "Salary payment recorded successfully", 201);
  } catch (err: any) {
    if (err.code === "23505") {
      return errorResponse("A salary payment with this payslip number or for this month already exists", "CONFLICT", 409);
    }
    return errorResponse(err.message || "Failed to record salary payment", "SERVER_ERROR", 500);
  }
}
