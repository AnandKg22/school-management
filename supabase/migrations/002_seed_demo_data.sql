-- 002_seed_demo_data.sql: Seed Initial Roles, Users, Students, Teachers, and Operations
-- Idempotent seed using ON CONFLICT DO NOTHING

-- 1. Seed Roles
INSERT INTO app_school_management_roles (role_key, label, color, sort, is_super, permissions)
VALUES 
(
  'super_admin', 
  'Super Admin', 
  '#001f3f', 
  1, 
  true, 
  '{
    "dashboard": ["view"],
    "students": ["view", "add", "edit", "delete"],
    "teachers": ["view", "add", "edit", "delete"],
    "fees": ["view", "add", "edit", "delete"],
    "salaries": ["view", "add", "edit", "delete"],
    "income_expense": ["view", "add", "edit", "delete"],
    "inventory": ["view", "add", "edit", "delete"],
    "stock": ["view", "add", "edit", "delete"],
    "pos": ["view", "add", "edit", "delete"],
    "vendors": ["view", "add", "edit", "delete"],
    "users": ["view", "add", "edit", "delete"],
    "settings": ["view", "add", "edit", "delete"],
    "logs": ["view"]
  }'::jsonb
),
(
  'admin', 
  'Admin', 
  '#0074D9', 
  2, 
  false, 
  '{
    "dashboard": ["view"],
    "students": ["view", "add", "edit"],
    "fees": ["view", "add", "edit"],
    "inventory": ["view", "add", "edit"],
    "stock": ["view", "add", "edit"],
    "pos": ["view", "add", "edit"],
    "vendors": ["view", "add", "edit"],
    "income_expense": ["view", "add", "edit"],
    "teachers": ["view"],
    "salaries": ["view"],
    "users": [],
    "settings": [],
    "logs": []
  }'::jsonb
),
(
  'accountant',
  'Accountant',
  '#34a853',
  3,
  false,
  '{
    "dashboard": ["view"],
    "students": ["view"],
    "fees": ["view", "add", "edit"],
    "salaries": ["view", "add", "edit"],
    "income_expense": ["view", "add", "edit"],
    "pos": ["view", "add", "edit"]
  }'::jsonb
),
(
  'teacher',
  'Teacher',
  '#fbbc04',
  4,
  false,
  '{
    "dashboard": ["view"],
    "students": ["view"],
    "teachers": ["view"]
  }'::jsonb
),
(
  'storekeeper',
  'Store Manager',
  '#795548',
  5,
  false,
  '{
    "dashboard": ["view"],
    "inventory": ["view", "add", "edit"],
    "stock": ["view", "add", "edit"],
    "pos": ["view", "add", "edit"],
    "vendors": ["view", "add"]
  }'::jsonb
)
ON CONFLICT (role_key) DO NOTHING;

-- 2. Seed Users (passwords hashed using standard sha256 hex for demo, or bcrypt compatible string)
-- We'll store a standard deterministic hash for demo convenience: sha256 of "admin123" is "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"
-- and for "#Akaash22#" is "b8cf8353a25b1b22e1181295b927ea9d4b0ac0103cf1c3ab5555bb0f498cbe02"
DO $$
DECLARE
  v_super_role UUID;
  v_admin_role UUID;
  v_acct_role UUID;
  v_teach_role UUID;
  v_store_role UUID;
