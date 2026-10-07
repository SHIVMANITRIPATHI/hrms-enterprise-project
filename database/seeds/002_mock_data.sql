-- SHIVMANI HRMS Seed Data
-- Target Engine: Microsoft SQL Server

USE hrms_db;
GO

-- 1. DEPARTMENTS
IF NOT EXISTS (SELECT 1 FROM departments WHERE id = 'd1111111-1111-1111-1111-111111111111')
BEGIN
    INSERT INTO departments (id, code, name, description, created_at, updated_at, is_deleted)
    VALUES ('d1111111-1111-1111-1111-111111111111', 'DEPT-ENG', 'Engineering', 'Software Development & IT Infrastructure', GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM departments WHERE id = 'd2222222-2222-2222-2222-222222222222')
BEGIN
    INSERT INTO departments (id, code, name, description, created_at, updated_at, is_deleted)
    VALUES ('d2222222-2222-2222-2222-222222222222', 'DEPT-HR', 'Human Resources', 'Talent Acquisition & Employee Relations', GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM departments WHERE id = 'd3333333-3333-3333-3333-333333333333')
BEGIN
    INSERT INTO departments (id, code, name, description, created_at, updated_at, is_deleted)
    VALUES ('d3333333-3333-3333-3333-333333333333', 'DEPT-FIN', 'Finance & Accounts', 'Financial Planning & Tax Compliance', GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM departments WHERE id = 'd4444444-4444-4444-4444-444444444444')
BEGIN
    INSERT INTO departments (id, code, name, description, created_at, updated_at, is_deleted)
    VALUES ('d4444444-4444-4444-4444-444444444444', 'DEPT-SALES', 'Sales & Marketing', 'Enterprise Business Development', GETUTCDATE(), GETUTCDATE(), 0);
END
GO

