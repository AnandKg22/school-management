import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (user) {
    await logAuditEvent(user.username, "LOGOUT", "User logged out of session", req.headers.get("x-forwarded-for") || undefined);
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.delete("asm_session");
  return response;
}
