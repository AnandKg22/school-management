"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Plus, Users, Key, Check, X, Lock } from "lucide-react";
import Swal from "sweetalert2";
import { PAGE_META } from "@/lib/registry";

interface UsersViewProps {
  user: any;
}

export default function UsersView({ user }: UsersViewProps) {
  const [activeTab, setActiveTab] = useState<"users" | "rbac">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);

  const [userForm, setUserForm] = useState<any>({
    username: "",
    email: "",
    password: "",
    role_id: "",
    status: "Active",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        fetch("/api/v1/users"),
        fetch("/api/v1/roles"),
      ]);

      const [uJson, rJson] = await Promise.all([uRes.json(), rRes.json()]);

      if (uJson.success) setUsers(uJson.data || []);
      if (rJson.success) {
        setRoles(rJson.data || []);
        if (rJson.data?.length > 0 && !userForm.role_id) {
          setUserForm((prev: any) => ({ ...prev, role_id: rJson.data[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load users & roles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Account Created",
          text: `User @${json.data.username} successfully enrolled`,
          timer: 1500,
          showConfirmButton: false,
        });
        setShowUserModal(false);
        fetchData();
      } else {
        Swal.fire("Error", json.error?.message || "Failed to create user", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleTogglePermission = async (role: any, pageKey: string, action: string) => {
    if (role.is_super) {
      Swal.fire("Protected Role", "Super Admin role has immutable default privileges", "info");
      return;
    }

    const currentPerms = role.permissions || {};
    const pagePerms = currentPerms[pageKey] || [];
    let updatedPagePerms: string[] = [];

    if (pagePerms.includes(action)) {
      updatedPagePerms = pagePerms.filter((a: string) => a !== action);
    } else {
      updatedPagePerms = [...pagePerms, action];
    }

    const updatedPermissions = {
      ...currentPerms,
      [pageKey]: updatedPagePerms,
    };

    try {
      const res = await fetch("/api/v1/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: role.id,
          permissions: updatedPermissions,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setRoles((prev) =>
          prev.map((r) => (r.id === role.id ? { ...r, permissions: updatedPermissions } : r))
        );
      }
    } catch (err) {
      console.error("Failed to toggle permission", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === "users"
              ? "border-sky-600 text-sky-600 dark:text-sky-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>System Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("rbac")}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === "rbac"
              ? "border-sky-600 text-sky-600 dark:text-sky-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Dynamic RBAC Permissions Matrix</span>
        </button>
      </div>

      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active System Operators</h3>
              <p className="text-xs text-slate-500 mt-0.5">Role-scoped personnel with authorized access to Campus OS</p>
            </div>
            <button
              onClick={() => {
                setUserForm({
                  username: "",
                  email: "",
                  password: "",
                  role_id: roles[0]?.id || "",
                  status: "Active",
                });
                setShowUserModal(true);
              }}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create User Account</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      @{u.username}
                      {u.is_super && (
                        <span className="ml-2 px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-bold">
                          Super
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-sky-700 dark:text-sky-300">{u.role_label || "No Role"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "rbac" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Fine-Grained Capability Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive permission toggles saved directly to PostgreSQL. Super Admin maintains master privileges.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">Module / Page</th>
                  {roles.map((role) => (
                    <th key={role.id} className="py-3 px-4 text-center border-r border-slate-200 dark:border-slate-800">
                      <span className="block font-bold" style={{ color: role.color }}>
                        {role.label}
                      </span>
                      <span className="text-[9px] font-mono font-normal text-slate-400">{role.role_key}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.values(PAGE_META).map((page) => (
                  <tr key={page.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                      {page.label}
                      <span className="block text-[10px] text-slate-400 font-normal">{page.group}</span>
                    </td>
                    {roles.map((role) => {
                      const actions = ["view", "add", "edit", "delete"] as const;
                      return (
                        <td key={role.id} className="py-3 px-4 border-r border-slate-200 dark:border-slate-800 text-center">
                          {role.is_super ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
                              <Lock className="w-3 h-3" />
                              <span>Master Access</span>
                            </span>
                          ) : (
                            <div className="flex justify-center space-x-1.5">
                              {actions.map((act) => {
                                const isAllowed = (role.permissions?.[page.key] || []).includes(act);
                                return (
                                  <button
                                    key={act}
                                    onClick={() => handleTogglePermission(role, page.key, act)}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                                      isAllowed
                                        ? "bg-sky-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200"
                                    }`}
                                    title={`Toggle ${act} on ${page.label}`}
                                  >
                                    {act[0]}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Users className="w-5 h-5 text-sky-400" />
                <span>Create User Account</span>
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold"
                  placeholder="e.g. jdoe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  placeholder="e.g. jdoe@school.edu"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Assigned Role *
                </label>
                <select
                  required
                  value={userForm.role_id}
                  onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} ({r.role_key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Enroll User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