-- 2. DESIGNATIONS
IF NOT EXISTS (SELECT 1 FROM designations WHERE id = 'ds111111-1111-1111-1111-111111111111')
BEGIN
    INSERT INTO designations (id, department_id, code, name, description, created_at, updated_at, is_deleted)
    VALUES ('ds111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'DESIG-VP-ENG', 'VP of Engineering', 'Leads overall engineering strategy', GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM designations WHERE id = 'ds222222-2222-2222-2222-222222222222')
BEGIN
    INSERT INTO designations (id, department_id, code, name, description, created_at, updated_at, is_deleted)
    VALUES ('ds222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'DESIG-SR-ENG', 'Senior Full Stack Engineer', 'Leads technical architecture and features', GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM designations WHERE id = 'ds333333-3333-3333-3333-333333333333')
BEGIN
    INSERT INTO designations (id, department_id, code, name, description, created_at, updated_at, is_deleted)
    VALUES ('ds333333-3333-3333-3333-333333333333', 'd2222222-2222-2222-2222-222222222222', 'DESIG-HR-DIR', 'Head of Human Resources', 'Directs corporate HR and talent acquisition', GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM designations WHERE id = 'ds444444-4444-4444-4444-444444444444')
BEGIN
    INSERT INTO designations (id, department_id, code, name, description, created_at, updated_at, is_deleted)
    VALUES ('ds444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', 'DESIG-HR-SPEC', 'HR Operations Specialist', 'Manages employee lifecycle and payroll operations', GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM designations WHERE id = 'ds555555-5555-5555-5555-555555555555')
BEGIN
    INSERT INTO designations (id, department_id, code, name, description, created_at, updated_at, is_deleted)
    VALUES ('ds555555-5555-5555-5555-555555555555', 'd1111111-1111-1111-1111-111111111111', 'DESIG-FE-ENG', 'Frontend Engineer', 'Builds responsive user interfaces and client apps', GETUTCDATE(), GETUTCDATE(), 0);
END
GO

-- 3. EMPLOYEES (INCLUDING INITIAL HR ADMINS)
-- HR User 1: Neha Mishra (Emp-0001)
IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_code = 'Emp-0001')
BEGIN
    INSERT INTO employees (
        id, employee_code, first_name, last_name, email, phone, date_of_birth, gender,
        date_of_joining, employment_status, employment_type, department_id, designation_id,
        manager_id, address, city, state, postal_code, country, emergency_contact_name,
        emergency_contact_phone, bank_name, account_number, ifsc_code, pan_number, uan_number,
        created_at, updated_at, is_deleted
    ) VALUES (
        'e1000000-0000-0000-0000-000000000001', 'Emp-0001', 'Neha', 'Mishra',
        'neha.mishra@enterprise.com', '+91 98111 22334', '1989-04-12', 'FEMALE',
        '2020-01-05', 'ACTIVE', 'FULL_TIME', 'd2222222-2222-2222-2222-222222222222',
        'ds333333-3333-3333-3333-333333333333', NULL, '402 Prestige Palms, Indiranagar',
        'Bengaluru', 'Karnataka', '560038', 'India', 'Vivek Mishra', '+91 98111 22335',
        'HDFC Bank', '50100456123456', 'HDFC0000123', 'NEHPM1234F', '100908070101',
        GETUTCDATE(), GETUTCDATE(), 0
    );
END

-- HR User 2: Sangeeta Mishra (Emp-0002)
IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_code = 'Emp-0002')
BEGIN
    INSERT INTO employees (
        id, employee_code, first_name, last_name, email, phone, date_of_birth, gender,
        date_of_joining, employment_status, employment_type, department_id, designation_id,
        manager_id, address, city, state, postal_code, country, emergency_contact_name,
        emergency_contact_phone, bank_name, account_number, ifsc_code, pan_number, uan_number,
        created_at, updated_at, is_deleted
    ) VALUES (
        'e2000000-0000-0000-0000-000000000002', 'Emp-0002', 'Sangeeta', 'Mishra',
        'sangeeta.mishra@enterprise.com', '+91 98222 33445', '1992-08-19', 'FEMALE',
        '2021-02-15', 'ACTIVE', 'FULL_TIME', 'd2222222-2222-2222-2222-222222222222',
        'ds444444-4444-4444-4444-444444444444', 'e1000000-0000-0000-0000-000000000001',
        '108 Sobha Sapphire, Bellandur', 'Bengaluru', 'Karnataka', '560103', 'India',
        'Alok Mishra', '+91 98222 33446', 'ICICI Bank', '000401889977', 'ICIC0000004',
        'SANPM5678G', '100908070202', GETUTCDATE(), GETUTCDATE(), 0
    );
END

-- Employee 1: Rajesh Kumar (Emp-0003)
IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_code = 'Emp-0003')
BEGIN
    INSERT INTO employees (
        id, employee_code, first_name, last_name, email, phone, date_of_birth, gender,
        date_of_joining, employment_status, employment_type, department_id, designation_id,
        manager_id, address, city, state, postal_code, country, emergency_contact_name,
        emergency_contact_phone, bank_name, account_number, ifsc_code, pan_number, uan_number,
        created_at, updated_at, is_deleted
    ) VALUES (
        'e3000000-0000-0000-0000-000000000003', 'Emp-0003', 'Rajesh', 'Kumar',
        'rajesh.kumar@enterprise.com', '+91 97654 32109', '1990-11-05', 'MALE',
        '2021-06-01', 'ACTIVE', 'FULL_TIME', 'd1111111-1111-1111-1111-111111111111',
        'ds222222-2222-2222-2222-222222222222', 'e1000000-0000-0000-0000-000000000001',
        '78 Green Glen Layout, Bellandur', 'Bengaluru', 'Karnataka', '560103', 'India',
        'Sunita Kumar', '+91 97654 32110', 'Axis Bank', '918010023456', 'UTIB0000258',
        'CPKPR9012K', '100908070607', GETUTCDATE(), GETUTCDATE(), 0
    );
END

