"use client";

import React, { useEffect } from "react";
import { Printer, X } from "lucide-react";
import { numToWords } from "@/lib/financial-formulas";

interface SalarySlipModalProps {
  salaryData: any; // Contains salary, netPayInWords, schoolInfo
  onClose: () => void;
}

export default function SalarySlipModal({ salaryData, onClose }: SalarySlipModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!salaryData || !salaryData.salary) return null;

  const { salary, schoolInfo } = salaryData;
  const school = schoolInfo || {
    name: "St. Xavier Academy of Excellence",
    address: "42 Knowledge Boulevard, Institutional Area, New Delhi - 110025",
    phone: "+91 11 2654 8899",
    email: "info@stxavieracademy.edu.in",
  };

  const basic = Number(salary.basic || 0);
  const allowances = Number(salary.allowances || 0);
  const bonus = Number(salary.bonus || 0);
  const grossEarnings = (basic > 0 || allowances > 0 || bonus > 0) ? (basic + allowances + bonus) : Number(salary.amount || 0);
  const deductions = Number(salary.deductions || 0);
  const netPay = Number(salary.net_pay || (grossEarnings - deductions));
  const words = numToWords(netPay);

  const earningsList = [
    { label: "Basic Pay", amount: basic || grossEarnings },
    { label: "Dearness & House Rent Allowance", amount: allowances },
    { label: "Performance Incentive / Bonus", amount: bonus },
  ].filter((item) => item.amount > 0 || item.label === "Basic Pay");

  const deductionsList = [
    { label: "Provident Fund (PF) Contribution", amount: deductions > 0 ? Math.round(deductions * 0.6 * 100) / 100 : 0 },
    { label: "Professional Tax & TDS", amount: deductions > 0 ? Math.round(deductions * 0.4 * 100) / 100 : 0 },
  ].filter((item) => item.amount > 0);

  // Equalize rows for the 4-column aligned layout
  const maxRows = Math.max(earningsList.length, deductionsList.length, 3);
  const rows = [];
  for (let i = 0; i < maxRows; i++) {
    rows.push({
      earning: earningsList[i] || null,
      deduction: deductionsList[i] || null,
    });
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center py-4">
        <div
          className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden relative my-2 sm:my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Controls (Hidden in print) */}
          <div className="no-print sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shadow-md">
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-sky-400" />
              <span className="font-semibold text-base sm:text-lg">Employee Salary Slip</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1.5 sm:space-x-2 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Salary Slip</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

        {/* Printable Surface */}
        <div id="print-surface" className="p-8 print-page">
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">{school.name}</h1>
            <p className="text-xs text-slate-600 mt-0.5">{school.address}</p>
            <div className="inline-block mt-2 px-3 py-0.5 bg-slate-900 text-white text-xs font-bold tracking-widest uppercase rounded print-navy-band">
              SALARY PAYSLIP — {salary.salary_month}
            </div>
          </div>

          {/* Employee Metadata */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
            <div>
              <p><span className="font-semibold text-slate-600">Employee Name:</span> <span className="font-bold text-slate-900 uppercase">{salary.teacher_name}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Employee ID:</span> <span className="font-mono font-bold text-sky-900">{salary.employee_id}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Designation:</span> <span>{salary.designation || "Faculty Member"}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Department:</span> <span>{salary.department || "Academics"}</span></p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold text-slate-600">Payslip No:</span> <span className="font-mono font-bold">{salary.payslip_no}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Disbursement Date:</span> <span>{salary.payment_date || "2026-10-01"}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Days Present:</span> <span className="font-medium">{salary.days_present || 30} days</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Payment Mode / Ref:</span> <span className="font-mono text-[11px]">{salary.payment_mode} ({salary.bank_reference || "Direct A/C"})</span></p>
            </div>
          </div>

          {/* 4-Column Aligned Earnings & Deductions Table */}
          <table className="w-full text-xs mt-4 border border-slate-300 print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="py-2 px-3 text-left border-r border-slate-300 w-1/3">EARNINGS</th>
                <th className="py-2 px-3 text-right border-r border-slate-300 w-1/6">AMOUNT (₹)</th>
                <th className="py-2 px-3 text-left border-r border-slate-300 w-1/3">DEDUCTIONS</th>
                <th className="py-2 px-3 text-right w-1/6">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="py-2 px-3 border-r border-slate-300 text-slate-800">
                    {row.earning?.label || ""}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-300 font-mono">
                    {row.earning ? `₹${Number(row.earning.amount).toFixed(2)}` : ""}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-300 text-slate-800">
                    {row.deduction?.label || ""}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-red-600">
                    {row.deduction ? `₹${Number(row.deduction.amount).toFixed(2)}` : ""}
                  </td>
                </tr>
              ))}

              {/* Tinted Gross Earnings & Total Deductions subtotal row */}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-2 px-3 border-r border-slate-300 uppercase">Gross Earnings</td>
                <td className="py-2 px-3 text-right border-r border-slate-300 font-mono">
                  ₹{grossEarnings.toFixed(2)}
                </td>
                <td className="py-2 px-3 border-r border-slate-300 uppercase">Total Deductions</td>
                <td className="py-2 px-3 text-right font-mono text-red-600">
                  ₹{deductions.toFixed(2)}
                </td>
              </tr>

              {/* Navy band labelled NET PAY (Gross - Deductions) */}
              <tr className="bg-slate-900 text-white font-bold text-sm print-navy-band">
                <td colSpan={2} className="py-2.5 px-3 border-r border-slate-700 uppercase tracking-wide">
                  NET PAYABLE (Gross - Deductions)
                </td>
                <td colSpan={2} className="py-2.5 px-3 text-right font-mono text-base text-emerald-400">
                  ₹{netPay.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
            <span className="font-semibold text-slate-600">Net Pay in Words: </span>
            <span className="font-bold text-slate-900 italic">{words}</span>
          </div>

          {/* 3 Signatures */}
          <div className="mt-12 pt-6 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-slate-800 pb-2 mb-1">
                <span className="text-[11px] font-mono text-slate-700">Accounts Officer</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-600">Prepared By</span>
            </div>
            <div>
              <div className="border-b border-slate-800 pb-2 mb-1">
                <span className="text-[11px] font-mono text-slate-700">Principal / Bursar</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-600">Authorized Signatory</span>
            </div>
            <div>
              <div className="border-b border-slate-800 pb-2 mb-1 font-signature text-slate-300">
                &nbsp;
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-600">Employee Signature</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-3 bg-slate-100 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Esc</kbd> or click outside to dismiss
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-300 bg-white rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Salary Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
