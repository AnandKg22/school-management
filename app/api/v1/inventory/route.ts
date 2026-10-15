import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "inventory", "view", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";

  const conditions: string[] = ["is_deleted = false"];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR sku ILIKE $${params.length})`);
  }

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const whereClause = conditions.join(" AND ");
  const res = await query(
    `SELECT * FROM app_school_management_inventory_items WHERE ${whereClause} ORDER BY name ASC`,
    params
  );

  return successResponse(res.rows);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "inventory", "add", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    let {
      sku,
      name,
      category,
      unit = "Piece",
      cost_price = 0,
      selling_price = 0,
      quantity_on_hand = 0,
      reorder_level = 5,
      status = "Active",
    } = body;

    if (!name || !category) {
      return errorResponse("Item name and category are required", "VALIDATION_ERROR", 400);
    }

    if (!sku) {
      sku = `SKU-${Date.now().toString().slice(-6)}`;
    }

    const insertRes = await query(
      `INSERT INTO app_school_management_inventory_items (
        sku, name, category, unit, cost_price, selling_price,
        quantity_on_hand, reorder_level, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        sku,
        name,
        category,
        unit,
        Number(cost_price),
        Number(selling_price),
        Number(quantity_on_hand),
        Number(reorder_level),
        status,
      ]
    );

    await logAuditEvent(
      user.username,
      "INVENTORY_ITEM_CREATED",
      `Item ${name} (${sku}) added to catalog`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(insertRes.rows[0], "Item added successfully", 201);
  } catch (err: any) {
    if (err.code === "23505") {
      return errorResponse("An item with this SKU already exists", "CONFLICT", 409);
    }
    return errorResponse(err.message || "Failed to add inventory item", "SERVER_ERROR", 500);
  }
}
