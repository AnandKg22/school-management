import { NextRequest } from "next/server";
import { withTransaction, query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { calculateFee, numToWords } from "@/lib/financial-formulas";
import { successResponse, errorResponse } from "@/lib/api-response";

interface ChildFeeInput {
  student_id: string;
  amount: number;
  discount: number;
  paid_amount: number;
  late_fee?: number;
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "fees", "add", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to record family fees", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const {
      fee_month,
      payment_date = new Date().toISOString().slice(0, 10),
      payment_mode = "Cash",
      academic_year = "2026-2027",
      children,
    } = body as {
      fee_month: string;
      payment_date?: string;
      payment_mode?: string;
      academic_year?: string;
      children: ChildFeeInput[];
    };

    if (!fee_month || !/^\d{4}-\d{2}$/.test(fee_month)) {
      return errorResponse("Fee month must be in canonical format YYYY-MM", "VALIDATION_ERROR", 400);
    }

    if (!Array.isArray(children) || children.length === 0) {
      return errorResponse("At least one child must be selected for family billing", "VALIDATION_ERROR", 400);
    }

    // Atomic transaction execution
    const result = await withTransaction(async (client) => {
      const createdRows: any[] = [];
      const skippedChildren: { student_id: string; name: string; reason: string }[] = [];

      for (const child of children) {
        // Fetch student details
        const stuRes = await client.query(
          "SELECT id, name, admission_no, class FROM app_school_management_students WHERE id = $1 AND is_deleted = false",
          [child.student_id]
        );

        if (stuRes.rows.length === 0) {
          skippedChildren.push({
            student_id: child.student_id,
            name: "Unknown",
            reason: "Student record not found",
          });
          continue;
        }

        const student = stuRes.rows[0];

        // Check if student already has a fee record for this month
        const dupRes = await client.query(
          "SELECT receipt_no FROM app_school_management_fee_payments WHERE student_id = $1 AND fee_month = $2 AND is_deleted = false",
          [child.student_id, fee_month]
        );

        if (dupRes.rows.length > 0) {
          skippedChildren.push({
            student_id: child.student_id,
            name: student.name,
            reason: `Already billed for ${fee_month} (Receipt: ${dupRes.rows[0].receipt_no})`,
          });
          continue;
        }

        // Canonical calculation
        const calc = calculateFee({
          amount: Number(child.amount) || 0,
          discount: Number(child.discount) || 0,
          lateFee: Number(child.late_fee) || 0,
          paidAmount: Number(child.paid_amount) || 0,
        });

        // Generate unique receipt number
        const seqRes = await client.query("SELECT nextval('app_school_management_rcpt_seq') as seq");
        const receipt_no = `RCPT-${seqRes.rows[0].seq}`;

        const insertRes = await client.query(
          `INSERT INTO app_school_management_fee_payments (
            receipt_no, student_id, student_name, fee_month, amount, paid_amount,
            discount, late_fee, due_amount, status, payment_date, payment_mode,
            remarks, fee_type, academic_year, collected_by, created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18
          ) RETURNING *`,
          [
            receipt_no,
            student.id,
            student.name,
            fee_month,
            calc.amount,
            calc.paidAmount,
            calc.discount,
            calc.lateFee,
            calc.dueAmount,
            calc.status,
            payment_date,
            payment_mode,
            `Family Billing Batch (${children.length} siblings)`,
            "Tuition",
            academic_year,
            user.username,
            user.username,
            user.username,
          ]
        );

        createdRows.push({
          ...insertRes.rows[0],
          admission_no: student.admission_no,
          class: student.class,
        });
      }

      return {
        createdRows,
        skippedChildren,
      };
    });

    const totalPaid = result.createdRows.reduce((acc, row) => acc + Number(row.paid_amount), 0);
    const totalDue = result.createdRows.reduce((acc, row) => acc + Number(row.due_amount), 0);

    await logAuditEvent(
      user.username,
      "FAMILY_FEES_BILLED",
      `Family billing completed: ${result.createdRows.length} siblings processed, Total Paid ₹${totalPaid}, Total Due ₹${totalDue}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(
      {
        created: result.createdRows,
        skipped: result.skippedChildren,
        summary: {
          totalStudentsBilled: result.createdRows.length,
          totalStudentsSkipped: result.skippedChildren.length,
          totalPaid,
          totalDue,
          amountInWords: numToWords(totalPaid),
        },
      },
      `Successfully processed ${result.createdRows.length} sibling fees (${result.skippedChildren.length} skipped)`
    );
  } catch (err: any) {
    return errorResponse(err.message || "Failed to process family billing batch", "SERVER_ERROR", 500);
  }
}
