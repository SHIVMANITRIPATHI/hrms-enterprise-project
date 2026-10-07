-- SHIVMANI HRMS Database Migration
-- Target Engine: Microsoft SQL Server

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'hrms_db')
BEGIN
    CREATE DATABASE hrms_db;
END
GO

USE hrms_db;
GO

-- 1. DEPARTMENTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'departments')
BEGIN
    CREATE TABLE departments (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        is_deleted BIT NOT NULL DEFAULT 0
    );
END
GO

-- 2. DESIGNATIONS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'designations')
BEGIN
    CREATE TABLE designations (
        id VARCHAR(36) PRIMARY KEY,
        department_id VARCHAR(36) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        is_deleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_designations_department FOREIGN KEY (department_id) REFERENCES departments(id)
    );
END
GO

-- 3. EMPLOYEES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'employees')
BEGIN
    CREATE TABLE employees (
        id VARCHAR(36) PRIMARY KEY,
        employee_code VARCHAR(20) NOT NULL UNIQUE,
        first_name NVARCHAR(50) NOT NULL,
        last_name NVARCHAR(50) NOT NULL,
        email NVARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(20) NOT NULL DEFAULT 'OTHER',
        date_of_joining DATE NOT NULL,
        employment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        employment_type VARCHAR(20) NOT NULL DEFAULT 'FULL_TIME',
        department_id VARCHAR(36) NOT NULL,
        designation_id VARCHAR(36) NOT NULL,
        manager_id VARCHAR(36) NULL,
        address NVARCHAR(255) NULL,
        city NVARCHAR(50) NULL,
        state NVARCHAR(50) NULL,
        postal_code VARCHAR(15) NULL,
        country NVARCHAR(50) NULL DEFAULT 'India',
        emergency_contact_name NVARCHAR(100) NULL,
        emergency_contact_phone VARCHAR(20) NULL,
        bank_name NVARCHAR(100) NULL,
        account_number VARCHAR(30) NULL,
        ifsc_code VARCHAR(20) NULL,
        pan_number VARCHAR(15) NULL,
        uan_number VARCHAR(20) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        is_deleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_employees_department FOREIGN KEY (department_id) REFERENCES departments(id),
        CONSTRAINT FK_employees_designation FOREIGN KEY (designation_id) REFERENCES designations(id),
        CONSTRAINT FK_employees_manager FOREIGN KEY (manager_id) REFERENCES employees(id)
    );
END
GO

-- 4. USERS / AUTHENTICATION TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL UNIQUE,
        employee_code VARCHAR(20) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
        is_active BIT NOT NULL DEFAULT 1,
        must_change_password BIT NOT NULL DEFAULT 0,
        last_login_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
END
GO

-- 5. PASSWORD RESET TOKENS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_reset_tokens')
BEGIN
    CREATE TABLE password_reset_tokens (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(100) NOT NULL UNIQUE,
        expires_at DATETIME2 NOT NULL,
        is_used BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
END
GO

-- 6. LEAVE TYPES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'leave_types')
BEGIN
    CREATE TABLE leave_types (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL,
        yearly_allotment INT NOT NULL DEFAULT 12,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        is_deleted BIT NOT NULL DEFAULT 0
    );
END
GO

-- 7. LEAVE BALANCES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'leave_balances')
BEGIN
    CREATE TABLE leave_balances (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        leave_type_id VARCHAR(36) NOT NULL,
        year INT NOT NULL,
        allocated_days INT NOT NULL,
        used_days INT NOT NULL DEFAULT 0,
        remaining_days INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_leave_balances_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT FK_leave_balances_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
        CONSTRAINT UQ_employee_leave_year UNIQUE (employee_id, leave_type_id, year)
    );
END
GO

