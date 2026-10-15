"use client";

import React from "react";
import { Printer, X, CheckCircle, Clock } from "lucide-react";
import { numToWords } from "@/lib/financial-formulas";

interface FeeReceiptModalProps {
  fee: any;
  schoolInfo?: any;
  onClose: () => void;
}

export default function FeeReceiptModal({ fee, schoolInfo, onClose }: FeeReceiptModalProps) {
  if (!fee) return null;

  const school = schoolInfo || {
    name: "St. Xavier Academy of Excellence",
    address: "42 Knowledge Boulevard, Institutional Area, New Delhi - 110025",
    phone: "+91 11 2654 8899",
    email: "info@stxavieracademy.edu.in",
    affiliation_no: "CBSE/AFF/2026/88392",
  };

  const amountPaid = Number(fee.paid_amount) || 0;
  const netPayable = Number(fee.amount || 0) - Number(fee.discount || 0) + Number(fee.late_fee || 0);
  const words = numToWords(amountPaid || netPayable);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-sky-400" />
            <span className="font-semibold text-lg">Official Fee Receipt</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Surface */}
        <div id="print-surface" className="p-8 print-page">
          {/* Header Band */}
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {school.name}
            </h1>
            <p className="text-xs text-slate-600 mt-1">{school.address}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Affiliation No: {school.affiliation_no} | Phone: {school.phone} | Email: {school.email}
            </p>
            <div className="inline-block mt-3 px-4 py-1 bg-slate-900 text-white text-xs font-bold tracking-widest uppercase rounded print-navy-band">
              FEE PAYMENT RECEIPT
            </div>
          </div>

          {/* Receipt Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
            <div>
              <p><span className="font-semibold text-slate-600">Receipt No:</span> <span className="font-mono font-bold text-slate-900">{fee.receipt_no}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Fee Month:</span> <span className="font-bold">{fee.fee_month}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Student Name:</span> <span className="font-bold text-slate-900 uppercase">{fee.student_name}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Admission No:</span> <span className="font-mono">{fee.admission_no || "N/A"}</span></p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold text-slate-600">Date:</span> <span className="font-medium">{fee.payment_date || new Date().toISOString().slice(0, 10)}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Payment Mode:</span> <span className="font-medium">{fee.payment_mode || "Cash"}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Class & Section:</span> <span className="font-bold">{fee.class} {fee.section ? `- ${fee.section}` : ""}</span></p>
              <p className="mt-1"><span className="font-semibold text-slate-600">Roll No:</span> <span className="font-medium">{fee.roll_no || "N/A"}</span></p>
            </div>
          </div>

          {/* Fee Breakdown Table */}
          <table className="w-full text-xs mt-4 border border-slate-300 print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="py-2.5 px-3 text-left border-b border-r border-slate-300 font-semibold">Description</th>
                <th className="py-2.5 px-3 text-right border-b border-slate-300 font-semibold w-32">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2.5 px-3 border-r border-slate-300">
                  <span className="font-medium">Tuition & Academic Term Fee ({fee.fee_month})</span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-medium border-slate-300">
                  ₹{Number(fee.amount).toFixed(2)}
                </td>
              </tr>
              {Number(fee.discount) > 0 && (
                <tr className="text-emerald-700">
                  <td className="py-2 px-3 border-r border-slate-300">Less Sibling / Merit Concession</td>
                  <td className="py-2 px-3 text-right font-mono">- ₹{Number(fee.discount).toFixed(2)}</td>
                </tr>
              )}
              {Number(fee.late_fee) > 0 && (
                <tr className="text-amber-800">
                  <td className="py-2 px-3 border-r border-slate-300">Add Late Payment Surcharge</td>
                  <td className="py-2 px-3 text-right font-mono">+ ₹{Number(fee.late_fee).toFixed(2)}</td>
                </tr>
              )}
              <tr className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-300">
                <td className="py-2.5 px-3 border-r border-slate-300">Net Payable for Month</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{netPayable.toFixed(2)}</td>
              </tr>
              <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                <td className="py-2.5 px-3 border-r border-slate-300">Amount Received</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700 text-sm">₹{amountPaid.toFixed(2)}</td>
              </tr>
              <tr className="bg-slate-50 font-medium text-slate-800">
                <td className="py-2 px-3 border-r border-slate-300">Remaining Balance Due</td>
                <td className="py-2 px-3 text-right font-mono text-red-600">
                  ₹{Number(fee.due_amount).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
            <span className="font-semibold text-slate-600">Amount in Words: </span>
            <span className="font-bold text-slate-900 italic">{words}</span>
          </div>

          {/* Status Badge & Signatures */}
          <div className="mt-8 pt-6 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-xs uppercase tracking-wider">
                {fee.status === "Paid" ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payment Received - Verified</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Partially Paid (Balance Pending)</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 italic mt-2">
                * Computer-generated receipt. Fees once paid are non-refundable.
              </p>
            </div>

            <div className="text-center w-48">
              <div className="border-b border-slate-800 pb-1 mb-1 font-signature text-slate-400">
                <span className="text-[11px] font-mono text-slate-700">{fee.collected_by || "Accounts Desk"}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
