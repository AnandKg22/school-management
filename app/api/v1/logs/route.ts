import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.isSuper) {
    return errorResponse("Access denied: only Super Admin can view audit logs", "FORBIDDEN", 403);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(action ILIKE $${params.length} OR user_name ILIKE $${params.length} OR details ILIKE $${params.length})`);
  }

  const whereClause = conditions.join(" AND ");

  const countRes = await query(`SELECT COUNT(*) as total FROM app_school_management_logs WHERE ${whereClause}`, params);
  const total = parseInt(countRes.rows[0]?.total || "0", 10);

  const listParams = [...params, limit, offset];
  const listRes = await query(
    `SELECT * FROM app_school_management_logs 
     WHERE ${whereClause} 
     ORDER BY timestamp DESC 
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
