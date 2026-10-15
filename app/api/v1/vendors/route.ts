import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "vendors", "view", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  const res = await query(
    "SELECT * FROM app_school_management_vendors WHERE is_deleted = false ORDER BY name ASC"
  );
  return successResponse(res.rows);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "vendors", "add", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const { name, contact_person, phone, email, address, gst_no, status = "Active" } = body;

    if (!name) {
      return errorResponse("Vendor name is required", "VALIDATION_ERROR", 400);
    }

    const insertRes = await query(
      `INSERT INTO app_school_management_vendors (
        name, contact_person, phone, email, address, gst_no, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, contact_person || null, phone || null, email || null, address || null, gst_no || null, status]
    );

    await logAuditEvent(
      user.username,
      "VENDOR_CREATED",
      `Vendor ${name} registered`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(insertRes.rows[0], "Vendor added successfully", 201);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to add vendor", "SERVER_ERROR", 500);
  }
}
