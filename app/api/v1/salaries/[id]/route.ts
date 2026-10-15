import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { calculateSalary, numToWords } from "@/lib/financial-formulas";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "salaries", "view", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  const salRes = await query(
    `SELECT sal.*, 
            t.employee_id, t.qualification, t.designation, t.department, 
            t.join_date, t.phone, t.email, t.bank_account, t.ifsc, t.pan
     FROM app_school_management_salary_payments sal
     JOIN app_school_management_teachers t ON sal.teacher_id = t.id
     WHERE sal.id = $1 AND sal.is_deleted = false`,
    [id]
  );

  if (salRes.rows.length === 0) {
    return errorResponse("Salary payment record not found", "NOT_FOUND", 404);
  }

  const salary = salRes.rows[0];

  const schoolRes = await query("SELECT value FROM app_school_management_settings WHERE key = 'school_info'");
  const schoolInfo = schoolRes.rows[0]?.value || {};

  return successResponse({
    salary,
    netPayInWords: numToWords(Number(salary.net_pay) || 0),
    paidInWords: numToWords(Number(salary.paid_amount) || 0),
    schoolInfo,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "salaries", "edit", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to edit salary", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const currentRes = await query(
      "SELECT * FROM app_school_management_salary_payments WHERE id = $1 AND is_deleted = false",
      [id]
    );

    if (currentRes.rows.length === 0) {
      return errorResponse("Salary record not found", "NOT_FOUND", 404);
    }
    const current = currentRes.rows[0];

    const amount = body.amount !== undefined ? Number(body.amount) : Number(current.amount);
    const basic = body.basic !== undefined ? Number(body.basic) : Number(current.basic);
    const allowances = body.allowances !== undefined ? Number(body.allowances) : Number(current.allowances);
    const deductions = body.deductions !== undefined ? Number(body.deductions) : Number(current.deductions);
    const bonus = body.bonus !== undefined ? Number(body.bonus) : Number(current.bonus);
    const paidAmount = body.paid_amount !== undefined ? Number(body.paid_amount) : Number(current.paid_amount);

    const calc = calculateSalary({
      amount,
      basic,
      allowances,
      deductions,
      bonus,
      paidAmount,
    });

    const updateRes = await query(
      `UPDATE app_school_management_salary_payments 
       SET amount = $1, basic = $2, allowances = $3, deductions = $4,
           bonus = $5, net_pay = $6, paid_amount = $7, status = $8,
           payment_date = COALESCE($9, payment_date), payment_mode = COALESCE($10, payment_mode),
           days_present = COALESCE($11, days_present), bank_reference = COALESCE($12, bank_reference),
           remarks = COALESCE($13, remarks), updated_by = $14, updated_at = NOW()
       WHERE id = $15 AND is_deleted = false
       RETURNING *`,
      [
        calc.amount,
        calc.basic,
        calc.allowances,
        calc.deductions,
        calc.bonus,
        calc.netPay,
        calc.paidAmount,
        calc.status,
        body.payment_date || null,
        body.payment_mode || null,
        body.days_present || null,
        body.bank_reference || null,
        body.remarks || null,
        user.username,
        id,
      ]
    );

    await logAuditEvent(
      user.username,
      "SALARY_UPDATED",
      `Payslip ${current.payslip_no} updated: Net ₹${calc.netPay}, Paid ₹${calc.paidAmount}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(updateRes.rows[0], "Salary payment updated successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update salary payment", "SERVER_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "salaries", "delete", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to delete salary", "FORBIDDEN", 403);
  }

  const res = await query(
    `UPDATE app_school_management_salary_payments 
     SET is_deleted = true, updated_by = $1, updated_at = NOW() 
     WHERE id = $2 AND is_deleted = false 
     RETURNING payslip_no, teacher_name`,
    [user.username, id]
  );

  if (res.rows.length === 0) {
    return errorResponse("Salary payment record not found or already deleted", "NOT_FOUND", 404);
  }

  await logAuditEvent(
    user.username,
    "SALARY_DELETED",
    `Payslip ${res.rows[0].payslip_no} for ${res.rows[0].teacher_name} soft-deleted`,
    req.headers.get("x-forwarded-for") || undefined
  );

  return successResponse(null, "Salary payment deleted successfully");
}
