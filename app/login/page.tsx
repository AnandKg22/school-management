"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { School, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: "Super Admin", user: "superadmin", pass: "admin123", role: "Full Platform Control" },
    { label: "School Admin", user: "school_admin", pass: "admin123", role: "Academic & Fee Operations" },
    { label: "Accountant", user: "accountant", pass: "admin123", role: "Fees, Salaries & Cashflow" },
    { label: "Faculty", user: "teacher", pass: "admin123", role: "Academics & Classroom" },
    { label: "Storekeeper", user: "storekeeper", pass: "admin123", role: "Inventory & POS Desk" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      Swal.fire("Required", "Please provide both username and password", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Welcome Back",
          text: `Logged in as @${json.data.user.username} (${json.data.user.roleLabel})`,
          timer: 1500,
          showConfirmButton: false,
        });
        router.push("/");
      } else {
        Swal.fire({
          icon: "error",
          title: "Authentication Failed",
          text: json.error?.message || "Invalid username or password",
        });
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Failed to authenticate", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
      {/* Left Brand Panel (Navy Identity) */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#001f3f] via-[#002852] to-[#001730] p-8 md:p-12 flex flex-col justify-between text-white border-r border-slate-800">
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-sky-600 rounded-xl shadow-lg">
              <School className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                St. Xavier Academy
              </h1>
              <p className="text-xs text-sky-300 font-semibold uppercase tracking-widest">
                School Management System
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-4 max-w-md">
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Enterprise Institutional Administration & Finance Engine
            </h2>
            <p className="text-sm text-sky-200/80 leading-relaxed">
              Unified platform featuring 31-point student lifecycle records, 3-copy printable bank challans, official fee receipts, family sibling billing, teacher payroll, and live inventory control.
            </p>
          </div>
        </div>

        {/* Quick Demo Persona Switcher */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <p className="text-xs uppercase font-bold text-sky-400 tracking-wider mb-3">
            Instant Demo Account Switcher
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {demoAccounts.map((acc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUsername(acc.user);
                  setPassword(acc.pass);
                }}
                className={`p-2.5 rounded-lg text-left transition-all text-xs border ${
                  username === acc.user
                    ? "bg-sky-600 border-sky-400 text-white font-bold"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                }`}
              >
                <span className="block font-semibold">{acc.label}</span>
                <span className="block text-[10px] text-sky-200/70 truncate">{acc.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="md:w-1/2 bg-slate-950 p-8 md:p-16 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Staff Sign In</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your institutional credentials or click a pre-seeded demo role to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Institutional Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="superadmin or email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-sky-600/30"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              Protected by encrypted sessions, partial unique constraints, and PostgreSQL Row-Level Security.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