-- 8. LEAVE REQUESTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'leave_requests')
BEGIN
    CREATE TABLE leave_requests (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        leave_type_id VARCHAR(36) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INT NOT NULL,
        reason NVARCHAR(500) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        approved_at DATETIME2 NULL,
        rejected_at DATETIME2 NULL,
        cancelled_at DATETIME2 NULL,
        rejection_reason NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        is_deleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_leave_requests_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT FK_leave_requests_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
    );
END
GO

-- 9. ATTENDANCE TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'attendance')
BEGIN
    CREATE TABLE attendance (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        check_in TIME NULL,
        check_out TIME NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
        working_hours DECIMAL(4, 2) NOT NULL DEFAULT 0.0,
        notes NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT UQ_employee_attendance_date UNIQUE (employee_id, date)
    );
END
GO

-- 10. SALARY STRUCTURES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'salary_structures')
BEGIN
    CREATE TABLE salary_structures (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL UNIQUE,
        basic_salary DECIMAL(12, 2) NOT NULL,
        hra DECIMAL(12, 2) NOT NULL DEFAULT 0,
        conveyance_allowance DECIMAL(12, 2) NOT NULL DEFAULT 0,
        medical_allowance DECIMAL(12, 2) NOT NULL DEFAULT 0,
        special_allowance DECIMAL(12, 2) NOT NULL DEFAULT 0,
        pf_deduction DECIMAL(12, 2) NOT NULL DEFAULT 0,
        tax_deduction DECIMAL(12, 2) NOT NULL DEFAULT 0,
        other_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,
        gross_salary DECIMAL(12, 2) NOT NULL,
        net_salary DECIMAL(12, 2) NOT NULL,
        effective_date DATE NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_salary_structures_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
END
GO

-- 11. PAYROLL PERIODS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'payroll_periods')
BEGIN
    CREATE TABLE payroll_periods (
        id VARCHAR(36) PRIMARY KEY,
        period_name NVARCHAR(100) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_processed BIT NOT NULL DEFAULT 0,
        processed_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_payroll_month_year UNIQUE (month, year)
    );
END
GO

-- 12. PAYROLL RECORDS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'payroll_records')
BEGIN
    CREATE TABLE payroll_records (
        id VARCHAR(36) PRIMARY KEY,
        payroll_period_id VARCHAR(36) NOT NULL,
        employee_id VARCHAR(36) NOT NULL,
        basic_salary DECIMAL(12, 2) NOT NULL,
        hra DECIMAL(12, 2) NOT NULL DEFAULT 0,
        allowances DECIMAL(12, 2) NOT NULL DEFAULT 0,
        deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,
        net_salary DECIMAL(12, 2) NOT NULL,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'PROCESSED',
        payment_date DATE NULL,
        payslip_number VARCHAR(30) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_payroll_records_period FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id),
        CONSTRAINT FK_payroll_records_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT UQ_employee_period_payroll UNIQUE (payroll_period_id, employee_id)
    );
END
GO

-- 13. JOB OPENINGS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'job_openings')
BEGIN
    CREATE TABLE job_openings (
        id VARCHAR(36) PRIMARY KEY,
        title NVARCHAR(150) NOT NULL,
        department_id VARCHAR(36) NOT NULL,
        designation_id VARCHAR(36) NOT NULL,
        description NVARCHAR(MAX) NULL,
        requirements NVARCHAR(MAX) NULL,
        openings_count INT NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        posted_date DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        is_deleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_job_openings_department FOREIGN KEY (department_id) REFERENCES departments(id),
        CONSTRAINT FK_job_openings_designation FOREIGN KEY (designation_id) REFERENCES designations(id)
    );
END
GO

-- 14. CANDIDATES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'candidates')
BEGIN
    CREATE TABLE candidates (
        id VARCHAR(36) PRIMARY KEY,
        job_opening_id VARCHAR(36) NOT NULL,
        first_name NVARCHAR(50) NOT NULL,
        last_name NVARCHAR(50) NOT NULL,
        email NVARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        resume_url NVARCHAR(255) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'APPLIED',
        interview_date DATETIME2 NULL,
        interview_notes NVARCHAR(MAX) NULL,
        experience_years DECIMAL(3, 1) NOT NULL DEFAULT 0,
        expected_salary DECIMAL(12, 2) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        is_deleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_candidates_job_opening FOREIGN KEY (job_opening_id) REFERENCES job_openings(id)
    );
