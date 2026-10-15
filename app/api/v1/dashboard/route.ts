import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "dashboard", "view", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  // 1. Student totals
  const studentStats = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE is_deleted = false) as total_students,
      COUNT(*) FILTER (WHERE status = 'Active' AND is_deleted = false) as active_students,
      COUNT(*) FILTER (WHERE status = 'Inactive' AND is_deleted = false) as inactive_students
    FROM app_school_management_students
  `);

  // 2. Teacher totals
  const teacherStats = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE is_deleted = false) as total_teachers,
      COUNT(*) FILTER (WHERE status = 'Active' AND is_deleted = false) as active_teachers
    FROM app_school_management_teachers
  `);

  // 3. Fee metrics (Strictly calculating positive due_amounts without double counting or offset)
  const feeStats = await query(`
    SELECT 
      COALESCE(SUM(paid_amount), 0) as total_fee_collected,
      COALESCE(SUM(CASE WHEN due_amount > 0 THEN due_amount ELSE 0 END), 0) as total_fee_pending,
      COUNT(*) FILTER (WHERE status = 'Paid') as paid_count,
      COUNT(*) FILTER (WHERE status = 'Due') as due_count,
      COUNT(*) FILTER (WHERE status = 'Partial') as partial_count
    FROM app_school_management_fee_payments
    WHERE is_deleted = false
  `);

  // 4. Salary metrics
  const salaryStats = await query(`
    SELECT 
      COALESCE(SUM(paid_amount), 0) as total_salary_disbursed,
      COALESCE(SUM(CASE WHEN (net_pay - paid_amount) > 0 THEN (net_pay - paid_amount) ELSE 0 END), 0) as total_salary_pending
    FROM app_school_management_salary_payments
    WHERE is_deleted = false
  `);

  // 5. Ledger totals (Income & Expense)
  const ledgerStats = await query(`
    SELECT 
      COALESCE(SUM(CASE WHEN txn_type = 'Income' THEN amount ELSE 0 END), 0) as ledger_income,
      COALESCE(SUM(CASE WHEN txn_type = 'Expense' THEN amount ELSE 0 END), 0) as ledger_expense
    FROM app_school_management_transactions
    WHERE is_deleted = false
  `);

  // 6. Class Distribution
  const classDist = await query(`
    SELECT class, COUNT(*) as count 
    FROM app_school_management_students 
    WHERE is_deleted = false AND status = 'Active' 
    GROUP BY class 
    ORDER BY class ASC
  `);

  // 7. Recent Activity (last 6 audit events)
  const recentLogs = await query(`
    SELECT id, timestamp, user_name, action, details 
    FROM app_school_management_logs 
    ORDER BY timestamp DESC 
    LIMIT 6
  `);

  // 8. Low Stock Alerts
  const lowStock = await query(`
    SELECT id, sku, name, category, quantity_on_hand, reorder_level 
    FROM app_school_management_inventory_items 
    WHERE is_deleted = false AND quantity_on_hand <= reorder_level 
    LIMIT 5
  `);

  const totalRevenue = Number(feeStats.rows[0]?.total_fee_collected || 0) + Number(ledgerStats.rows[0]?.ledger_income || 0);
  const totalExpenditure = Number(salaryStats.rows[0]?.total_salary_disbursed || 0) + Number(ledgerStats.rows[0]?.ledger_expense || 0);
  const netOperatingBalance = Math.round((totalRevenue - totalExpenditure) * 100) / 100;

  return successResponse({
    overview: {
      totalStudents: parseInt(studentStats.rows[0]?.total_students || "0", 10),
      activeStudents: parseInt(studentStats.rows[0]?.active_students || "0", 10),
      activeTeachers: parseInt(teacherStats.rows[0]?.active_teachers || "0", 10),
      totalFeeCollected: Number(feeStats.rows[0]?.total_fee_collected || 0),
      totalFeePending: Number(feeStats.rows[0]?.total_fee_pending || 0),
      totalSalaryDisbursed: Number(salaryStats.rows[0]?.total_salary_disbursed || 0),
      totalSalaryPending: Number(salaryStats.rows[0]?.total_salary_pending || 0),
      totalRevenue,
      totalExpenditure,
      netOperatingBalance,
    },
    classDistribution: classDist.rows,
    recentActivity: recentLogs.rows,
    lowStockAlerts: lowStock.rows,
  });
}
