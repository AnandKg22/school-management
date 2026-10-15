"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Search, CreditCard } from "lucide-react";
import Swal from "sweetalert2";

interface PosViewProps {
  user: any;
}

export default function PosView({ user }: PosViewProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerType, setCustomerType] = useState("Student");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [discount, setDiscount] = useState(0);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/inventory");
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load POS catalog", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddToCart = (item: any) => {
    if (item.quantity_on_hand <= 0) {
      Swal.fire("Out of Stock", `${item.name} is currently out of stock`, "warning");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.quantity_on_hand) {
          Swal.fire("Stock Limit", `Cannot add more than ${item.quantity_on_hand} units available`, "warning");
          return prev;
        }
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const nextQty = i.quantity + delta;
            if (nextQty > i.quantity_on_hand) {
              Swal.fire("Stock Limit", `Max available is ${i.quantity_on_hand}`, "warning");
              return i;
            }
            return { ...i, quantity: nextQty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const subtotal = cart.reduce((acc, item) => acc + Number(item.selling_price) * item.quantity, 0);
  const totalDiscount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      Swal.fire("Required", "Please enter customer or student name", "warning");
      return;
    }
    if (cart.length === 0) {
      Swal.fire("Cart Empty", "Please add items to cart before checkout", "warning");
      return;
    }

    try {
      const payload = {
        customer_name: customerName,
        customer_type: customerType,
        payment_mode: paymentMode,
        discount: totalDiscount,
        items: cart.map((i) => ({
          item_id: i.id,
          quantity: i.quantity,
        })),
      };

      const res = await fetch("/api/v1/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Sale Completed",
          text: `Order ${json.data.order_no} created. Total ₹${json.data.net_amount} received via ${paymentMode}!`,
          confirmButtonColor: "#0074D9",
        });
        setCart([]);
        setCustomerName("");
        setDiscount(0);
        fetchItems();
      } else {
        Swal.fire("Error", json.error?.message || "Failed to complete checkout", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const filteredItems = items.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Product Catalog Selection Grid */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="relative flex-1 mr-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search store items, uniforms, notebooks, stationery..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">{filteredItems.length} items cataloged</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const inStock = item.quantity_on_hand > 0;
            return (
              <div
                key={item.id}
                onClick={() => inStock && handleAddToCart(item)}
                className={`p-4 bg-white dark:bg-slate-900 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  inStock
                    ? "border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 shadow-sm hover:shadow"
                    : "border-slate-200/60 dark:border-slate-800/40 opacity-60 cursor-not-allowed"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>{item.sku}</span>
                    <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">{item.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{item.name}</h4>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-extrabold text-sky-600 font-mono">
                      ₹{Number(item.selling_price).toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-slate-400">{item.unit}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inStock ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {inStock ? `${item.quantity_on_hand} left` : "Out of stock"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: POS Order Cart & Checkout Drawer */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-fit space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-sky-500" />
            <span>Active Register Cart</span>
          </h3>
          <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded">
            {cart.reduce((a, b) => a + b.quantity, 0)} units
          </span>
        </div>

        {/* Customer Info Form */}
        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Customer / Student Name *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
              placeholder="e.g. Aarav Sharma (Class I)"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Customer Type</label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border rounded text-xs"
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Staff">Staff</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border rounded text-xs font-semibold"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
          {cart.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <span>Cart is empty. Click catalog items to add.</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex-1 mr-2 truncate">
                  <span className="font-semibold text-slate-900 dark:text-white block truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ₹{Number(item.selling_price).toFixed(2)} x {item.quantity}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleUpdateQty(item.id, -1)}
                    className="p-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQty(item.id, 1)}
                    className="p-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Summary & Checkout Button */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span className="font-mono">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Instant Concession:</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-20 p-1 text-right text-xs bg-slate-50 dark:bg-slate-800 border rounded font-mono text-emerald-600"
              placeholder="₹"
            />
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>Grand Total:</span>
            <span className="font-mono text-base text-sky-600 font-extrabold">₹{grandTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Complete Checkout (₹{grandTotal.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
