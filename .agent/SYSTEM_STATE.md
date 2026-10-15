# SYSTEM_STATE.md — School Management System Architecture & State

**Project:** School Management System  
**Slug:** `school-management` (Database Namespace: `school_management`)  
**Created:** 2026-10-15  
**Status:** IN PROGRESS — Scaffolding & Initial Implementation  
**Target Production URL:** [https://school-management.akstack.com](https://school-management.akstack.com)  
**Dokploy Project:** `Agent-Supabase` (`rQWi4G7mifTX_cwpLbWTk`)  
**Dokploy Environment:** `production` (`awOmNSOg-Crp27dEU8gm6`)  
**GitHub Repository:** [https://github.com/AnandKg22/school-management.git](https://github.com/AnandKg22/school-management.git)  
**Central Supabase Instance:** `https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io`  
**Database Isolation Prefix:** `app_school_management_*`  
**Global Super Admin:** `admin@akstack.com` (`#Akaash22#`)  

---

## 1. Confirmed Decisions & Architectural Blueprint

1. **Core Value Proposition**:
   - Comprehensive K-12 and primary institution administration platform.
   - Modules: Students, Teachers, Fee Billing, Family/Sibling Billing, Salaries, Income/Expense Ledger, Inventory, Stock Movements, POS Counter, Vendor Directory, System Users & RBAC, Theme Customizer, and Audit Logging.
   - Built-in high-fidelity print engine for 3-copy Bank Challans (Bank, School, Student copies), Official Fee Receipts (with Indian numbering `numToWords`), and Teacher Salary Slips.

2. **Technology Stack**:
   - **Framework**: Next.js 15 (App Router), React 19, TypeScript (strict mode, zero implicit any)
   - **Styling**: Tailwind CSS, Lucide React icons, Navy Blue design system (`#001f3f`, `#003366`, `#0074D9`), dynamic Light/Dark mode and configurable theme presets
   - **Data Layer**: Direct PostgreSQL connection with fallback Supabase client, isolated by `app_school_management_*` prefix and RLS policies
   - **Testing**: Vitest for automated unit tests, financial formulas, and security regression
   - **Containerization**: Standalone multi-stage Dockerfile deployed on Dokploy

3. **Multi-Tenancy & Database Isolation**:
   - Table prefix: `app_school_management_*`
   - Strict Row-Level Security (RLS) on all tables:
     - Standard users can only view and mutate their authorized scope (`user_id = auth.uid()` or role-based check).
     - Global Superadmin bypass (`role = 'superadmin'` or `admin@akstack.com`) for platform-wide operations.
   - Pre-seeded Demo Accounts:
     1. **Super Admin**: `admin@akstack.com` / `#Akaash22#` (also `superadmin` / `admin123`)
     2. **School Admin**: `admin` / `admin123`
     3. **Accountant / Cashier**: `accountant` / `admin123`
     4. **Academic Teacher**: `teacher` / `admin123`
     5. **Store / Inventory Clerk**: `storekeeper` / `admin123`

4. **Financial Consistency & Concurrency Constraints**:
   - Concurrency-safe automatic identifier sequences: `ADM-{id}`, `EMP-{id}`, `RCPT-{id}`, `PS-{id}`, `VCH-{id}`, `CHL-{id}`.
   - Fee formula: `netPayable = Amount - Discount + LateFee`; `due = netPayable - PaidAmount`.
   - Salary formula: `netPayable = basic + allowances + bonus - deductions` (or `gross - deductions`).
   - Duplicate prevention: exactly 1 active fee per student per `YYYY-MM`; exactly 1 active salary per teacher per `YYYY-MM`.
   - Atomic family fee billing: batch insert inside PostgreSQL transaction with automatic duplicate skips.

5. **Assumptions Register (Inferred MVP Scope)**:
   - **Currency**: Indian Rupee (`₹`) by default, formatted with `numToWords` supporting Lakh and Crore.
   - **Document Printing**: Dedicated in-app print surfaces with `@media print` CSS rules, zero external popup windows.
   - **Inventory & POS**: Standard retail/school bookstore workflow with automatic stock deductions upon completed checkout.
   - **SMS/Notifications**: In-app notification bell with real count derived from audit/activity logs; external SMS logged to database.
