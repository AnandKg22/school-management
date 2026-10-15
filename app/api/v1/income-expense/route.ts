import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "income_expense", "view", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const txnType = searchParams.get("type")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["is_deleted = false"];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(voucher_no ILIKE $${params.length} OR description ILIKE $${params.length} OR vendor ILIKE $${params.length} OR account_head ILIKE $${params.length})`);
  }

  if (txnType) {
    params.push(txnType);
    conditions.push(`txn_type = $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const whereClause = conditions.join(" AND ");

  const countRes = await query(`SELECT COUNT(*) as total FROM app_school_management_transactions WHERE ${whereClause}`, params);
  const total = parseInt(countRes.rows[0]?.total || "0", 10);

  const listParams = [...params, limit, offset];
  const listRes = await query(
    `SELECT * FROM app_school_management_transactions 
     WHERE ${whereClause} 
     ORDER BY txn_date DESC, created_at DESC 
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
  if (!user || !hasPermission(user.permissions, "income_expense", "add", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to add transaction", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const {
      txn_type,
      category,
      amount,
      description,
      txn_date = new Date().toISOString().slice(0, 10),
      payment_mode = "Cash",
      vendor,
      account_head,
      attachment_url,
    } = body;

    if (!txn_type || !category || !amount || Number(amount) <= 0) {
      return errorResponse("Transaction type, category, and positive amount are required", "VALIDATION_ERROR", 400);
    }

    const seqRes = await query("SELECT nextval('app_school_management_vch_seq') as seq");
    const voucher_no = `VCH-${seqRes.rows[0].seq}`;

    const insertRes = await query(
      `INSERT INTO app_school_management_transactions (
        voucher_no, txn_type, category, amount, description, txn_date, payment_mode,
        vendor, account_head, approved_by, attachment_url, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *`,
      [
        voucher_no,
        txn_type,
        category,
        Number(amount),
        description || null,
        txn_date,
        payment_mode,
        vendor || null,
        account_head || null,
        user.username,
        attachment_url || null,
        user.username,
        user.username,
      ]
    );

    await logAuditEvent(
      user.username,
      "TRANSACTION_RECORDED",
      `Voucher ${voucher_no} (${txn_type} ₹${amount}) for ${category}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(insertRes.rows[0], "Transaction recorded successfully", 201);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to record transaction", "SERVER_ERROR", 500);
  }
}
