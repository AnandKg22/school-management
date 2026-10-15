import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, hashPassword, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.isSuper) {
    return errorResponse("Access denied: only Super Admin can view user accounts", "FORBIDDEN", 403);
  }

  const res = await query(
    `SELECT u.id, u.username, u.email, u.status, u.theme_mode, u.created_at,
            r.id as role_id, r.role_key, r.label as role_label, r.is_super
     FROM app_school_management_users u
     LEFT JOIN app_school_management_roles r ON u.role_id = r.id
     ORDER BY u.created_at ASC`
  );

  return successResponse(res.rows);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.isSuper) {
    return errorResponse("Access denied: only Super Admin can create accounts", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const { username, email, password, role_id, status = "Active" } = body;

    if (!username || !email || !password || !role_id) {
      return errorResponse("Username, email, password, and role are required", "VALIDATION_ERROR", 400);
    }

    const hashedPassword = hashPassword(password);

    const insertRes = await query(
      `INSERT INTO app_school_management_users (
        username, email, password_hash, role_id, status, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, status, created_at`,
      [username.trim(), email.trim().toLowerCase(), hashedPassword, role_id, status, user.username, user.username]
    );

    await logAuditEvent(
      user.username,
      "USER_CREATED",
      `User account ${username} created with role ID ${role_id}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(insertRes.rows[0], "User created successfully", 201);
  } catch (err: any) {
    if (err.code === "23505") {
      return errorResponse("A user with this username or email already exists", "CONFLICT", 409);
    }
    return errorResponse(err.message || "Failed to create user", "SERVER_ERROR", 500);
  }
}
