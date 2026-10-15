"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  X,
  CreditCard,
  Building,
} from "lucide-react";
import Swal from "sweetalert2";
import { calculateSalary } from "@/lib/financial-formulas";
import SalarySlipModal from "../print/SalarySlipModal";

interface SalariesViewProps {
  user: any;
}

export default function SalariesView({ user }: SalariesViewProps) {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("2026-09");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [printSalaryData, setPrintSalaryData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSal, setEditingSal] = useState<any>(null);

  const [formData, setFormData] = useState<any>({
    teacher_id: "",
    salary_month: "2026-09",
    amount: 25000,
    basic: 20000,
    allowances: 5000,
    deductions: 1000,
    bonus: 0,
    paid_amount: 24000,
    days_present: 30,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: "Bank Transfer",
    bank_reference: "NEFT-SBI-49182",
    remarks: "",
  });

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/v1/salaries?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSalaries(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch salaries", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/v1/teachers?limit=100");
      const json = await res.json();
      if (json.success) {
        setTeachers(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch teachers for payroll", err);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [search, selectedMonth, selectedStatus]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleTeacherSelect = (teacherId: string) => {
    const t = teachers.find((item) => item.id === teacherId);
    if (t) {
      const baseSalary = Number(t.monthly_salary) || 25000;
      const basic = Math.round(baseSalary * 0.7 * 100) / 100;
      const allowances = Math.round(baseSalary * 0.3 * 100) / 100;
      const deductions = Math.round(baseSalary * 0.05 * 100) / 100;
      const net = basic + allowances - deductions;

      setFormData((prev: any) => ({
        ...prev,
        teacher_id: teacherId,
        amount: baseSalary,
        basic,
        allowances,
        deductions,
        paid_amount: net,
      }));
    }
  };

  const calc = calculateSalary({
    amount: formData.amount,
    basic: formData.basic,
    allowances: formData.allowances,
    deductions: formData.deductions,
    bonus: formData.bonus,
    paidAmount: formData.paid_amount,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSal ? `/api/v1/salaries/${editingSal.id}` : "/api/v1/salaries";
      const method = editingSal ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Payroll Disbursed",
          text: `Payslip ${json.data.payslip_no} recorded successfully!`,
          timer: 2000,
          showConfirmButton: false,
        });
        setShowModal(false);
        fetchSalaries();
      } else {
        Swal.fire("Error", json.error?.message || "Failed to disburse salary", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handlePrintSlip = async (sal: any) => {
    try {
      const res = await fetch(`/api/v1/salaries/${sal.id}`);
      const json = await res.json();
      if (json.success) {
        setPrintSalaryData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch payslip data", err);
    }
  };

  const handleDelete = async (sal: any) => {
    const res = await Swal.fire({
      title: "Void Payslip",
      text: `Are you sure you want to soft-delete payslip ${sal.payslip_no}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ea4335",
      confirmButtonText: "Yes, void payslip",
    });

    if (res.isConfirmed) {
      try {
        const delRes = await fetch(`/api/v1/salaries/${sal.id}`, { method: "DELETE" });
        const json = await delRes.json();
        if (json.success) {
          Swal.fire("Voided", "Salary payment record soft-deleted.", "success");
          fetchSalaries();
        } else {
          Swal.fire("Error", json.error?.message || "Failed to delete salary", "error");
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
              placeholder="Search faculty name, payslip no, employee ID..."
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
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>

        <button
          onClick={() => {
            setEditingSal(null);
            setFormData({
              teacher_id: teachers[0]?.id || "",
              salary_month: selectedMonth || "2026-09",
              amount: 25000,
              basic: 20000,
              allowances: 5000,
              deductions: 1000,
              bonus: 0,
              paid_amount: 24000,
              days_present: 30,
              payment_date: new Date().toISOString().slice(0, 10),
              payment_mode: "Bank Transfer",
              bank_reference: "NEFT-SBI-49182",
              remarks: "",
            });
            setShowModal(true);
          }}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Disburse Salary</span>
        </button>
      </div>

      {/* Salary Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Payslip No</th>
                <th className="py-3 px-4">Teacher Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4 text-right">Gross (₹)</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    Loading salary payroll...
                  </td>
                </tr>
              ) : salaries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    No salary disbursements recorded for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                salaries.map((sal) => (
                  <tr key={sal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {sal.payslip_no}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {sal.teacher_name}
                      <span className="block text-[10px] text-slate-400 font-mono">{sal.employee_id}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {sal.designation || "Faculty"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {sal.salary_month}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ₹{Number(sal.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-600">
                      -₹{Number(sal.deductions).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{Number(sal.net_pay).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{Number(sal.paid_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sal.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {sal.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handlePrintSlip(sal)}
                        className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded text-[10px] font-bold inline-flex items-center space-x-1 transition-colors"
                        title="Print Formal Salary Slip"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Payslip</span>
                      </button>
                      <button
                        onClick={() => handleDelete(sal)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors inline-block"
                        title="Void Salary Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Salary Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Banknote className="w-5 h-5 text-sky-400" />
                <span>Disburse Faculty Salary</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Select Faculty Member *
                </label>
                <select
                  required
                  value={formData.teacher_id}
                  onChange={(e) => handleTeacherSelect(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Faculty --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.employee_id} - {t.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Salary Month (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.salary_month}
                    onChange={(e) => setFormData({ ...formData, salary_month: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Days Present
                  </label>
                  <input
                    type="number"
                    value={formData.days_present}
                    onChange={(e) => setFormData({ ...formData, days_present: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Earnings & Deductions</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Basic Salary (₹)</label>
                    <input
                      type="number"
                      value={formData.basic}
                      onChange={(e) => setFormData({ ...formData, basic: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Allowances / HRA (₹)</label>
                    <input
                      type="number"
                      value={formData.allowances}
                      onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Bonus / Incentive (₹)</label>
                    <input
                      type="number"
                      value={formData.bonus}
                      onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-red-500 mb-0.5">Deductions / PF (₹)</label>
                    <input
                      type="number"
                      value={formData.deductions}
                      onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded font-mono text-red-600"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Net Calculated Pay:</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400">₹{calc.netPay.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Bank Reference
                  </label>
                  <input
                    type="text"
                    value={formData.bank_reference}
                    onChange={(e) => setFormData({ ...formData, bank_reference: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    placeholder="e.g. UTR / NEFT Number"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Slip Print Modal */}
      {printSalaryData && (
        <SalarySlipModal salaryData={printSalaryData} onClose={() => setPrintSalaryData(null)} />
      )}
    </div>
  );
}
