-- 001_initial_schema.sql: School Management System initial database schema
-- Namespace: app_school_management_*
-- Enforces referential integrity, partial unique indexes for duplicate prevention, and sequence generation.

-- 1. Sequences for Concurrency-Safe Automatic Identifiers
CREATE SEQUENCE IF NOT EXISTS app_school_management_adm_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS app_school_management_emp_seq START WITH 501;
CREATE SEQUENCE IF NOT EXISTS app_school_management_rcpt_seq START WITH 2001;
CREATE SEQUENCE IF NOT EXISTS app_school_management_ps_seq START WITH 3001;
CREATE SEQUENCE IF NOT EXISTS app_school_management_vch_seq START WITH 4001;
CREATE SEQUENCE IF NOT EXISTS app_school_management_pos_seq START WITH 6001;

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS app_school_management_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#0074D9',
  sort INT DEFAULT 1,
  is_super BOOLEAN DEFAULT false,
  hidden_signup BOOLEAN DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS app_school_management_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES app_school_management_roles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  profile_image TEXT,
  theme_mode VARCHAR(20) DEFAULT 'navy',
  custom_colors JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system'
);

-- 4. Students Table (31 Logical Fields)
CREATE TABLE IF NOT EXISTS app_school_management_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  class VARCHAR(50) NOT NULL CHECK (class IN ('Nursery', 'LKG', 'UKG', 'Class I', 'Class II', 'Class III')),
  gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
  dob DATE,
  father_name VARCHAR(100),
  mother_name VARCHAR(100),
  guardian_phone VARCHAR(30),
  address TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 650.00,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Left')),
  photo TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system',
  section VARCHAR(10) DEFAULT 'A',
  roll_no VARCHAR(20),
  academic_year VARCHAR(20) DEFAULT '2026-2027',
  category VARCHAR(50) DEFAULT 'General',
  transport_route VARCHAR(100),
  transport_fee NUMERIC(10, 2) DEFAULT 0.00,
  discount_percent NUMERIC(5, 2) DEFAULT 0.00,
  sibling_group VARCHAR(50),
  blood_group VARCHAR(10),
  emergency_contact VARCHAR(30),
  date_of_leaving DATE,
  tc_issued BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_asm_students_class ON app_school_management_students(class);
CREATE INDEX IF NOT EXISTS idx_asm_students_status ON app_school_management_students(status);
CREATE INDEX IF NOT EXISTS idx_asm_students_guardian ON app_school_management_students(guardian_phone);
CREATE INDEX IF NOT EXISTS idx_asm_students_sibling ON app_school_management_students(sibling_group);

-- 5. Teachers Table (25 Logical Fields)
CREATE TABLE IF NOT EXISTS app_school_management_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(255),
  qualification VARCHAR(100),
  designation VARCHAR(100),
  monthly_salary NUMERIC(10, 2) NOT NULL DEFAULT 25000.00,
  join_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  photo TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system',
  department VARCHAR(100),
  subjects TEXT,
  class_teacher_of VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(20),
  bank_account VARCHAR(50),
  ifsc VARCHAR(30),
  pan VARCHAR(30),
  leave_balance INT DEFAULT 15
);

CREATE INDEX IF NOT EXISTS idx_asm_teachers_status ON app_school_management_teachers(status);

-- 6. FeePayments Table (24 Logical Fields)
CREATE TABLE IF NOT EXISTS app_school_management_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no VARCHAR(50) UNIQUE NOT NULL,
  student_id UUID REFERENCES app_school_management_students(id) ON DELETE RESTRICT NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  fee_month VARCHAR(7) NOT NULL CHECK (fee_month ~ '^\d{4}-\d{2}$'),
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  late_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  due_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Due', 'Partial', 'Paid')),
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_mode VARCHAR(30) DEFAULT 'Cash',
  remarks TEXT,
  fee_type VARCHAR(50) DEFAULT 'Tuition',
  due_date DATE,
  academic_year VARCHAR(20) DEFAULT '2026-2027',
  collected_by VARCHAR(100) DEFAULT 'system',
  txn_reference VARCHAR(100),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system'
);

-- Duplicate guard: exactly one active fee per student per fee month
CREATE UNIQUE INDEX IF NOT EXISTS idx_asm_fee_student_month_active 
ON app_school_management_fee_payments(student_id, fee_month) 
WHERE (is_deleted = false);

CREATE INDEX IF NOT EXISTS idx_asm_fee_month ON app_school_management_fee_payments(fee_month);
CREATE INDEX IF NOT EXISTS idx_asm_fee_status ON app_school_management_fee_payments(status);

