"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import DashboardView from "./views/DashboardView";
import StudentsView from "./views/StudentsView";
import TeachersView from "./views/TeachersView";
import FeesView from "./views/FeesView";
import SalariesView from "./views/SalariesView";
import IncomeExpenseView from "./views/IncomeExpenseView";
import InventoryView from "./views/InventoryView";
import StockView from "./views/StockView";
import PosView from "./views/PosView";
import VendorsView from "./views/VendorsView";
import UsersView from "./views/UsersView";
import SettingsView from "./views/SettingsView";
import LogsView from "./views/LogsView";

export default function AppShell() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Dashboard shared metrics
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      const json = await res.json();
      if (json.success && json.data?.user) {
        setUser(json.data.user);
        if (json.data.user.themeMode === "dark") {
          setDarkMode(true);
          document.documentElement.classList.add("dark");
        }
      } else {
        router.push("/login");
      }
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const res = await fetch("/api/v1/dashboard");
      const json = await res.json();
      if (json.success) {
        setDashboardData(json.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchDashboard();
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001f3f] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold tracking-wider uppercase text-sky-200">
            Initializing Campus OS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
      {/* Collapsible Left Navigation Bar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={(page) => {
          setActivePage(page);
          if (page === "dashboard") fetchDashboard();
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-[72px]" : "md:pl-64"
        }`}
      >
        {/* Top Navbar */}
        <TopNavbar
          activePage={activePage}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
          darkMode={darkMode}
          onToggleTheme={handleToggleTheme}
          recentLogs={dashboardData?.recentActivity || []}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {activePage === "dashboard" && (
            <DashboardView
              data={dashboardData}
              loading={dashboardLoading}
              onNavigate={(page) => setActivePage(page)}
            />
          )}
          {activePage === "students" && <StudentsView user={user} />}
          {activePage === "teachers" && <TeachersView user={user} />}
          {activePage === "fees" && <FeesView user={user} />}
          {activePage === "salaries" && <SalariesView user={user} />}
          {activePage === "income_expense" && <IncomeExpenseView user={user} />}
          {activePage === "inventory" && <InventoryView user={user} />}
          {activePage === "stock" && <StockView user={user} />}
          {activePage === "pos" && <PosView user={user} />}
          {activePage === "vendors" && <VendorsView user={user} />}
          {activePage === "users" && <UsersView user={user} />}
          {activePage === "settings" && <SettingsView user={user} />}
          {activePage === "logs" && <LogsView user={user} />}
        </main>
      </div>
    </div>
  );
}