END
GO

-- 15. PERFORMANCE CYCLES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'performance_cycles')
BEGIN
    CREATE TABLE performance_cycles (
        id VARCHAR(36) PRIMARY KEY,
        title NVARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- 16. PERFORMANCE GOALS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'performance_goals')
BEGIN
    CREATE TABLE performance_goals (
        id VARCHAR(36) PRIMARY KEY,
        performance_cycle_id VARCHAR(36) NOT NULL,
        employee_id VARCHAR(36) NOT NULL,
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(500) NULL,
        target_date DATE NOT NULL,
        progress INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_goals_cycle FOREIGN KEY (performance_cycle_id) REFERENCES performance_cycles(id),
        CONSTRAINT FK_goals_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
END
GO

-- 17. PERFORMANCE REVIEWS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'performance_reviews')
BEGIN
    CREATE TABLE performance_reviews (
        id VARCHAR(36) PRIMARY KEY,
        performance_cycle_id VARCHAR(36) NOT NULL,
        employee_id VARCHAR(36) NOT NULL,
        reviewer_id VARCHAR(36) NOT NULL,
        self_rating INT NULL,
        reviewer_rating INT NULL,
        self_feedback NVARCHAR(MAX) NULL,
        reviewer_feedback NVARCHAR(MAX) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_reviews_cycle FOREIGN KEY (performance_cycle_id) REFERENCES performance_cycles(id),
        CONSTRAINT FK_reviews_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT FK_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES employees(id),
        CONSTRAINT UQ_review_employee_cycle UNIQUE (performance_cycle_id, employee_id)
    );
END
GO

-- 18. COMPANY SETTINGS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'company_settings')
BEGIN
    CREATE TABLE company_settings (
        id VARCHAR(36) PRIMARY KEY,
        company_name NVARCHAR(100) NOT NULL DEFAULT 'SHIVMANI ENTERPRISES',
        company_email NVARCHAR(100) NOT NULL DEFAULT 'hr@shivmanienterprises.com',
        company_phone VARCHAR(20) NOT NULL DEFAULT '+91 80 4567 8900',
        company_address NVARCHAR(255) NOT NULL DEFAULT 'Tower B, Tech Park, Whitefield, Bengaluru - 560066',
        timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        fiscal_year_start VARCHAR(20) NOT NULL DEFAULT 'April',
        attendance_grace_period_mins INT NOT NULL DEFAULT 15,
        standard_working_hours DECIMAL(4, 2) NOT NULL DEFAULT 8.0,
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- 19. AUDIT LOGS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        actor_id VARCHAR(36) NULL,
        actor_name NVARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        entity VARCHAR(50) NOT NULL,
        entity_id VARCHAR(36) NULL,
        details NVARCHAR(MAX) NULL,
        ip_address VARCHAR(50) NULL,
        timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- 20. EMPLOYEE DOCUMENTS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'employee_documents')
BEGIN
    CREATE TABLE employee_documents (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        title NVARCHAR(100) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        file_url NVARCHAR(255) NOT NULL,
        uploaded_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_documents_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
END
GO

-- INDEXES
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_employees_dept_desig')
BEGIN
    CREATE INDEX IX_employees_dept_desig ON employees(department_id, designation_id, is_deleted);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_attendance_date_emp')
BEGIN
    CREATE INDEX IX_attendance_date_emp ON attendance(date, employee_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_candidates_job')
BEGIN
    CREATE INDEX IX_candidates_job ON candidates(job_opening_id, status);
END
GO