BEGIN
  SELECT id INTO v_super_role FROM app_school_management_roles WHERE role_key = 'super_admin';
  SELECT id INTO v_admin_role FROM app_school_management_roles WHERE role_key = 'admin';
  SELECT id INTO v_acct_role FROM app_school_management_roles WHERE role_key = 'accountant';
  SELECT id INTO v_teach_role FROM app_school_management_roles WHERE role_key = 'teacher';
  SELECT id INTO v_store_role FROM app_school_management_roles WHERE role_key = 'storekeeper';

  -- Global Superadmin
  INSERT INTO app_school_management_users (username, email, password_hash, role_id, status)
  VALUES ('admin', 'admin@akstack.com', 'b8cf8353a25b1b22e1181295b927ea9d4b0ac0103cf1c3ab5555bb0f498cbe02', v_super_role, 'Active')
  ON CONFLICT (username) DO UPDATE SET role_id = v_super_role;

  -- Demo Super Admin (username: superadmin / admin123)
  INSERT INTO app_school_management_users (username, email, password_hash, role_id, status)
  VALUES ('superadmin', 'superadmin@school.akstack.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', v_super_role, 'Active')
  ON CONFLICT (username) DO UPDATE SET role_id = v_super_role;

  -- Demo Admin (username: school_admin / admin123)
  INSERT INTO app_school_management_users (username, email, password_hash, role_id, status)
  VALUES ('school_admin', 'school.admin@school.akstack.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', v_admin_role, 'Active')
  ON CONFLICT (username) DO NOTHING;

  -- Demo Accountant (username: accountant / admin123)
  INSERT INTO app_school_management_users (username, email, password_hash, role_id, status)
  VALUES ('accountant', 'accountant@school.akstack.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', v_acct_role, 'Active')
  ON CONFLICT (username) DO NOTHING;

  -- Demo Teacher (username: teacher / admin123)
  INSERT INTO app_school_management_users (username, email, password_hash, role_id, status)
  VALUES ('teacher', 'teacher@school.akstack.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', v_teach_role, 'Active')
  ON CONFLICT (username) DO NOTHING;

  -- Demo Storekeeper (username: storekeeper / admin123)
  INSERT INTO app_school_management_users (username, email, password_hash, role_id, status)
  VALUES ('storekeeper', 'storekeeper@school.akstack.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', v_store_role, 'Active')
  ON CONFLICT (username) DO NOTHING;
END $$;

-- 3. Seed Students (8 Students with family sibling links)
INSERT INTO app_school_management_students 
(admission_no, name, class, gender, dob, father_name, mother_name, guardian_phone, address, admission_date, monthly_fee, status, section, roll_no, sibling_group, discount_percent)
VALUES
('ADM-1001', 'Aarav Sharma', 'Class I', 'Male', '2019-04-12', 'Rajesh Sharma', 'Pooja Sharma', '9876543210', '14 Civil Lines, New Delhi', '2025-04-01', 700.00, 'Active', 'A', '101', 'FAM-SHARMA-01', 0.00),
('ADM-1002', 'Ananya Sharma', 'Nursery', 'Female', '2022-07-25', 'Rajesh Sharma', 'Pooja Sharma', '9876543210', '14 Civil Lines, New Delhi', '2026-04-01', 650.00, 'Active', 'A', '102', 'FAM-SHARMA-01', 10.00),
('ADM-1003', 'Vihaan Verma', 'Class II', 'Male', '2018-09-18', 'Suresh Verma', 'Sunita Verma', '9811223344', '88 Model Town, New Delhi', '2024-04-01', 700.00, 'Active', 'B', '201', 'FAM-VERMA-02', 0.00),
('ADM-1004', 'Ishita Verma', 'UKG', 'Female', '2021-02-14', 'Suresh Verma', 'Sunita Verma', '9811223344', '88 Model Town, New Delhi', '2025-04-01', 650.00, 'Active', 'A', '202', 'FAM-VERMA-02', 10.00),
('ADM-1005', 'Reyansh Gupta', 'Class III', 'Male', '2017-11-05', 'Manoj Gupta', 'Kavita Gupta', '9822334455', '204 Green Park, New Delhi', '2023-04-01', 700.00, 'Active', 'A', '301', 'FAM-GUPTA-03', 0.00),
('ADM-1006', 'Myra Kapoor', 'LKG', 'Female', '2021-08-30', 'Rohan Kapoor', 'Neha Kapoor', '9833445566', '55 Vasant Kunj, New Delhi', '2026-04-01', 650.00, 'Active', 'A', '103', NULL, 0.00),
('ADM-1007', 'Kabir Mehta', 'Class I', 'Male', '2019-06-15', 'Vikram Mehta', 'Ritu Mehta', '9844556677', '12 Saket, New Delhi', '2025-04-01', 700.00, 'Inactive', 'B', '104', NULL, 0.00),
('ADM-1008', 'Saanvi Singh', 'UKG', 'Female', '2021-01-10', 'Alok Singh', 'Meera Singh', '9855667788', '71 Hauz Khas, New Delhi', '2025-04-01', 650.00, 'Active', 'A', '203', NULL, 0.00)
ON CONFLICT (admission_no) DO NOTHING;