-- 7. SalaryPayments Table (23 Logical Fields)
CREATE TABLE IF NOT EXISTS app_school_management_salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_no VARCHAR(50) UNIQUE NOT NULL,
  teacher_id UUID REFERENCES app_school_management_teachers(id) ON DELETE RESTRICT NOT NULL,
  teacher_name VARCHAR(100) NOT NULL,
  salary_month VARCHAR(7) NOT NULL CHECK (salary_month ~ '^\d{4}-\d{2}$'),
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  basic NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  allowances NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  deductions NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  bonus NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  net_pay NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Unpaid', 'Partial', 'Paid')),
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_mode VARCHAR(30) DEFAULT 'Bank Transfer',
  remarks TEXT,
  days_present INT DEFAULT 30,
  bank_reference VARCHAR(100),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system'
);

-- Duplicate guard: exactly one active salary payment per teacher per salary month
CREATE UNIQUE INDEX IF NOT EXISTS idx_asm_sal_teacher_month_active 
ON app_school_management_salary_payments(teacher_id, salary_month) 
WHERE (is_deleted = false);

CREATE INDEX IF NOT EXISTS idx_asm_sal_month ON app_school_management_salary_payments(salary_month);

-- 8. Income/Expense Transactions Table (17 Logical Fields)
CREATE TABLE IF NOT EXISTS app_school_management_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_no VARCHAR(50) UNIQUE NOT NULL,
  txn_type VARCHAR(20) NOT NULL CHECK (txn_type IN ('Income', 'Expense')),
  category VARCHAR(50) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  txn_date DATE DEFAULT CURRENT_DATE,
  payment_mode VARCHAR(30) DEFAULT 'Cash',
  vendor VARCHAR(100),
  account_head VARCHAR(100),
  approved_by VARCHAR(100),
  attachment_url TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_asm_txn_date ON app_school_management_transactions(txn_date);
CREATE INDEX IF NOT EXISTS idx_asm_txn_type ON app_school_management_transactions(txn_type);

-- 9. Inventory Items Table
CREATE TABLE IF NOT EXISTS app_school_management_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit VARCHAR(20) DEFAULT 'Piece',
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  quantity_on_hand INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 5,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Stock Movements Table
CREATE TABLE IF NOT EXISTS app_school_management_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES app_school_management_inventory_items(id) ON DELETE RESTRICT NOT NULL,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('Receipt', 'Issue', 'Adjustment', 'Opening')),
  quantity INT NOT NULL,
  reference_no VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system'
);

-- 11. POS Orders Table
CREATE TABLE IF NOT EXISTS app_school_management_pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_type VARCHAR(30) DEFAULT 'Student' CHECK (customer_type IN ('Student', 'Teacher', 'Staff', 'Walk-in')),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_mode VARCHAR(30) DEFAULT 'Cash',
  status VARCHAR(20) DEFAULT 'Completed',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system'
);

-- 12. Vendors Table
CREATE TABLE IF NOT EXISTS app_school_management_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(30),
  email VARCHAR(255),
  address TEXT,
  gst_no VARCHAR(50),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. System Settings Table
CREATE TABLE IF NOT EXISTS app_school_management_settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'system'
);

-- 14. Audit Logs Table
CREATE TABLE IF NOT EXISTS app_school_management_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  ip_address VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_asm_logs_ts ON app_school_management_logs(timestamp DESC);

-- Enable RLS across all tables
ALTER TABLE app_school_management_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_school_management_logs ENABLE ROW LEVEL SECURITY;

-- Standard Policies: Allow full server backend direct postgres access & scoped client access
CREATE POLICY asm_server_roles ON app_school_management_roles FOR ALL USING (true);
CREATE POLICY asm_server_users ON app_school_management_users FOR ALL USING (true);
CREATE POLICY asm_server_students ON app_school_management_students FOR ALL USING (true);
CREATE POLICY asm_server_teachers ON app_school_management_teachers FOR ALL USING (true);
CREATE POLICY asm_server_fee ON app_school_management_fee_payments FOR ALL USING (true);
CREATE POLICY asm_server_salary ON app_school_management_salary_payments FOR ALL USING (true);
CREATE POLICY asm_server_txn ON app_school_management_transactions FOR ALL USING (true);
CREATE POLICY asm_server_inventory ON app_school_management_inventory_items FOR ALL USING (true);
CREATE POLICY asm_server_stock ON app_school_management_stock_movements FOR ALL USING (true);
CREATE POLICY asm_server_pos ON app_school_management_pos_orders FOR ALL USING (true);
CREATE POLICY asm_server_vendors ON app_school_management_vendors FOR ALL USING (true);
CREATE POLICY asm_server_settings ON app_school_management_settings FOR ALL USING (true);
CREATE POLICY asm_server_logs ON app_school_management_logs FOR ALL USING (true);
