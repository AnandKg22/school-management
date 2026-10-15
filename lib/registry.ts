export interface PageDefinition {
  key: string;
  label: string;
  group: "General" | "Academics" | "Finance" | "Inventory" | "System";
  icon: string;
  route: string;
  description: string;
  allowedActions: ("view" | "add" | "edit" | "delete")[];
}

export const PAGE_META: Record<string, PageDefinition> = {
  dashboard: {
    key: "dashboard",
    label: "Dashboard",
    group: "General",
    icon: "LayoutDashboard",
    route: "/dashboard",
    description: "Operational overview, financial aggregates & live statistics",
    allowedActions: ["view"],
  },
  students: {
    key: "students",
    label: "Students",
    group: "Academics",
    icon: "GraduationCap",
    route: "/students",
    description: "Student profiles, admissions, sections and family links",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  teachers: {
    key: "teachers",
    label: "Teachers",
    group: "Academics",
    icon: "UserCheck",
    route: "/teachers",
    description: "Faculty directory, designations, qualifications and salaries",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  fees: {
    key: "fees",
    label: "Fee Payments",
    group: "Finance",
    icon: "Receipt",
    route: "/fees",
    description: "Student fee billing, family billing, receipts and 3-copy challans",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  salaries: {
    key: "salaries",
    label: "Salary Payments",
    group: "Finance",
    icon: "Banknote",
    route: "/salaries",
    description: "Teacher payroll, allowances, deductions, and monthly salary slips",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  income_expense: {
    key: "income_expense",
    label: "Income & Expense",
    group: "Finance",
    icon: "ArrowLeftRight",
    route: "/income-expense",
    description: "General cashflow ledger, payment vouchers and expense accounts",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  inventory: {
    key: "inventory",
    label: "Inventory",
    group: "Inventory",
    icon: "Boxes",
    route: "/inventory",
    description: "School supplies, textbooks, uniforms and SKU catalog",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  stock: {
    key: "stock",
    label: "Stock Movements",
    group: "Inventory",
    icon: "Truck",
    route: "/stock",
    description: "Stock receipts, issues, adjustments and audit history",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  pos: {
    key: "pos",
    label: "POS Checkout",
    group: "Inventory",
    icon: "ShoppingCart",
    route: "/pos",
    description: "Counter sales for uniforms, books, stationery and accessories",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  vendors: {
    key: "vendors",
    label: "Vendors",
    group: "Inventory",
    icon: "Building2",
    route: "/vendors",
    description: "Suppliers, publishers, uniforms manufacturers and contractors",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  users: {
    key: "users",
    label: "Users & RBAC",
    group: "System",
    icon: "ShieldAlert",
    route: "/users",
    description: "System accounts, role definitions and fine-grained permission matrix",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  settings: {
    key: "settings",
    label: "School Settings",
    group: "System",
    icon: "Sliders",
    route: "/settings",
    description: "Institution details, letterhead styling, theme customizer & defaults",
    allowedActions: ["view", "add", "edit", "delete"],
  },
  logs: {
    key: "logs",
    label: "Audit Logs",
    group: "System",
    icon: "ScrollText",
    route: "/logs",
    description: "Immutable security, financial and operational event history",
    allowedActions: ["view"],
  },
};

export const PAGE_GROUPS = ["General", "Academics", "Finance", "Inventory", "System"] as const;

/**
 * Checks whether user role has permission for given page and action
 */
export function hasPermission(
  permissions: Record<string, string[]> | null | undefined,
  pageKey: string,
  action: "view" | "add" | "edit" | "delete",
  isSuper: boolean = false
): boolean {
  if (isSuper) {
    // Super Admin has view only on dashboard & logs, full on others
    if (pageKey === "dashboard" || pageKey === "logs") {
      return action === "view";
    }
    return true;
  }

  if (!permissions || !permissions[pageKey]) {
    return false;
  }

  return permissions[pageKey].includes(action);
}