-- Employee 2: Ananya Rao (Emp-0004)
IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_code = 'Emp-0004')
BEGIN
    INSERT INTO employees (
        id, employee_code, first_name, last_name, email, phone, date_of_birth, gender,
        date_of_joining, employment_status, employment_type, department_id, designation_id,
        manager_id, address, city, state, postal_code, country, emergency_contact_name,
        emergency_contact_phone, bank_name, account_number, ifsc_code, pan_number, uan_number,
        created_at, updated_at, is_deleted
    ) VALUES (
        'e4000000-0000-0000-0000-000000000004', 'Emp-0004', 'Ananya', 'Rao',
        'ananya.rao@enterprise.com', '+91 98123 45678', '1993-08-22', 'FEMALE',
        '2021-03-15', 'ACTIVE', 'FULL_TIME', 'd1111111-1111-1111-1111-111111111111',
        'ds555555-5555-5555-5555-555555555555', 'e3000000-0000-0000-0000-000000000003',
        '405 Cypress Heights, Koramangala', 'Bengaluru', 'Karnataka', '560034', 'India',
        'Suresh Rao', '+91 98123 45679', 'ICICI Bank', '000401543210', 'ICIC0000004',
        'BSPRR5678G', '100908070606', GETUTCDATE(), GETUTCDATE(), 0
    );
END

-- Employee 3: Shivmani Sharma (Emp-0005)
IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_code = 'Emp-0005')
BEGIN
    INSERT INTO employees (
        id, employee_code, first_name, last_name, email, phone, date_of_birth, gender,
        date_of_joining, employment_status, employment_type, department_id, designation_id,
        manager_id, address, city, state, postal_code, country, emergency_contact_name,
        emergency_contact_phone, bank_name, account_number, ifsc_code, pan_number, uan_number,
        created_at, updated_at, is_deleted
    ) VALUES (
        'e5000000-0000-0000-0000-000000000005', 'Emp-0005', 'Shivmani', 'Sharma',
        'shivmani.sharma@enterprise.com', '+91 98765 43210', '1988-05-15', 'MALE',
        '2020-01-10', 'ACTIVE', 'FULL_TIME', 'd1111111-1111-1111-1111-111111111111',
        'ds111111-1111-1111-1111-111111111111', NULL, '102 Tech Park, Whitefield',
        'Bengaluru', 'Karnataka', '560066', 'India', 'Priya Sharma', '+91 98765 43211',
        'HDFC Bank', '50100234567890', 'HDFC0001234', 'ABCPS1234F', '100908070605',
        GETUTCDATE(), GETUTCDATE(), 0
    );
END
GO

-- 4. AUTHENTICATION USERS (BCRYPT HASH FOR 'Mponline@123')
-- Hash: $2b$12$6.41DIuTkxbKTvOXpNe8.OyY/1wlnenPnSFjxiJI0SNHITvM3yn5m
IF NOT EXISTS (SELECT 1 FROM users WHERE employee_code = 'Emp-0001')
BEGIN
    INSERT INTO users (id, employee_id, employee_code, password_hash, role, is_active, must_change_password, created_at, updated_at)
    VALUES ('u1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Emp-0001', '$2b$12$6.41DIuTkxbKTvOXpNe8.OyY/1wlnenPnSFjxiJI0SNHITvM3yn5m', 'HR', 1, 0, GETUTCDATE(), GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM users WHERE employee_code = 'Emp-0002')
BEGIN
    INSERT INTO users (id, employee_id, employee_code, password_hash, role, is_active, must_change_password, created_at, updated_at)
    VALUES ('u2000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000002', 'Emp-0002', '$2b$12$6.41DIuTkxbKTvOXpNe8.OyY/1wlnenPnSFjxiJI0SNHITvM3yn5m', 'HR', 1, 0, GETUTCDATE(), GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM users WHERE employee_code = 'Emp-0003')
BEGIN
    INSERT INTO users (id, employee_id, employee_code, password_hash, role, is_active, must_change_password, created_at, updated_at)
    VALUES ('u3000000-0000-0000-0000-000000000003', 'e3000000-0000-0000-0000-000000000003', 'Emp-0003', '$2b$12$6.41DIuTkxbKTvOXpNe8.OyY/1wlnenPnSFjxiJI0SNHITvM3yn5m', 'EMPLOYEE', 1, 0, GETUTCDATE(), GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM users WHERE employee_code = 'Emp-0004')