-- 4. Seed Teachers (5 Teachers)
INSERT INTO app_school_management_teachers 
(employee_id, name, phone, email, qualification, designation, monthly_salary, join_date, status, department, subjects, class_teacher_of)
VALUES
('EMP-501', 'Ramesh Chandra', '9988776655', 'ramesh.chandra@school.akstack.com', 'M.Sc, B.Ed', 'Senior Teacher', 35000.00, '2022-06-01', 'Active', 'Science & Mathematics', 'Mathematics, Physics', 'Class III'),
('EMP-502', 'Sunita Rao', '9977665544', 'sunita.rao@school.akstack.com', 'M.A English, B.Ed', 'Head of Humanities', 38000.00, '2020-04-15', 'Active', 'Languages', 'English, Social Studies', 'Class II'),
('EMP-503', 'Priya Menon', '9966554433', 'priya.menon@school.akstack.com', 'B.El.Ed, Montessori Certified', 'Primary Educator', 28000.00, '2023-07-01', 'Active', 'Early Childhood', 'EVS, Phonics, Art', 'UKG'),
('EMP-504', 'Amitabh Roy', '9955443322', 'amitabh.roy@school.akstack.com', 'B.P.Ed', 'Physical Education Instructor', 26000.00, '2024-01-10', 'Active', 'Sports & Wellness', 'Physical Education, Yoga', NULL),
('EMP-505', 'Deepa Joshi', '9944332211', 'deepa.joshi@school.akstack.com', 'B.A Hindi, B.Ed', 'Primary Teacher', 27000.00, '2024-04-01', 'Active', 'Languages', 'Hindi, Moral Science', 'Class I')
ON CONFLICT (employee_id) DO NOTHING;

-- 5. Seed Fees (Sample Payments for 2026-10 and 2026-09)
DO $$
DECLARE
  v_aarav UUID;
  v_ananya UUID;
  v_vihaan UUID;
BEGIN
  SELECT id INTO v_aarav FROM app_school_management_students WHERE admission_no = 'ADM-1001';
  SELECT id INTO v_ananya FROM app_school_management_students WHERE admission_no = 'ADM-1002';
  SELECT id INTO v_vihaan FROM app_school_management_students WHERE admission_no = 'ADM-1003';

  IF v_aarav IS NOT NULL THEN
    INSERT INTO app_school_management_fee_payments 
    (receipt_no, student_id, student_name, fee_month, amount, paid_amount, discount, late_fee, due_amount, status, payment_date, payment_mode)
    VALUES ('RCPT-2001', v_aarav, 'Aarav Sharma', '2026-10', 700.00, 700.00, 0.00, 0.00, 0.00, 'Paid', '2026-10-05', 'UPI')
    ON CONFLICT (receipt_no) DO NOTHING;
  END IF;

  IF v_ananya IS NOT NULL THEN
    INSERT INTO app_school_management_fee_payments 
    (receipt_no, student_id, student_name, fee_month, amount, paid_amount, discount, late_fee, due_amount, status, payment_date, payment_mode)
    VALUES ('RCPT-2002', v_ananya, 'Ananya Sharma', '2026-10', 650.00, 585.00, 65.00, 0.00, 0.00, 'Paid', '2026-10-05', 'UPI')
    ON CONFLICT (receipt_no) DO NOTHING;
  END IF;

  IF v_vihaan IS NOT NULL THEN
    INSERT INTO app_school_management_fee_payments 
    (receipt_no, student_id, student_name, fee_month, amount, paid_amount, discount, late_fee, due_amount, status, payment_date, payment_mode)
    VALUES ('RCPT-2003', v_vihaan, 'Vihaan Verma', '2026-10', 700.00, 350.00, 0.00, 0.00, 350.00, 'Partial', '2026-10-10', 'Cash')
    ON CONFLICT (receipt_no) DO NOTHING;
  END IF;
END $$;

-- 6. Seed Salary Payments (Sample for 2026-09)
DO $$
DECLARE
  v_ramesh UUID;
  v_sunita UUID;
