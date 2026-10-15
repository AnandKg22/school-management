import { NextRequest } from "next/server";
import { withTransaction, query } from "@/lib/db";
import { getAuthenticatedUser, logAuditEvent } from "@/lib/auth";
import { hasPermission } from "@/lib/registry";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "pos", "view", user.isSuper)) {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  const res = await query(
    `SELECT * FROM app_school_management_pos_orders ORDER BY created_at DESC LIMIT 50`
  );

  return successResponse(res.rows);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !hasPermission(user.permissions, "pos", "add", user.isSuper)) {
    return errorResponse("Access denied: insufficient permissions for POS checkout", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const {
      customer_name,
      customer_type = "Student",
      payment_mode = "Cash",
      discount = 0,
      items,
    } = body;

    if (!customer_name || !Array.isArray(items) || items.length === 0) {
      return errorResponse("Customer name and line items are required", "VALIDATION_ERROR", 400);
    }

    const result = await withTransaction(async (client) => {
      let subtotal = 0;
      const verifiedItems: any[] = [];

      for (const line of items) {
        const itemRes = await client.query(
          "SELECT id, name, sku, selling_price, quantity_on_hand FROM app_school_management_inventory_items WHERE id = $1 FOR UPDATE",
          [line.item_id]
        );

        if (itemRes.rows.length === 0) {
          throw new Error(`Item ${line.item_id} not found`);
        }

        const inv = itemRes.rows[0];
        const qty = parseInt(line.quantity, 10);
        if (qty <= 0) throw new Error(`Invalid quantity for ${inv.name}`);

        if (inv.quantity_on_hand < qty) {
          throw new Error(`Insufficient stock for ${inv.name}. Available: ${inv.quantity_on_hand}, Requested: ${qty}`);
        }

        const unitPrice = Number(inv.selling_price);
        const lineTotal = Math.round(unitPrice * qty * 100) / 100;
        subtotal += lineTotal;

        // Deduct stock
        await client.query(
          "UPDATE app_school_management_inventory_items SET quantity_on_hand = quantity_on_hand - $1, updated_at = NOW() WHERE id = $2",
          [qty, inv.id]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO app_school_management_stock_movements (
            item_id, movement_type, quantity, reference_no, notes, created_by
          ) VALUES ($1, 'Issue', $2, 'POS_SALE', $3, $4)`,
          [inv.id, -qty, `Sold to ${customer_name}`, user.username]
        );

        verifiedItems.push({
          item_id: inv.id,
          name: inv.name,
          sku: inv.sku,
          unit_price: unitPrice,
          quantity: qty,
          line_total: lineTotal,
        });
      }

      const totalDiscount = Math.max(0, Number(discount) || 0);
      const netAmount = Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100);

      const seqRes = await client.query("SELECT nextval('app_school_management_pos_seq') as seq");
      const order_no = `ORD-${seqRes.rows[0].seq}`;

      const orderRes = await client.query(
        `INSERT INTO app_school_management_pos_orders (
          order_no, customer_name, customer_type, total_amount, discount,
          net_amount, payment_mode, status, items, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Completed', $8, $9) RETURNING *`,
        [
          order_no,
          customer_name,
          customer_type,
          subtotal,
          totalDiscount,
          netAmount,
          payment_mode,
          JSON.stringify(verifiedItems),
          user.username,
        ]
      );

      return orderRes.rows[0];
    });

    await logAuditEvent(
      user.username,
      "POS_CHECKOUT",
      `Order ${result.order_no} completed for ${customer_name}. Total: ₹${result.net_amount}`,
      req.headers.get("x-forwarded-for") || undefined
    );

    return successResponse(result, "POS order processed successfully", 201);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to process POS checkout", "SERVER_ERROR", 400);
  }
}
