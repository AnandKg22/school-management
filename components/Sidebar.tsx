"use client";

import React from "react";
import {
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  Receipt,
  Banknote,
  ArrowLeftRight,
  Boxes,
  Truck,
  ShoppingCart,
  Building2,
  ShieldAlert,
  Sliders,
  ScrollText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
} from "lucide-react";
import { PAGE_META, PAGE_GROUPS, hasPermission } from "@/lib/registry";

interface SidebarProps {
  activePage: string;
  onSelectPage: (key: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: any;
  onLogout: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5 flex-shrink-0" />,
  GraduationCap: <GraduationCap className="w-5 h-5 flex-shrink-0" />,
  UserCheck: <UserCheck className="w-5 h-5 flex-shrink-0" />,
  Receipt: <Receipt className="w-5 h-5 flex-shrink-0" />,
  Banknote: <Banknote className="w-5 h-5 flex-shrink-0" />,
  ArrowLeftRight: <ArrowLeftRight className="w-5 h-5 flex-shrink-0" />,
  Boxes: <Boxes className="w-5 h-5 flex-shrink-0" />,
  Truck: <Truck className="w-5 h-5 flex-shrink-0" />,
  ShoppingCart: <ShoppingCart className="w-5 h-5 flex-shrink-0" />,
  Building2: <Building2 className="w-5 h-5 flex-shrink-0" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5 flex-shrink-0" />,
  Sliders: <Sliders className="w-5 h-5 flex-shrink-0" />,
  ScrollText: <ScrollText className="w-5 h-5 flex-shrink-0" />,
};

export default function Sidebar({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
}: SidebarProps) {
  // Filter pages that user has permission to view
  const visiblePages = Object.values(PAGE_META).filter((page) =>
    hasPermission(user?.permissions, page.key, "view", user?.isSuper)
  );

  return (
    <aside
      className={`no-print fixed top-0 bottom-0 left-0 z-40 bg-[#001f3f] text-slate-100 flex flex-col transition-all duration-300 border-r border-slate-800 shadow-xl ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-[#001730]">
        {!collapsed && (
          <div className="flex items-center space-x-2.5 truncate">
            <div className="p-2 bg-sky-600 rounded-lg text-white shadow-sm flex-shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div className="truncate">
              <span className="font-bold text-sm tracking-tight text-white block truncate">
                St. Xavier Academy
              </span>
              <span className="text-[10px] text-sky-300 uppercase tracking-widest block font-medium">
                Campus OS
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto p-2 bg-sky-600 rounded-lg text-white shadow-sm">
            <School className="w-5 h-5" />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors ml-auto hidden md:block"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Registry Groups */}
      <div className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2 space-y-4">
        {PAGE_GROUPS.map((group) => {
          const groupPages = visiblePages.filter((p) => p.group === group);
          if (groupPages.length === 0) return null;

          return (
            <div key={group} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-sky-400/80">
                  {group}
                </div>
              )}
              {groupPages.map((page) => {
                const isActive = activePage === page.key;
                return (
                  <button
                    key={page.key}
                    onClick={() => onSelectPage(page.key)}
                    title={collapsed ? page.label : undefined}
                    className={`w-full flex items-center rounded-lg transition-all text-sm font-medium ${
                      collapsed ? "justify-center p-2.5" : "px-3 py-2 space-x-3"
                    } ${
                      isActive
                        ? "bg-sky-600 text-white shadow-md font-semibold"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-sky-300"}>
                      {ICON_MAP[page.icon] || <LayoutDashboard className="w-5 h-5" />}
                    </span>
                    {!collapsed && <span className="truncate">{page.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-white/10 bg-[#001730]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 uppercase">
                {user?.username?.[0] || "A"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.username || "Admin"}</p>
                <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold rounded bg-sky-950 text-sky-300 border border-sky-800">
                  {user?.roleLabel || "Super Admin"}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-full flex justify-center p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
