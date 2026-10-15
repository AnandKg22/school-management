import { NextRequest } from "next/server";
import { withTransaction, query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "stock", "view", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  const res = await query(
    `SELECT sm.*, i.name as item_name, i.sku, i.unit, i.quantity_on_hand
     FROM app_school_management_stock_movements sm
     JOIN app_school_management_inventory_items i ON sm.item_id = i.id
     ORDER BY sm.created_at DESC LIMIT 100`
  );

  return successResponse(res.rows);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "stock", "add", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions to record stock movements", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const { item_id, movement_type, quantity, reference_no, notes } = body;

    const qty = parseInt(quantity, 10);
    if (!item_id || !movement_type || isNaN(qty) || qty === 0) {
      return errorResponse("Item ID, movement type, and valid non-zero quantity are required", "VALIDATION_ERROR", 400);
    }

    const result = await withTransaction(async (client) => {
      // 1. Check item exists
      const itemRes = await client.query(
        "SELECT id, name, sku, quantity_on_hand FROM app_school_management_inventory_items WHERE id = $1 FOR UPDATE",
        [item_id]
      );
      if (itemRes.rows.length === 0) {
        throw new Error("Inventory item not found");
      }
      const item = itemRes.rows[0];

      let delta = 0;
      if (movement_type === "Receipt" || movement_type === "Opening") {
        delta = Math.abs(qty);
      } else if (movement_type === "Issue") {
        delta = -Math.abs(qty);
      } else if (movement_type === "Adjustment") {
        delta = qty; // can be positive or negative
      }

      const newQty = item.quantity_on_hand + delta;
      if (newQty < 0) {
        throw new Error(`Insufficient stock. Current stock is ${item.quantity_on_hand}, cannot issue ${Math.abs(qty)}`);
      }

      // 2. Insert stock movement record
      const smRes = await client.query(
        `INSERT INTO app_school_management_stock_movements (
          item_id, movement_type, quantity, reference_no, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [item_id, movement_type, delta, reference_no || null, notes || null, user.username]
      );

      // 3. Update item quantity on hand
      await client.query(
        "UPDATE app_school_management_inventory_items SET quantity_on_hand = $1, updated_at = NOW() WHERE id = $2",
        [newQty, item_id]
      );

      return {
        movement: smRes.rows[0],
        item: { ...item, quantity_on_hand: newQty },
      };
    });

    await logAuditEvent(
      user.username,
      "STOCK_MOVEMENT",
      `${movement_type} of ${qty} units for ${result.item.name} (${result.item.sku}). New Balance: ${result.item.quantity_on_hand}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(result, "Stock movement recorded successfully", 201);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to process stock movement", "SERVER_ERROR", 400);
  }
}