BEGIN
    INSERT INTO users (id, employee_id, employee_code, password_hash, role, is_active, must_change_password, created_at, updated_at)
    VALUES ('u4000000-0000-0000-0000-000000000004', 'e4000000-0000-0000-0000-000000000004', 'Emp-0004', '$2b$12$6.41DIuTkxbKTvOXpNe8.OyY/1wlnenPnSFjxiJI0SNHITvM3yn5m', 'EMPLOYEE', 1, 0, GETUTCDATE(), GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM users WHERE employee_code = 'Emp-0005')
BEGIN
    INSERT INTO users (id, employee_id, employee_code, password_hash, role, is_active, must_change_password, created_at, updated_at)
    VALUES ('u5000000-0000-0000-0000-000000000005', 'e5000000-0000-0000-0000-000000000005', 'Emp-0005', '$2b$12$6.41DIuTkxbKTvOXpNe8.OyY/1wlnenPnSFjxiJI0SNHITvM3yn5m', 'EMPLOYEE', 1, 0, GETUTCDATE(), GETUTCDATE());
END
GO

-- 5. LEAVE TYPES
IF NOT EXISTS (SELECT 1 FROM leave_types WHERE id = 'lt111111-1111-1111-1111-111111111111')
BEGIN
    INSERT INTO leave_types (id, code, name, description, yearly_allotment, is_active, created_at, updated_at, is_deleted)
    VALUES ('lt111111-1111-1111-1111-111111111111', 'LT-PAID', 'Paid Leave', 'Earned annual paid time off', 18, 1, GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM leave_types WHERE id = 'lt222222-2222-2222-2222-222222222222')
BEGIN
    INSERT INTO leave_types (id, code, name, description, yearly_allotment, is_active, created_at, updated_at, is_deleted)
    VALUES ('lt222222-2222-2222-2222-222222222222', 'LT-CASUAL', 'Casual Leave', 'Short notice leave for urgent personal matters', 12, 1, GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM leave_types WHERE id = 'lt333333-3333-3333-3333-333333333333')
BEGIN
    INSERT INTO leave_types (id, code, name, description, yearly_allotment, is_active, created_at, updated_at, is_deleted)
    VALUES ('lt333333-3333-3333-3333-333333333333', 'LT-SICK', 'Sick Leave', 'Medical leave for illness or appointments', 10, 1, GETUTCDATE(), GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM leave_types WHERE id = 'lt444444-4444-4444-4444-444444444444')
BEGIN
    INSERT INTO leave_types (id, code, name, description, yearly_allotment, is_active, created_at, updated_at, is_deleted)
    VALUES ('lt444444-4444-4444-4444-444444444444', 'LT-OPTIONAL', 'Optional Holiday', 'Festival or optional religious holiday', 3, 1, GETUTCDATE(), GETUTCDATE(), 0);
END
GO

-- 6. LEAVE BALANCES FOR 2026
-- For Rajesh Kumar (Emp-0003)
IF NOT EXISTS (SELECT 1 FROM leave_balances WHERE employee_id = 'e3000000-0000-0000-0000-000000000003' AND year = 2026)
BEGIN
    INSERT INTO leave_balances (id, employee_id, leave_type_id, year, allocated_days, used_days, remaining_days, created_at, updated_at)
    VALUES
    ('lb31-2026', 'e3000000-0000-0000-0000-000000000003', 'lt111111-1111-1111-1111-111111111111', 2026, 18, 3, 15, GETUTCDATE(), GETUTCDATE()),
    ('lb32-2026', 'e3000000-0000-0000-0000-000000000003', 'lt222222-2222-2222-2222-222222222222', 2026, 12, 1, 11, GETUTCDATE(), GETUTCDATE()),
    ('lb33-2026', 'e3000000-0000-0000-0000-000000000003', 'lt333333-3333-3333-3333-333333333333', 2026, 10, 0, 10, GETUTCDATE(), GETUTCDATE()),
    ('lb34-2026', 'e3000000-0000-0000-0000-000000000003', 'lt444444-4444-4444-4444-444444444444', 2026, 3, 0, 3, GETUTCDATE(), GETUTCDATE());
END

