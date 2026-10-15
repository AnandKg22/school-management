import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { calculateFee, numToWords } from "@/lib/financial-formulas";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "fees", "view", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  // Get fee record and joined student details
  const feeRes = await query(
    `SELECT f.*, 
            s.admission_no, s.class, s.section, s.roll_no, s.father_name, 
            s.mother_name, s.guardian_phone, s.address
     FROM app_school_management_fee_payments f
     JOIN app_school_management_students s ON f.student_id = s.id
     WHERE f.id = $1 AND f.is_deleted = false`,
    [id]
  );

  if (feeRes.rows.length === 0) {
    return errorResponse("Fee record not found", "NOT_FOUND", 404);
  }

  const fee = feeRes.rows[0];

  // Calculate previous arrears: sum of due_amount for earlier months
  const arrearsRes = await query(
    `SELECT COALESCE(SUM(due_amount), 0) as arrears
     FROM app_school_management_fee_payments
     WHERE student_id = $1 
       AND fee_month < $2 
       AND is_deleted = false 
       AND status IN ('Due', 'Partial')`,
    [fee.student_id, fee.fee_month]
  );

  const previousArrears = Number(arrearsRes.rows[0]?.arrears || 0);
  const totalPayableWithArrears = Math.round((Number(fee.due_amount) + previousArrears) * 100) / 100;

  // School settings for letterhead
  const schoolRes = await query("SELECT value FROM app_school_management_settings WHERE key = 'school_info'");
  const schoolInfo = schoolRes.rows[0]?.value || {};

  return successResponse({
    fee,
    previousArrears,
    totalPayableWithArrears,
    amountInWords: numToWords(Number(fee.paid_amount) || Number(fee.due_amount) || 0),
    totalInWords: numToWords(totalPayableWithArrears),
    schoolInfo,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "fees", "edit", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to edit fee", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const currentRes = await query(
      "SELECT * FROM app_school_management_fee_payments WHERE id = $1 AND is_deleted = false",
      [id]
    );

    if (currentRes.rows.length === 0) {
      return errorResponse("Fee record not found", "NOT_FOUND", 404);
    }
    const current = currentRes.rows[0];

    const amount = body.amount !== undefined ? Number(body.amount) : Number(current.amount);
    const discount = body.discount !== undefined ? Number(body.discount) : Number(current.discount);
    const lateFee = body.late_fee !== undefined ? Number(body.late_fee) : Number(current.late_fee);
    const paidAmount = body.paid_amount !== undefined ? Number(body.paid_amount) : Number(current.paid_amount);

    const calc = calculateFee({
      amount,
      discount,
      lateFee,
      paidAmount,
    });

    const updateRes = await query(
      `UPDATE app_school_management_fee_payments 
       SET amount = $1, paid_amount = $2, discount = $3, late_fee = $4,
           due_amount = $5, status = $6, payment_date = COALESCE($7, payment_date),
           payment_mode = COALESCE($8, payment_mode), remarks = COALESCE($9, remarks),
           updated_by = $10, updated_at = NOW()
       WHERE id = $11 AND is_deleted = false
       RETURNING *`,
      [
        calc.amount,
        calc.paidAmount,
        calc.discount,
        calc.lateFee,
        calc.dueAmount,
        calc.status,
        body.payment_date || null,
        body.payment_mode || null,
        body.remarks || null,
        user.username,
        id,
      ]
    );

    await logAuditEvent(
      user.username,
      "FEE_UPDATED",
      `Receipt ${current.receipt_no} updated: Paid ₹${calc.paidAmount}, Due ₹${calc.dueAmount}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(updateRes.rows[0], "Fee payment updated successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update fee record", "SERVER_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "fees", "delete", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to delete fee", "FORBIDDEN", 403);
  }

  const res = await query(
    `UPDATE app_school_management_fee_payments 
     SET is_deleted = true, updated_by = $1, updated_at = NOW() 
     WHERE id = $2 AND is_deleted = false 
     RETURNING receipt_no, student_name`,
    [user.username, id]
  );

  if (res.rows.length === 0) {
    return errorResponse("Fee record not found or already deleted", "NOT_FOUND", 404);
  }

  await logAuditEvent(
    user.username,
    "FEE_DELETED",
    `Receipt ${res.rows[0].receipt_no} for ${res.rows[0].student_name} soft-deleted`,
    req.headers.get("x-forwarded-for") || undefined
  );

  return successResponse(null, "Fee payment deleted successfully");
}
