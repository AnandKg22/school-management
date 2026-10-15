"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Users,
  Search,
  Printer,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  CreditCard,
  DollarSign,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import { calculateFee } from "@/lib/financial-formulas";
import FeeReceiptModal from "../print/FeeReceiptModal";
import FeeChallanModal from "../print/FeeChallanModal";

interface FeesViewProps {
  user: any;
}

export default function FeesView({ user }: FeesViewProps) {
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("2026-10");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Print Modals
  const [printReceiptData, setPrintReceiptData] = useState<any>(null);
  const [printChallanData, setPrintChallanData] = useState<any>(null);

  // Single Fee Modal
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [singleForm, setSingleForm] = useState<any>({
    student_id: "",
    fee_month: "2026-10",
    amount: 700,
    paid_amount: 700,
    discount: 0,
    late_fee: 0,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: "Cash",
    remarks: "",
  });

  // Family Billing Modal
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyGroups, setFamilyGroups] = useState<Record<string, any[]>>({});
  const [selectedFamilyKey, setSelectedFamilyKey] = useState<string>("");
  const [familyMonth, setFamilyMonth] = useState<string>("2026-10");
  const [familyPaymentDate, setFamilyPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [familyPaymentMode, setFamilyPaymentMode] = useState<string>("UPI");
  const [familyChildrenState, setFamilyChildrenState] = useState<Record<string, any>>({});

  const fetchFees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/v1/fees?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setFees(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch fees", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/v1/students?limit=100");
      const json = await res.json();
      if (json.success) {
        const list = json.data || [];
        setStudents(list);

        // Group students into families
        const groups: Record<string, any[]> = {};
        for (const s of list) {
          const key = s.sibling_group || (s.guardian_phone ? `PHONE-${s.guardian_phone}` : `IND-${s.id}`);
          if (!groups[key]) groups[key] = [];
          groups[key].push(s);
        }
        setFamilyGroups(groups);
      }
    } catch (err) {
      console.error("Failed to fetch students for fee selector", err);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [search, selectedMonth, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Single Fee Calculator preview
  const singleCalc = calculateFee({
    amount: singleForm.amount,
    discount: singleForm.discount,
    lateFee: singleForm.late_fee,
    paidAmount: singleForm.paid_amount,
  });

  const handleStudentSelect = (studentId: string) => {
    const s = students.find((item) => item.id === studentId);
    if (s) {
      const baseFee = Number(s.monthly_fee) || 700;
      const discount = s.discount_percent ? (baseFee * Number(s.discount_percent)) / 100 : 0;
      setSingleForm((prev: any) => ({
        ...prev,
        student_id: studentId,
        amount: baseFee,
        discount,
        paid_amount: baseFee - discount,
      }));
    }
  };

  const handleSaveSingleFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFee ? `/api/v1/fees/${editingFee.id}` : "/api/v1/fees";
      const method = editingFee ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(singleForm),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Fee Recorded",
          text: `Receipt ${json.data.receipt_no} generated successfully!`,
          timer: 2000,
          showConfirmButton: false,
        });
        setShowSingleModal(false);
        fetchFees();
      } else {
        Swal.fire("Error", json.error?.message || "Failed to record fee", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Open Family Modal and initialize
  const handleOpenFamilyModal = () => {
    const keys = Object.keys(familyGroups);
    const multiChildKey = keys.find((k) => familyGroups[k].length > 1) || keys[0] || "";
    setSelectedFamilyKey(multiChildKey);
    initFamilyChildren(multiChildKey);
    setShowFamilyModal(true);
  };

  const initFamilyChildren = (key: string) => {
    const children = familyGroups[key] || [];
    const state: Record<string, any> = {};
    for (const c of children) {
      const base = Number(c.monthly_fee) || 700;
      const disc = c.discount_percent ? (base * Number(c.discount_percent)) / 100 : 0;
      state[c.id] = {
        selected: true,
        amount: base,
        discount: disc,
        paid_amount: base - disc,
        late_fee: 0,
      };
    }
    setFamilyChildrenState(state);
  };

  const handleFamilyKeyChange = (key: string) => {
    setSelectedFamilyKey(key);
    initFamilyChildren(key);
  };

  const handleChildStateChange = (id: string, field: string, val: any) => {
    setFamilyChildrenState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val,
      },
    }));
  };

  const handleSaveFamilyBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedKids = Object.keys(familyChildrenState)
        .filter((id) => familyChildrenState[id].selected)
        .map((id) => ({
          student_id: id,
          amount: Number(familyChildrenState[id].amount),
          discount: Number(familyChildrenState[id].discount),
          late_fee: Number(familyChildrenState[id].late_fee),
          paid_amount: Number(familyChildrenState[id].paid_amount),
        }));

      if (selectedKids.length === 0) {
        Swal.fire("Attention", "Please select at least one child to bill", "warning");
        return;
      }

      const res = await fetch("/api/v1/fees/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fee_month: familyMonth,
          payment_date: familyPaymentDate,
          payment_mode: familyPaymentMode,
          children: selectedKids,
        }),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Family Fees Processed",
          text: json.message || "All eligible siblings billed atomically!",
        });
        setShowFamilyModal(false);
        fetchFees();
      } else {
        Swal.fire("Error", json.error?.message || "Failed to process family billing", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Open Receipt Modal
  const handlePrintReceipt = (fee: any) => {
    setPrintReceiptData(fee);
  };

  // Open Challan Modal
  const handlePrintChallan = async (fee: any) => {
    try {
      const res = await fetch(`/api/v1/fees/${fee.id}`);
      const json = await res.json();
      if (json.success) {
        setPrintChallanData(json.data);
      }
    } catch (err) {
      console.error("Failed to load challan data", err);
    }
  };

  const handleDelete = async (fee: any) => {
    const res = await Swal.fire({
      title: "Soft Delete Fee",
      text: `Are you sure you want to void receipt ${fee.receipt_no}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ea4335",
      confirmButtonText: "Yes, void receipt",
    });

    if (res.isConfirmed) {
      try {
        const delRes = await fetch(`/api/v1/fees/${fee.id}`, { method: "DELETE" });
        const json = await delRes.json();
        if (json.success) {
          Swal.fire("Voided", "Fee payment record soft-deleted.", "success");
          fetchFees();
        } else {
          Swal.fire("Error", json.error?.message || "Failed to delete fee", "error");
        }
      } catch (err: any) {
        Swal.fire("Error", err.message, "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, receipt no, admission no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Due">Due</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenFamilyModal}
            className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Family Billing</span>
          </button>
          <button
            onClick={() => {
              setEditingFee(null);
              setSingleForm({
                student_id: students[0]?.id || "",
                fee_month: selectedMonth || "2026-10",
                amount: 700,
                paid_amount: 700,
                discount: 0,
                late_fee: 0,
                payment_date: new Date().toISOString().slice(0, 10),
                payment_mode: "Cash",
                remarks: "",
              });
              setShowSingleModal(true);
            }}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>
        </div>
      </div>

      {/* Fees Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4 text-right">Fee Net</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Mode / Date</th>
                <th className="py-3 px-4 text-right">Print & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    Loading fee payments...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    No fee records found for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                fees.map((f) => {
                  const net = Number(f.amount || 0) - Number(f.discount || 0) + Number(f.late_fee || 0);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {f.receipt_no}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white block">{f.student_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{f.admission_no || "ADM-N/A"}</span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {f.class} {f.section ? `(${f.section})` : ""}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {f.fee_month}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ₹{net.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(f.paid_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        ₹{Number(f.due_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            f.status === "Paid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : f.status === "Partial"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <span className="font-medium text-slate-700 dark:text-slate-300 block">{f.payment_mode}</span>
                        <span className="text-slate-400">{f.payment_date?.slice(0, 10)}</span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handlePrintReceipt(f)}
                          className="px-2 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded text-[10px] font-bold inline-flex items-center space-x-1 transition-colors"
                          title="Print Official Fee Receipt"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                        <button
                          onClick={() => handlePrintChallan(f)}
                          className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded text-[10px] font-bold inline-flex items-center space-x-1 transition-colors"
                          title="Print 3-Copy Bank Challan"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Challan</span>
                        </button>
                        <button
                          onClick={() => handleDelete(f)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors inline-block"
                          title="Void Fee Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Collect Fee Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-sky-400" />
                <span>Collect Student Fee</span>
              </h3>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleFee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Select Student *
                </label>
                <select
                  required
                  value={singleForm.student_id}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admission_no} - {s.class})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Fee Month (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={singleForm.fee_month}
                    onChange={(e) => setSingleForm({ ...singleForm, fee_month: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={singleForm.payment_date}
                    onChange={(e) => setSingleForm({ ...singleForm, payment_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tuition Amount
                  </label>
                  <input
                    type="number"
                    value={singleForm.amount}
                    onChange={(e) => setSingleForm({ ...singleForm, amount: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={singleForm.discount}
                    onChange={(e) => setSingleForm({ ...singleForm, discount: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Late Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={singleForm.late_fee}
                    onChange={(e) => setSingleForm({ ...singleForm, late_fee: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={singleForm.paid_amount}
                    onChange={(e) => setSingleForm({ ...singleForm, paid_amount: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={singleForm.payment_mode}
                    onChange={(e) => setSingleForm({ ...singleForm, payment_mode: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Calculated Net Payable:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₹{singleCalc.netPayable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Balance Pending:</span>
                  <span className="font-mono font-bold text-red-600">₹{singleCalc.dueAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Generated Status:</span>
                  <span className="font-bold text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    {singleCalc.status}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Family / Sibling Billing Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Family & Sibling Consolidated Billing</span>
              </h3>
              <button onClick={() => setShowFamilyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFamilyBatch} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Select Family / Sibling Group *
                  </label>
                  <select
                    value={selectedFamilyKey}
                    onChange={(e) => handleFamilyKeyChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  >
                    {Object.keys(familyGroups).map((k) => (
                      <option key={k} value={k}>
                        {k} ({familyGroups[k].length} siblings)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Billing Month *
                  </label>
                  <input
                    type="month"
                    required
                    value={familyMonth}
                    onChange={(e) => setFamilyMonth(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={familyPaymentMode}
                    onChange={(e) => setFamilyPaymentMode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Sibling List Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">Include</th>
                      <th className="py-2.5 px-3">Child Name</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3 w-28">Amount (₹)</th>
                      <th className="py-2.5 px-3 w-24">Disc (₹)</th>
                      <th className="py-2.5 px-3 w-28">Paid (₹)</th>
                      <th className="py-2.5 px-3 text-right">Net Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(familyGroups[selectedFamilyKey] || []).map((child) => {
                      const cState = familyChildrenState[child.id] || {
                        selected: true,
                        amount: child.monthly_fee || 700,
                        discount: 0,
                        paid_amount: child.monthly_fee || 700,
                        late_fee: 0,
                      };
                      const net = Number(cState.amount) - Number(cState.discount) + Number(cState.late_fee || 0);
                      const due = Math.max(0, net - Number(cState.paid_amount));

                      return (
                        <tr key={child.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={cState.selected}
                              onChange={(e) => handleChildStateChange(child.id, "selected", e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {child.name}
                            <span className="block text-[10px] text-slate-400 font-mono">{child.admission_no}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300">
                            {child.class}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              value={cState.amount}
                              onChange={(e) => handleChildStateChange(child.id, "amount", e.target.value)}
                              className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-800 border rounded font-mono"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              value={cState.discount}
                              onChange={(e) => handleChildStateChange(child.id, "discount", e.target.value)}
                              className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-800 border rounded font-mono text-emerald-600"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              value={cState.paid_amount}
                              onChange={(e) => handleChildStateChange(child.id, "paid_amount", e.target.value)}
                              className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-800 border rounded font-mono font-bold text-emerald-600"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ₹{due.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFamilyModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Atomic Bill All Siblings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Modals */}
      {printReceiptData && (
        <FeeReceiptModal fee={printReceiptData} onClose={() => setPrintReceiptData(null)} />
      )}

      {printChallanData && (
        <FeeChallanModal feeData={printChallanData} onClose={() => setPrintChallanData(null)} />
      )}
    </div>
  );
}