-- For Ananya Rao (Emp-0004)
IF NOT EXISTS (SELECT 1 FROM leave_balances WHERE employee_id = 'e4000000-0000-0000-0000-000000000004' AND year = 2026)
BEGIN
    INSERT INTO leave_balances (id, employee_id, leave_type_id, year, allocated_days, used_days, remaining_days, created_at, updated_at)
    VALUES
    ('lb41-2026', 'e4000000-0000-0000-0000-000000000004', 'lt111111-1111-1111-1111-111111111111', 2026, 18, 2, 16, GETUTCDATE(), GETUTCDATE()),
    ('lb42-2026', 'e4000000-0000-0000-0000-000000000004', 'lt222222-2222-2222-2222-222222222222', 2026, 12, 0, 12, GETUTCDATE(), GETUTCDATE()),
    ('lb43-2026', 'e4000000-0000-0000-0000-000000000004', 'lt333333-3333-3333-3333-333333333333', 2026, 10, 1, 9, GETUTCDATE(), GETUTCDATE()),
    ('lb44-2026', 'e4000000-0000-0000-0000-000000000004', 'lt444444-4444-4444-4444-444444444444', 2026, 3, 0, 3, GETUTCDATE(), GETUTCDATE());
END
GO

-- 7. ATTENDANCE SEED DATA (SAMPLE RECENT DAYS)
IF NOT EXISTS (SELECT 1 FROM attendance WHERE employee_id = 'e3000000-0000-0000-0000-000000000003' AND date = CAST(GETUTCDATE() AS DATE))
BEGIN
    INSERT INTO attendance (id, employee_id, date, check_in, check_out, status, working_hours, notes, created_at, updated_at)
    VALUES
    ('att-101', 'e3000000-0000-0000-0000-000000000003', CAST(GETUTCDATE() AS DATE), '09:05:00', '18:15:00', 'PRESENT', 9.16, 'Regular full day', GETUTCDATE(), GETUTCDATE()),
    ('att-102', 'e4000000-0000-0000-0000-000000000004', CAST(GETUTCDATE() AS DATE), '09:35:00', '18:30:00', 'LATE', 8.91, 'Traffic delay on ORR', GETUTCDATE(), GETUTCDATE()),
    ('att-103', 'e1000000-0000-0000-0000-000000000001', CAST(GETUTCDATE() AS DATE), '08:55:00', '17:55:00', 'PRESENT', 9.00, 'HR Office', GETUTCDATE(), GETUTCDATE()),
    ('att-104', 'e2000000-0000-0000-0000-000000000002', CAST(GETUTCDATE() AS DATE), '09:00:00', '18:00:00', 'PRESENT', 9.00, 'HR Operations', GETUTCDATE(), GETUTCDATE());
END
GO

-- 8. SALARY STRUCTURES
IF NOT EXISTS (SELECT 1 FROM salary_structures WHERE employee_id = 'e3000000-0000-0000-0000-000000000003')
BEGIN
    INSERT INTO salary_structures (
        id, employee_id, basic_salary, hra, conveyance_allowance, medical_allowance,
        special_allowance, pf_deduction, tax_deduction, other_deductions, gross_salary,
        net_salary, effective_date, created_at, updated_at
    ) VALUES (
        'sal-301', 'e3000000-0000-0000-0000-000000000003', 60000.00, 30000.00, 5000.00,
        3000.00, 12000.00, 7200.00, 8000.00, 800.00, 110000.00, 94000.00, '2026-01-01',
        GETUTCDATE(), GETUTCDATE()
    );
END

IF NOT EXISTS (SELECT 1 FROM salary_structures WHERE employee_id = 'e4000000-0000-0000-0000-000000000004')
BEGIN
    INSERT INTO salary_structures (
        id, employee_id, basic_salary, hra, conveyance_allowance, medical_allowance,
        special_allowance, pf_deduction, tax_deduction, other_deductions, gross_salary,
        net_salary, effective_date, created_at, updated_at
    ) VALUES (
        'sal-401', 'e4000000-0000-0000-0000-000000000004', 45000.00, 22500.00, 4000.00,
        2500.00, 8000.00, 5400.00, 4500.00, 600.00, 82000.00, 71500.00, '2026-01-01',
        GETUTCDATE(), GETUTCDATE()
    );
