import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, createSessionToken, logAuditEvent } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse("Username and password are required", "INVALID_CREDENTIALS", 400);
    }

    const trimmedUser = String(username).trim();

    // Query user by username or email
    const res = await query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.status, u.profile_image, u.theme_mode, u.custom_colors,
              r.id as role_id, r.role_key, r.label as role_label, r.is_super, r.permissions
       FROM app_school_management_users u
       LEFT JOIN app_school_management_roles r ON u.role_id = r.id
       WHERE LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1)`,
      [trimmedUser]
    );

    if (res.rows.length === 0) {
      await logAuditEvent(trimmedUser, "AUTH_FAILED", "Invalid username or email", req.headers.get("x-forwarded-for") || undefined);
      return errorResponse("Invalid username or password", "UNAUTHORIZED", 401);
    }

    const user = res.rows[0];

    if (user.status !== "Active") {
      await logAuditEvent(user.username, "AUTH_REJECTED", "Account is deactivated", req.headers.get("x-forwarded-for") || undefined);
      return errorResponse("Your account is deactivated. Please contact administrator.", "ACCOUNT_INACTIVE", 403);
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      await logAuditEvent(user.username, "AUTH_FAILED", "Incorrect password attempt", req.headers.get("x-forwarded-for") || undefined);
      return errorResponse("Invalid username or password", "UNAUTHORIZED", 401);
    }

    const token = createSessionToken({
      id: user.id,
      username: user.username,
      email: user.email,
      isSuper: Boolean(user.is_super),
    });

    await logAuditEvent(user.username, "LOGIN_SUCCESS", "User authenticated successfully", req.headers.get("x-forwarded-for") || undefined);

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          roleId: user.role_id,
          roleKey: user.role_key || "guest",
          roleLabel: user.role_label || "Guest",
          isSuper: Boolean(user.is_super),
          permissions: user.permissions || {},
          profileImage: user.profile_image,
          themeMode: user.theme_mode,
          customColors: user.custom_colors,
        },
      },
    });

    // Set HttpOnly cookie for session persistence
    response.cookies.set("asm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return errorResponse(err.message || "Internal server error during login", "SERVER_ERROR", 500);
  }
}
