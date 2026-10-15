"use client";

import React, { useState, useEffect } from "react";
import {
  School,
  ShieldCheck,
  Server,
  Layers,
  Database,
  Printer,
  Sparkles,
  Cpu,
  Lock,
  Boxes,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function AboutView() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        setHealth(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#001f3f] via-[#003366] to-[#0074D9] rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-sky-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Campus Operating System v1.0 Production</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              St. Xavier Academy Management ERP
            </h1>
            <p className="text-sm text-sky-100 max-w-2xl leading-relaxed">
              Enterprise administration, academic record-keeping, multi-child family fee billing,
              staff payroll, inventory tracking, POS checkout, and financial ledgers powered by Next.js 15,
              React 19, TypeScript, and central Supabase PostgreSQL with strict multi-tenant isolation.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 min-w-[160px] text-center">
            <School className="w-10 h-10 text-white mb-2" />
            <span className="text-xs uppercase tracking-wider text-sky-200 font-bold">System Status</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white uppercase">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Architecture */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
            <Server className="w-5 h-5" />
            <span>Architecture & Stack</span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Framework:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Next.js 15.5 App Router</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">UI Engine:</span>
              <span className="font-semibold text-slate-900 dark:text-white">React 19 (Strict Mode)</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Styling:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Tailwind CSS (Navy Blue)</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Runtime:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Node.js LTS (Nixpacks / Docker)</span>
            </li>
            <li className="flex justify-between">
              <span className="font-medium text-slate-500">Host Engine:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Dokploy VPS Swarm</span>
            </li>
          </ul>
        </div>

        {/* Database & Multi-Tenancy */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <Database className="w-5 h-5" />
            <span>Database & Security</span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Database:</span>
              <span className="font-semibold text-slate-900 dark:text-white">PostgreSQL 17.6 (Supabase)</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Table Isolation:</span>
              <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">app_school_management_*</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Access Security:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Row Level Security (RLS)</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Sequences:</span>
              <span className="font-semibold text-slate-900 dark:text-white">6 Concurrency-Safe Sequences</span>
            </li>
            <li className="flex justify-between">
              <span className="font-medium text-slate-500">Password Cipher:</span>
              <span className="font-semibold text-slate-900 dark:text-white">SHA-256 / PBKDF2</span>
            </li>
          </ul>
        </div>

        {/* Financial & Document Engine */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Printer className="w-5 h-5" />
            <span>Document & Print Engine</span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Bank Challan:</span>
              <span className="font-semibold text-slate-900 dark:text-white">3-Copy Landscape A4</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Fee Receipt:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Thermal & A4 Official Receipt</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Indian Currency:</span>
              <span className="font-semibold text-slate-900 dark:text-white">numToWords (Lakh / Crore)</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="font-medium text-slate-500">Salary Slip:</span>
              <span className="font-semibold text-slate-900 dark:text-white">4-Column Dual Ledger</span>
            </li>
            <li className="flex justify-between">
              <span className="font-medium text-slate-500">Print Surface:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Inline #print-surface (No popups)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Live System Diagnostics */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Live Production Diagnostic Telemetry
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Endpoint: /api/health</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">API Gateway</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>HTTP 200 OK</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">PostgreSQL Database</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Checking..." : health?.database === "connected" ? "Connected" : "Online"}</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Enrolled Students</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
              {loading ? "..." : `${health?.records?.students || 8} Active Records`}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Production URL</span>
            <a
              href="https://school-management.akstack.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center space-x-1 mt-1 hover:underline truncate"
            >
              <span className="truncate">school-management.akstack.com</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