END

IF NOT EXISTS (SELECT 1 FROM salary_structures WHERE employee_id = 'e1000000-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO salary_structures (
        id, employee_id, basic_salary, hra, conveyance_allowance, medical_allowance,
        special_allowance, pf_deduction, tax_deduction, other_deductions, gross_salary,
        net_salary, effective_date, created_at, updated_at
    ) VALUES (
        'sal-101', 'e1000000-0000-0000-0000-000000000001', 80000.00, 40000.00, 6000.00,
        4000.00, 20000.00, 9600.00, 15000.00, 1400.00, 150000.00, 124000.00, '2026-01-01',
        GETUTCDATE(), GETUTCDATE()
    );
END
GO

-- 9. PAYROLL PERIODS & SAMPLE PAYROLL RECORDS
IF NOT EXISTS (SELECT 1 FROM payroll_periods WHERE month = 9 AND year = 2026)
BEGIN
    INSERT INTO payroll_periods (id, period_name, month, year, start_date, end_date, is_processed, processed_at, created_at)
    VALUES ('pp-2026-09', 'September 2026', 9, 2026, '2026-09-01', '2026-09-30', 1, '2026-09-30 18:00:00', GETUTCDATE());

    INSERT INTO payroll_records (
        id, payroll_period_id, employee_id, basic_salary, hra, allowances, deductions,
        net_salary, payment_status, payment_date, payslip_number, created_at, updated_at
    ) VALUES
    ('pr-301-09', 'pp-2026-09', 'e3000000-0000-0000-0000-000000000003', 60000.00, 30000.00, 20000.00, 16000.00, 94000.00, 'PAID', '2026-09-30', 'PAY-2026-09-003', GETUTCDATE(), GETUTCDATE()),
    ('pr-401-09', 'pp-2026-09', 'e4000000-0000-0000-0000-000000000004', 45000.00, 22500.00, 14500.00, 10500.00, 71500.00, 'PAID', '2026-09-30', 'PAY-2026-09-004', GETUTCDATE(), GETUTCDATE());
END
GO

-- 10. RECRUITMENT (JOB OPENINGS & CANDIDATES)
IF NOT EXISTS (SELECT 1 FROM job_openings WHERE id = 'job-101')
BEGIN
    INSERT INTO job_openings (id, title, department_id, designation_id, description, requirements, openings_count, status, posted_date, created_at, updated_at, is_deleted)
    VALUES (
        'job-101', 'Senior Backend Engineer (Python/FastAPI)', 'd1111111-1111-1111-1111-111111111111',
        'ds222222-2222-2222-2222-222222222222', 'Lead design and development of enterprise scalable microservices.',
        '5+ years Python, FastAPI/SQLAlchemy, SQL Server or PostgreSQL, Docker, Azure.', 2, 'OPEN',
        '2026-09-15', GETUTCDATE(), GETUTCDATE(), 0
    );

    INSERT INTO job_openings (id, title, department_id, designation_id, description, requirements, openings_count, status, posted_date, created_at, updated_at, is_deleted)
    VALUES (
        'job-102', 'HR Business Partner', 'd2222222-2222-2222-2222-222222222222',
        'ds444444-4444-4444-4444-444444444444', 'Drive talent acquisition, employee engagement, and statutory compliance.',
        '3+ years in Tech HR, strong communication and payroll operations experience.', 1, 'OPEN',
        '2026-09-20', GETUTCDATE(), GETUTCDATE(), 0
    );

    -- Candidates
    INSERT INTO candidates (id, job_opening_id, first_name, last_name, email, phone, status, experience_years, expected_salary, interview_date, interview_notes, created_at, updated_at, is_deleted)
    VALUES
    ('cand-201', 'job-101', 'Amit', 'Verma', 'amit.verma@example.com', '+91 99887 76655', 'INTERVIEW', 5.5, 2400000.00, '2026-10-10 14:00:00', 'Strong backend architecture knowledge; good system design.', GETUTCDATE(), GETUTCDATE(), 0),
    ('cand-202', 'job-101', 'Deepika', 'Nair', 'deepika.nair@example.com', '+91 98776 65544', 'SELECTED', 6.0, 2600000.00, '2026-10-04 11:00:00', 'Cleared technical and leadership rounds with distinction.', GETUTCDATE(), GETUTCDATE(), 0),
    ('cand-203', 'job-102', 'Rohan', 'Gupta', 'rohan.gupta@example.com', '+91 97665 54433', 'SCREENING', 4.0, 1400000.00, NULL, 'Resume shortlisted for initial HR screen.', GETUTCDATE(), GETUTCDATE(), 0);
