"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Shield,
  Key,
  Palette,
  Clock,
  Mail,
  User,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";

interface AccountViewProps {
  user: any;
}

export default function AccountView({ user }: AccountViewProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Please enter your current and new password.",
        confirmButtonColor: "#0074D9",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Mismatch",
        text: "New password and confirmation do not match.",
        confirmButtonColor: "#0074D9",
      });
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password Too Short",
        text: "New password must be at least 6 characters long.",
        confirmButtonColor: "#0074D9",
      });
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update password");
      }

      Swal.fire({
        icon: "success",
        title: "Password Updated",
        text: "Your security credentials have been updated successfully.",
        confirmButtonColor: "#0074D9",
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "Could not change password",
        confirmButtonColor: "#0074D9",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Header Profile */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center uppercase shadow-md flex-shrink-0">
            {user?.username?.[0] || "U"}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.username || "Authenticated User"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {user?.roleLabel || "Super Admin"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email || "user@akstack.com"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-semibold flex items-center space-x-1 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Session</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role & Permissions Readout */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
            <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Assigned Role & RBAC Capabilities</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Security Level:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {user?.isSuper ? "Super Administrator (Root)" : "Standard Staff Access"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">User Identification:</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                  {user?.id || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session Validity:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">7 Days (HttpOnly Secure)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Module Permissions Matrix
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                {user?.isSuper ? (
                  <span className="px-2.5 py-1 bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 rounded text-xs font-semibold">
                    Global Unrestricted CRUD Capabilities Across All 13 Modules
                  </span>
                ) : (
                  Object.entries(user?.permissions || {}).map(([moduleKey, perms]: [string, any]) => (
                    <div
                      key={moduleKey}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[11px] text-slate-700 dark:text-slate-300 font-medium"
                    >
                      <span className="capitalize font-bold text-sky-600 dark:text-sky-400">{moduleKey}:</span>{" "}
                      <span>{Array.isArray(perms) ? perms.join(", ") : "None"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Change Security Password Form */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
            <Key className="w-5 h-5 text-amber-500" />
            <span>Update Account Password</span>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full mt-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{updating ? "Updating Password..." : "Change Password"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
