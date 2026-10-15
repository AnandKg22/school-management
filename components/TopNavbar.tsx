"use client";

import React, { useState } from "react";
import {
  Menu,
  Bell,
  Sun,
  Moon,
  School,
  CheckCircle,
} from "lucide-react";
import { PAGE_META } from "@/lib/registry";

interface TopNavbarProps {
  activePage: string;
  onToggleSidebar: () => void;
  user: any;
  darkMode: boolean;
  onToggleTheme: () => void;
  recentLogs?: any[];
  onNavigate?: (page: string) => void;
}

export default function TopNavbar({
  activePage,
  onToggleSidebar,
  user,
  darkMode,
  onToggleTheme,
  recentLogs = [],
  onNavigate,
}: TopNavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const pageMeta = PAGE_META[activePage] || {
    label: "Dashboard",
    group: "General",
  };

  const notificationCount = Math.min(recentLogs.length, 5);

  return (
    <header className="no-print sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between shadow-sm transition-colors">
      {/* Left: Hamburger & Unified Breadcrumb Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
            <span>Home</span>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-400">{pageMeta.group}</span>
            <span>/</span>
            <span className="text-sky-600 dark:text-sky-400 font-semibold">{pageMeta.label}</span>
          </div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>{pageMeta.label}</span>
          </h1>
        </div>
      </div>

      {/* Right: Actions, Theme Toggle, Notification Bell, User Welcome */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={darkMode ? "Switch to Light Mode" : "Switch to Navy Dark Mode"}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-sky-700" />}
        </button>

        {/* Real Notification Bell with Audit Log count */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
            title="System Notifications & Activity"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-sky-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Recent Activity Logs
                </span>
                <span className="text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">
                  Live Audit
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {recentLogs.length > 0 ? (
                  recentLogs.slice(0, 5).map((log: any, idx: number) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                        <span>{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px] line-clamp-2">
                        {log.details}
                      </p>
                      <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium mt-1">
                        By @{log.user_name}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>No unread notifications</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <button
          onClick={() => onNavigate && onNavigate("account")}
          className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity text-left"
          title="View My Account"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs uppercase shadow-sm">
            {user?.username?.[0] || "A"}
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold block text-slate-900 dark:text-white">
              {user?.username || "Admin"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium capitalize">
              {user?.roleLabel || "Super Admin"}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