BEGIN
  SELECT id INTO v_ramesh FROM app_school_management_teachers WHERE employee_id = 'EMP-501';
  SELECT id INTO v_sunita FROM app_school_management_teachers WHERE employee_id = 'EMP-502';

  IF v_ramesh IS NOT NULL THEN
    INSERT INTO app_school_management_salary_payments 
    (payslip_no, teacher_id, teacher_name, salary_month, amount, paid_amount, basic, allowances, deductions, bonus, net_pay, status, payment_date, payment_mode)
    VALUES ('PS-3001', v_ramesh, 'Ramesh Chandra', '2026-09', 35000.00, 35000.00, 25000.00, 10000.00, 1500.00, 1500.00, 35000.00, 'Paid', '2026-10-01', 'Bank Transfer')
    ON CONFLICT (payslip_no) DO NOTHING;
  END IF;

  IF v_sunita IS NOT NULL THEN
    INSERT INTO app_school_management_salary_payments 
    (payslip_no, teacher_id, teacher_name, salary_month, amount, paid_amount, basic, allowances, deductions, bonus, net_pay, status, payment_date, payment_mode)
    VALUES ('PS-3002', v_sunita, 'Sunita Rao', '2026-09', 38000.00, 38000.00, 28000.00, 10000.00, 1800.00, 1800.00, 38000.00, 'Paid', '2026-10-01', 'Bank Transfer')
    ON CONFLICT (payslip_no) DO NOTHING;
  END IF;
END $$;

-- 7. Seed Transactions
INSERT INTO app_school_management_transactions 
(voucher_no, txn_type, category, amount, description, txn_date, payment_mode, account_head)
VALUES 
('VCH-4001', 'Income', 'Admission Fees', 15000.00, 'New Admissions registration fee batch', '2026-10-02', 'Bank Transfer', 'Admissions'),
('VCH-4002', 'Expense', 'Electricity Bill', 6800.00, 'State Electricity Board Monthly bill', '2026-10-04', 'Net Banking', 'Utilities'),
('VCH-4003', 'Expense', 'Stationery & Printing', 3200.00, 'Exam paper and workbook prints', '2026-10-08', 'Cash', 'Office Supplies')
ON CONFLICT (voucher_no) DO NOTHING;

-- 8. Seed Inventory Items & Stock
INSERT INTO app_school_management_inventory_items 
(sku, name, category, unit, cost_price, selling_price, quantity_on_hand, reorder_level)
VALUES 
('SKU-NB-01', 'School Ruled Notebook (120 pgs)', 'Stationery', 'Piece', 25.00, 40.00, 250, 50),
('SKU-UN-01', 'Primary Uniform Navy Blue (Size S)', 'Uniforms', 'Set', 450.00, 650.00, 80, 20),
('SKU-UN-02', 'Primary Uniform Navy Blue (Size M)', 'Uniforms', 'Set', 480.00, 700.00, 65, 20),
('SKU-BK-01', 'Class 1 Math Foundation Book', 'Books', 'Piece', 140.00, 195.00, 95, 25),
('SKU-ID-01', 'Student Smart ID Badge with Lanyard', 'Accessories', 'Piece', 35.00, 60.00, 180, 40)
ON CONFLICT (sku) DO NOTHING;

-- 9. Seed Vendors
INSERT INTO app_school_management_vendors 
(name, contact_person, phone, email, address, gst_no)
VALUES 
('National Book Depot', 'Rajesh Kedia', '9810011223', 'orders@nationalbookdepot.in', 'Daryaganj, New Delhi', '07AAAAA0000A1Z5'),
('Apex Garments & Textiles', 'Manish Bansal', '9820022334', 'sales@apexgarments.com', 'Surat, Gujarat', '24BBBBB1111B2Z6'),
('Modern Stationery Mart', 'Kamal Gupta', '9830033445', 'supply@modernstationery.in', 'Sadar Bazar, Delhi', '07CCCCC2222C3Z7')
ON CONFLICT DO NOTHING;

-- 10. Seed System Settings
INSERT INTO app_school_management_settings (key, value)
VALUES 
('school_info', '{
  "name": "St. Xavier Academy of Excellence",
  "address": "42 Knowledge Boulevard, Institutional Area, New Delhi - 110025",
  "phone": "+91 11 2654 8899",
  "email": "info@stxavieracademy.edu.in",
  "affiliation_no": "CBSE/AFF/2026/88392",
  "currency_symbol": "₹",
  "timezone": "Asia/Kolkata"
}'::jsonb),
('theme_config', '{
  "theme_mode": "navy",
  "primary_color": "#001f3f",
  "accent_color": "#0074D9"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 11. Seed Initial Audit Log
INSERT INTO app_school_management_logs (user_name, action, details)
VALUES 
('system', 'SYSTEM_BOOTSTRAP', 'Database initialized, roles, users, and academic seed data successfully populated.');
