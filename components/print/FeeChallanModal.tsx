"use client";

import React, { useEffect } from "react";
import { Printer, X } from "lucide-react";
import { numToWords } from "@/lib/financial-formulas";

interface FeeChallanModalProps {
  feeData: any; // Contains fee, previousArrears, totalPayableWithArrears, schoolInfo
  onClose: () => void;
}

export default function FeeChallanModal({ feeData, onClose }: FeeChallanModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!feeData || !feeData.fee) return null;

  const { fee, previousArrears = 0, totalPayableWithArrears = 0, schoolInfo } = feeData;
  const school = schoolInfo || {
    name: "St. Xavier Academy of Excellence",
    address: "42 Knowledge Boulevard, Institutional Area, New Delhi - 110025",
    phone: "+91 11 2654 8899",
  };

  const challanNo = `CHL-${fee.receipt_no ? fee.receipt_no.replace("RCPT-", "") : fee.id.slice(0, 6)}`;
  const netThisMonth = Number(fee.amount || 0) - Number(fee.discount || 0) + Number(fee.late_fee || 0);
  const balanceThisMonth = Math.max(0, netThisMonth - Number(fee.paid_amount || 0));
  const grandTotalPayable = totalPayableWithArrears || (balanceThisMonth + previousArrears);

  const copies = [
    { title: "BANK COPY", note: "For Bank Records" },
    { title: "SCHOOL COPY", note: "To be submitted to Accounts Desk" },
    { title: "STUDENT COPY", note: "To be retained by Parent/Student" },
  ];

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
          className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-6xl w-full border border-slate-200 overflow-hidden relative my-2 sm:my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Controls (Hidden in print) */}
          <div className="no-print sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shadow-md">
            <div>
              <span className="font-semibold text-base sm:text-lg flex items-center space-x-2">
                <Printer className="w-5 h-5 text-sky-400" />
                <span>Three-Copy Bank Challan (A4 Landscape)</span>
              </span>
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                Side-by-side Bank, School, and Student copies with previous arrears calculation
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1.5 sm:space-x-2 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Challan</span>
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

        {/* Printable Surface (Landscape 3 copies) */}
        <div id="print-surface" className="p-6 print-page bg-white">
          <div className="grid grid-cols-3 divide-x-2 divide-dashed divide-slate-400 -mx-3">
            {copies.map((copy, idx) => (
              <div key={idx} className="px-4 text-[10px] leading-tight">
                {/* Header */}
                <div className="text-center pb-2 border-b border-slate-300">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{school.name}</h2>
                  <p className="text-[9px] text-slate-600 truncate">{school.address}</p>
                  <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-1">
                    <span className="px-1.5 py-0.5 bg-slate-900 text-white font-bold rounded text-[9px] uppercase print-navy-band">
                      {copy.title}
                    </span>
                    <span className="font-mono font-bold text-slate-800">{challanNo}</span>
                  </div>
                  <p className="text-[8px] text-slate-500 italic mt-0.5">{copy.note}</p>
                </div>

                {/* Bank Account Info */}
                <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px]">
                  <p><span className="font-semibold">Bank:</span> State Bank of India | <span className="font-semibold">A/C:</span> 39482019482</p>
                  <p><span className="font-semibold">IFSC:</span> SBIN0001234 | <span className="font-semibold">Branch:</span> Institutional Area</p>
                </div>

                {/* Student Details */}
                <div className="mt-2 space-y-1 text-[9px] border-b border-slate-200 pb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student:</span>
                    <span className="font-bold text-slate-900">{fee.student_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Admission No:</span>
                    <span className="font-mono font-semibold">{fee.admission_no || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Class & Section:</span>
                    <span className="font-medium">{fee.class} - {fee.section || "A"} (Roll: {fee.roll_no || "N/A"})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Father&apos;s Name:</span>
                    <span className="font-medium">{fee.father_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fee Month:</span>
                    <span className="font-bold text-sky-900">{fee.fee_month}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Due Date:</span>
                    <span className="font-semibold text-red-600">{fee.due_date || "15th of month"}</span>
                  </div>
                </div>

                {/* Particulars Table */}
                <table className="w-full text-[9px] mt-2 border border-slate-300 print-table">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="py-1 px-1.5 text-left border-b border-r border-slate-300">Particulars</th>
                      <th className="py-1 px-1.5 text-right border-b border-slate-300 w-16">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-1 px-1.5 border-r border-slate-300">Monthly Tuition Fee</td>
                      <td className="py-1 px-1.5 text-right font-mono">{Number(fee.amount).toFixed(2)}</td>
                    </tr>
                    {Number(fee.discount) > 0 && (
                      <tr className="text-emerald-700">
                        <td className="py-0.5 px-1.5 border-r border-slate-300">Less Discount</td>
                        <td className="py-0.5 px-1.5 text-right font-mono">-{Number(fee.discount).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(fee.late_fee) > 0 && (
                      <tr className="text-amber-800">
                        <td className="py-0.5 px-1.5 border-r border-slate-300">Add Late Surcharge</td>
                        <td className="py-0.5 px-1.5 text-right font-mono">+{Number(fee.late_fee).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="py-1 px-1.5 border-r border-slate-300">Net Payable this Month</td>
                      <td className="py-1 px-1.5 text-right font-mono">₹{netThisMonth.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 border-r border-slate-300 text-slate-500">Amount Received</td>
                      <td className="py-0.5 px-1.5 text-right font-mono text-emerald-700">{Number(fee.paid_amount || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-1.5 border-r border-slate-300 text-slate-500">Balance this Month</td>
                      <td className="py-0.5 px-1.5 text-right font-mono">{balanceThisMonth.toFixed(2)}</td>
                    </tr>
                    <tr className="text-red-700 font-semibold">
                      <td className="py-1 px-1.5 border-r border-slate-300">Previous Arrears</td>
                      <td className="py-1 px-1.5 text-right font-mono">₹{previousArrears.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-bold print-navy-band">
                      <td className="py-1.5 px-1.5 border-r border-slate-700 uppercase">Total Payable</td>
                      <td className="py-1.5 px-1.5 text-right font-mono text-xs">₹{grandTotalPayable.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Words */}
                <div className="mt-1.5 p-1 bg-slate-50 border border-slate-200 rounded text-[8px]">
                  <span className="font-semibold text-slate-500">In Words: </span>
                  <span className="font-bold text-slate-800 italic">{numToWords(grandTotalPayable)}</span>
                </div>

                {/* Instructions */}
                <p className="mt-2 text-[8px] text-slate-500 leading-tight">
                  * Pay before due date to avoid late fine. Cheques subject to realization.
                </p>

                {/* Signatures */}
                <div className="mt-6 pt-3 flex justify-between text-[8px] text-slate-600 border-t border-slate-300">
                  <div className="text-center w-20">
                    <div className="border-b border-slate-400 pb-2 mb-0.5"></div>
                    <span>Depositor</span>
                  </div>
                  <div className="text-center w-20">
                    <div className="border-b border-slate-400 pb-2 mb-0.5"></div>
                    <span>Bank Cashier</span>
                  </div>
                  <div className="text-center w-20">
                    <div className="border-b border-slate-400 pb-2 mb-0.5"></div>
                    <span>School Official</span>
                  </div>
                </div>
              </div>
            ))}
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
              <span>Print Challan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