END
GO

-- 11. PERFORMANCE CYCLES & GOALS
IF NOT EXISTS (SELECT 1 FROM performance_cycles WHERE id = 'pc-2026-h2')
BEGIN
    INSERT INTO performance_cycles (id, title, start_date, end_date, status, created_at)
    VALUES ('pc-2026-h2', '2026 H2 Enterprise Performance Review', '2026-07-01', '2026-12-31', 'ACTIVE', GETUTCDATE());

    INSERT INTO performance_goals (id, performance_cycle_id, employee_id, title, description, target_date, progress, status, created_at, updated_at)
    VALUES
    ('goal-301', 'pc-2026-h2', 'e3000000-0000-0000-0000-000000000003', 'Deliver Microservice V2 API Migration', 'Migrate core monolithic handlers to async FastAPI architecture.', '2026-11-15', 75, 'IN_PROGRESS', GETUTCDATE(), GETUTCDATE()),
    ('goal-302', 'pc-2026-h2', 'e3000000-0000-0000-0000-000000000003', 'Improve DB Query Response Times (<50ms)', 'Optimize SQL Server indexes and eliminate N+1 queries.', '2026-12-01', 90, 'IN_PROGRESS', GETUTCDATE(), GETUTCDATE()),
    ('goal-401', 'pc-2026-h2', 'e4000000-0000-0000-0000-000000000004', 'Build Unified Design System in React', 'Implement reusable UI components and accessibility compliance.', '2026-11-30', 80, 'IN_PROGRESS', GETUTCDATE(), GETUTCDATE());

    INSERT INTO performance_reviews (id, performance_cycle_id, employee_id, reviewer_id, self_rating, reviewer_rating, self_feedback, reviewer_feedback, status, created_at, updated_at)
    VALUES (
        'rev-301', 'pc-2026-h2', 'e3000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001',
        4, 5, 'Consistently delivered sprint objectives and mentored junior engineers.',
        'Outstanding leadership and technical contribution across all key projects.', 'SUBMITTED',
        GETUTCDATE(), GETUTCDATE()
    );
END
GO

-- 12. COMPANY SETTINGS
IF NOT EXISTS (SELECT 1 FROM company_settings WHERE id = 'default-settings')
BEGIN
    INSERT INTO company_settings (
        id, company_name, company_email, company_phone, company_address, timezone,
        currency, fiscal_year_start, attendance_grace_period_mins, standard_working_hours, updated_at
    ) VALUES (
        'default-settings', 'SHIVMANI ENTERPRISES', 'hr@shivmanienterprises.com',
        '+91 80 4567 8900', 'Tower B, Tech Park, Whitefield, Bengaluru - 560066',
        'Asia/Kolkata', 'INR', 'April', 15, 8.00, GETUTCDATE()
    );
END
GO

-- 13. AUDIT LOGS
IF NOT EXISTS (SELECT 1 FROM audit_logs WHERE id = 'audit-001')
BEGIN
    INSERT INTO audit_logs (id, actor_id, actor_name, action, entity, entity_id, details, ip_address, timestamp)
    VALUES
    ('audit-001', 'e1000000-0000-0000-0000-000000000001', 'Neha Mishra', 'SYSTEM_INIT', 'System', 'SYSTEM', 'Initialized SHIVMANI HRMS enterprise database with default configuration and seed data.', '127.0.0.1', GETUTCDATE()),
    ('audit-002', 'e1000000-0000-0000-0000-000000000001', 'Neha Mishra', 'LOGIN', 'User', 'u1000000-0000-0000-0000-000000000001', 'HR Admin logged in successfully.', '127.0.0.1', GETUTCDATE());
END
GO
