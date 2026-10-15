"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, School, Palette, Globe, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

interface SettingsViewProps {
  user: any;
}

export default function SettingsView({ user }: SettingsViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>({
    name: "St. Xavier Academy of Excellence",
    address: "42 Knowledge Boulevard, Institutional Area, New Delhi - 110025",
    phone: "+91 11 2654 8899",
    email: "info@stxavieracademy.edu.in",
    affiliation_no: "CBSE/AFF/2026/88392",
    currency_symbol: "₹",
    timezone: "Asia/Kolkata",
  });

  const [themePreset, setThemePreset] = useState("navy");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/settings");
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.school_info) setSchoolInfo(json.data.school_info);
        if (json.data.theme_config?.theme_mode) setThemePreset(json.data.theme_config.theme_mode);
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/v1/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "school_info",
          value: schoolInfo,
        }),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Settings Saved",
          text: "Institution letterhead details updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", json.error?.message || "Failed to save settings", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTheme = async (preset: string) => {
    setThemePreset(preset);
    try {
      await fetch("/api/v1/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "theme_config",
          value: {
            theme_mode: preset,
            primary_color: "#001f3f",
            accent_color: "#0074D9",
          },
        }),
      });
      Swal.fire({
        icon: "success",
        title: "Theme Applied",
        text: `Theme preset '${preset}' saved as application default`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to update theme preset", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* School Information & Letterhead Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 rounded-lg">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Institution Profile & Letterhead</h3>
            <p className="text-xs text-slate-500">Official details printed on Fee Receipts, 3-Copy Challans, and Payslips</p>
          </div>
        </div>

        <form onSubmit={handleSaveSchoolInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Institution Name *
              </label>
              <input
                type="text"
                required
                value={schoolInfo.name}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Campus Address *
              </label>
              <input
                type="text"
                required
                value={schoolInfo.address}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, address: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Affiliation / Registration No
              </label>
              <input
                type="text"
                value={schoolInfo.affiliation_no}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, affiliation_no: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={schoolInfo.phone}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={schoolInfo.email}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={schoolInfo.currency_symbol || "₹"}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, currency_symbol: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Institution Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Theme Presets */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-lg">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Design & Color Presets</h3>
            <p className="text-xs text-slate-500">Global visual palette conforming to the PRD Navy Design System</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "navy", name: "Deep Navy Blue (Default)", primary: "#001f3f", accent: "#0074D9" },
            { id: "midnight", name: "Midnight Charcoal", primary: "#0f172a", accent: "#38bdf8" },
            { id: "emerald", name: "Emerald Academy", primary: "#064e3b", accent: "#10b981" },
          ].map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleSaveTheme(preset.id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                themePreset === preset.id
                  ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.primary }}></div>
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.accent }}></div>
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-white block">{preset.name}</span>
              {themePreset === preset.id && (
                <span className="text-[10px] text-sky-600 font-bold flex items-center space-x-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Active Default</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
