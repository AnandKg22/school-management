"use client";

import React from "react";
import {
  Users,
  GraduationCap,
  Receipt,
  Banknote,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Clock,
  Boxes,
  ShoppingCart,
} from "lucide-react";

interface DashboardViewProps {
  data: any;
  loading: boolean;
  onNavigate: (page: string) => void;
}

export default function DashboardView({ data, loading, onNavigate }: DashboardViewProps) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const classDist = data?.classDistribution || [];
  const recentActivity = data?.recentActivity || [];
  const lowStock = data?.lowStockAlerts || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#001f3f] to-[#003366] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Academic & Financial Operations Control
          </h2>
          <p className="text-sky-200 text-xs md:text-sm mt-1 max-w-xl">
            Live campus metrics, audited student fee balances, teacher payroll disbursement, and real-time ledger cashflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate("fees")}
            className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Receipt className="w-4 h-4" />
            <span>Collect Fees</span>
          </button>
          <button
            onClick={() => onNavigate("pos")}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-white/20"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>POS Desk</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fee Collected */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fee Collected</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              ₹{Number(overview.totalFeeCollected || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Realized Campus Revenue</span>
            </div>
          </div>
        </div>

        {/* Pending Fee Dues */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outstanding Dues</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              ₹{Number(overview.totalFeePending || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
              <span>Audited Uncollected Balances</span>
            </div>
          </div>
        </div>

        {/* Salaries Disbursed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Salaries Paid</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-sky-600 rounded-lg">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              ₹{Number(overview.totalSalaryDisbursed || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
              <span>{overview.activeTeachers || 0} Faculty Staff</span>
            </div>
          </div>
        </div>

        {/* Net Operating Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Net Operating Balance</span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-extrabold font-mono ${Number(overview.netOperatingBalance || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              ₹{Number(overview.netOperatingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
              <span>Revenue less Expenditure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Academic Breakdown & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Distribution Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-sky-500" />
                <span>Active Student Enrollment by Class</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Total active learners: {overview.activeStudents || 0}</p>
            </div>
            <button
              onClick={() => onNavigate("students")}
              className="text-xs text-sky-600 hover:text-sky-500 font-semibold"
            >
              View Directory &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            {classDist.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50"
              >
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">{item.class}</span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{item.count}</span>
                  <span className="text-[11px] text-slate-400">students</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (Number(item.count) / Math.max(1, overview.activeStudents)) * 100 * 2.5)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-amber-500" />
              <span>Inventory Reorder Alerts</span>
            </h3>
            <button
              onClick={() => onNavigate("inventory")}
              className="text-xs text-sky-600 hover:text-sky-500 font-semibold"
            >
              Catalog &rarr;
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {lowStock.length > 0 ? (
              lowStock.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{item.sku} ({item.category})</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold rounded text-[11px]">
                      {item.quantity_on_hand} left
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Threshold: {item.reorder_level}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                <Boxes className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <span>All items are above safety reorder levels</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Live Audit Stream */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-sky-500" />
              <span>System Activity & Audit Log Stream</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Immutable audit trail of recent institutional transactions</p>
          </div>
          <button
            onClick={() => onNavigate("logs")}
            className="text-xs text-sky-600 hover:text-sky-500 font-semibold"
          >
            Full Audit Logs &rarr;
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {recentActivity.map((log: any, idx: number) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold rounded text-[10px]">
                  {log.action}
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{log.details}</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-400 flex-shrink-0">
                <span className="font-medium text-sky-600 dark:text-sky-400">@{log.user_name}</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
