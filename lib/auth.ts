import crypto from "crypto";
import { query } from "./db";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roleId: string | null;
  roleKey: string;
  roleLabel: string;
  isSuper: boolean;
  permissions: Record<string, string[]>;
  profileImage?: string | null;
  themeMode?: string;
  customColors?: Record<string, string>;
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const candidateHash = hashPassword(password);
  return candidateHash === hash;
}

export function createSessionToken(user: { id: string; username: string; email: string; isSuper: boolean }): string {
  const payload = {
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json).toString("base64url");
  const secret = process.env.SUPABASE_DB_PASSWORD || "devmatrix_school_management_session_secret";
  const signature = crypto.createHmac("sha256", secret).update(base64).digest("base64url");
  return `${base64}.${signature}`;
}

export function verifySessionToken(token: string): { id: string; username: string; email: string; isSuper: boolean } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [base64, signature] = parts;
    const secret = process.env.SUPABASE_DB_PASSWORD || "devmatrix_school_management_session_secret";
    const expectedSig = crypto.createHmac("sha256", secret).update(base64).digest("base64url");
    if (signature !== expectedSig) return null;

    const json = Buffer.from(base64, "base64url").toString("utf8");
    const payload = JSON.parse(json);
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(req: Request): Promise<AuthUser | null> {
  let token: string | null = null;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  // 2. Check Cookie
  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/asm_session=([^;]+)/);
      if (match) token = match[1];
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  // Retrieve fresh user and role info from PostgreSQL
  const res = await query(
    `SELECT u.id, u.username, u.email, u.status, u.profile_image, u.theme_mode, u.custom_colors,
            r.id as role_id, r.role_key, r.label as role_label, r.is_super, r.permissions
     FROM app_school_management_users u
     LEFT JOIN app_school_management_roles r ON u.role_id = r.id
     WHERE u.id = $1 AND u.status = 'Active'`,
    [payload.id]
  );

  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    roleId: row.role_id,
    roleKey: row.role_key || "guest",
    roleLabel: row.role_label || "Guest",
    isSuper: Boolean(row.is_super),
    permissions: (row.permissions as Record<string, string[]>) || {},
    profileImage: row.profile_image,
    themeMode: row.theme_mode,
    customColors: row.custom_colors,
  };
}

export async function logAuditEvent(userName: string, action: string, details: string, ipAddress?: string): Promise<void> {
  try {
    await query(
      `INSERT INTO app_school_management_logs (user_name, action, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userName, action, details, ipAddress || "127.0.0.1"]
    );
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
