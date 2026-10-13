# SHIVMANI HRMS — Enterprise Human Resource Management System

A production-grade, scale-ready Enterprise Human Resource Management System engineered with high aesthetic standards, asynchronous API performance, robust database constraints, and end-to-end employee lifecycle automation.

---

## 📋 Executive Summary

SHIVMANI HRMS delivers an end-to-end digital HR operations platform designed for mid-to-enterprise organizations. The platform features an asynchronous Python backend, a high-performance React TypeScript frontend, and an enterprise SQL Server relational database architecture.

The system incorporates fault-tolerant API communication, role-based access control (RBAC), live attendance monitoring, dynamic leave approval workflows, payroll computation, recruitment tracking, and objective-based performance appraisals.

---

## 🏛️ System Architecture

```text
hrms-enterprise-project/
├── docker-compose.yml           # Multi-container orchestration (SQL Server + FastAPI backend)
├── README.md                    # Project documentation
├── database/
│   ├── migrations/
│   │   └── 001_init_schema.sql  # SQL Server relational schema DDL with constraints & indexes
│   └── seeds/
│       └── 002_mock_data.sql    # Idempotent master seed dataset (Departments, Employees, Leaves)
├── devops/
│   ├── azure-pipelines.yml      # Azure DevOps multi-stage CI/CD pipeline
│   └── scripts/
│       └── start-dev.sh         # Development automation script
├── backend/
│   ├── Dockerfile               # Production container image with security hardening
│   ├── requirements.txt         # FastAPI, SQLAlchemy 2.0 Async, Pydantic v2, PyODBC
│   ├── .env.example             # Backend environment configuration template
│   └── app/
│       ├── config.py            # Pydantic-settings environment parser
│       ├── database.py          # SQLAlchemy async engine, session pooling & lifecycle
│       ├── main.py              # Application factory, middleware, CORS & error handling
│       ├── models/              # SQLAlchemy 2.0 declarative ORM models
│       │   └── hrms_schema.py   # Normalized database schemas & relational mappings
│       ├── schemas/             # Pydantic v2 input/output validation models
│       └── routers/             # REST API domain routers
│           ├── auth.py          # Authentication, token generation & password reset
│           ├── employee.py      # Employee directory & CRUD operations
│           ├── attendance.py    # Daily clock-in/out & monthly attendance tracking
│           ├── leave.py         # Leave allotments, balances & approval workflows
│           ├── payroll.py       # Salary structures, payroll runs & payslip generation
│           ├── performance.py   # Appraisal cycles, OKRs & performance reviews
│           ├── recruitment.py   # Job openings, applicant tracking & pipeline
│           ├── reports.py       # Workforce metrics & operational report generation
│           ├── settings.py      # Company-wide policies & localization settings
│           └── audit.py         # Immutable system audit trail logs
└── frontend/
    ├── index.html               # Single Page Application entrypoint
    ├── vite.config.ts           # Vite build pipeline with absolute path aliases
    ├── tailwind.config.js       # Enterprise theme definitions & color palette
    ├── postcss.config.js        # PostCSS build configuration
    └── src/
        ├── App.tsx              # Router root with role authorization & UI shell
        ├── components/
        │   ├── ui/              # Reusable UI primitives (Button, Modal, Card, Badge, Input)
        │   └── shared/          # Navigation Header, Sidebar, and Profile dropdowns
        ├── features/            # Domain-driven feature modules
        │   ├── auth/            # Login, password reset & credential management
        │   ├── dashboard/       # Executive workforce KPI metrics & pending action queue
        │   ├── directory/       # Employee records, search, filters & CRUD forms
        │   ├── attendance/      # Clock-in widget, daily logs & status calendar
        │   ├── leave/           # Leave balances, request modal & manager approval desk
        │   ├── payroll/         # Compensation breakdown, salary slips & payroll periods
        │   ├── performance/     # Appraisal cycles, goals tracker & review forms
        │   ├── recruitment/     # Job board management & candidate pipeline stages
        │   ├── reports/         # Exportable organizational reports & charts
        │   ├── settings/        # Enterprise parameters, working hours & policy editor
        │   └── profile/         # Employee self-service profile with sensitive data masking
        ├── services/            # Typed API client with automatic mock fallback
        ├── types/               # TypeScript definitions matching backend data contracts
        ├── utils/               # Formatters (currency, dates, masking) & input validators
        └── hooks/               # Custom reusable React state & event hooks
```

---

## ⚡ Core Capabilities & Functional Modules

### 1. Authentication & Role-Based Access Control (RBAC)
- Token-based stateless authentication using secure cryptographic hashing.
- Role hierarchies: **HR Admin**, **Manager**, and **Employee** with granular page-level and API route guards.
- Secure self-service password reset workflow with temporary token expiration.

### 2. Workforce Executive Dashboard
- Real-time KPI summary: Active Headcount, Attendance Rate, Employees On Leave, and Pending Approvals.
- Quick action dispatchers for employee onboarding, leave submission, and payroll processing.
- Urgent supervisor action tray for immediate requisition approvals.

### 3. Employee Directory & Profile Management
- Multi-dimensional filtering by Department, Designation, Employment Status (Active, On Notice, Terminated), and Employment Type (Full Time, Contract, Intern).
- Complete CRUD operations with modal interfaces and instant validation.
- Executive profile view with sensitive data masking toggle (Bank Account, IFSC, PAN Number, Base Salary).

### 4. Attendance & Shift Monitoring
- Real-time daily Check-In and Check-Out logging.
- Automated working hours calculation and punctuality classification (Present, Late, Half Day, Absent, Holiday).
- Monthly attendance calendars with historical records inspection.

### 5. Leave Allotment & Approval Workflow
- Configurable leave types (Paid Leave, Casual Leave, Sick Leave, Optional Holidays).
- Automatic annual allotment tracking with dynamic calculation of used and remaining balance days.
- Two-way managerial action workflow: 1-click Approval or Rejection with mandatory reason capture.

### 6. Compensation, Salary Structures & Payroll
- Detailed compensation breakdown: Basic Salary, HRA, Conveyance, Medical, Special Allowances, PF, and Tax Deductions.
- Monthly payroll generation cycles with automated gross and net payout computation.
- Comprehensive payslip records with distinct payment status tracking.

### 7. Performance Management & Goal Tracking
- Periodic review cycles (Half-Yearly, Annual) linked to departmental targets.
- Goal setting, progress tracking (0% to 100%), and milestone target dates.
- Balanced appraisals featuring dual scoring: Employee Self-Rating and Reviewer Manager Rating.

### 8. Talent Acquisition & Recruitment Pipeline
- Job requisition creation with department association, openings counter, and requirements.
- Full candidate hiring funnel: Applied, Screening, Interview, Selected, Offered, Hired, and Rejected.
- Interview scheduling and evaluator feedback notes recording.

### 9. Enterprise Audit Logs & Company Settings
- System-wide immutable audit trail logging actor details, timestamps, IP addresses, and mutation details.
- Organization-wide configurations: Standard Working Hours, Grace Periods, Fiscal Year, and Timezone settings.

---

## 🛠️ Technology Stack

| Tier | Technologies / Libraries |
| :--- | :--- |
| **Frontend UI / Client** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Custom Responsive Components |
| **Backend Core / API** | Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Uvicorn, Passlib (Bcrypt) |
| **Database Engine** | Microsoft SQL Server 2022 / Azure SQL Database |
| **Database Drivers** | aioodbc, pyodbc, ODBC Driver 18 for SQL Server |
| **Container & Cloud** | Docker, Docker Compose, Azure App Services, Azure DevOps Pipelines |

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher with npm
- Docker Desktop or a running instance of Microsoft SQL Server

---

### Step 1: Database Initialization

#### Option A: Run via Docker Compose (Recommended)
```bash
docker compose up -d
```

#### Option B: Run on Azure SQL or Existing SQL Server
Execute the SQL files inside the `database/` directory in the following order:
1. `database/migrations/001_init_schema.sql` (Creates all tables, keys, and foreign constraints)
2. `database/seeds/002_mock_data.sql` (Inserts idempotent initial seed data and users)

---

### Step 2: Backend API Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - On Windows:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - On Linux / macOS:
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the environment configuration file:
   - Copy `.env.example` to `.env`
   - Adjust database connection parameters to point to your SQL instance.

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. Verify backend service:
   - Interactive Swagger API Documentation: Navigate to `/docs` on port 8000
   - ReDoc Specification: Navigate to `/redoc` on port 8000
   - Service Health Endpoint: Navigate to `/health` on port 8000

---

### Step 3: Frontend Web Application Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install client dependencies:
   ```bash
   npm install
   ```

3. Configure the environment configuration file:
   - Verify `.env.local` or create it with:
     ```env
     VITE_API_BASE_URL=http://localhost:8000/api
     ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. The web application will launch locally on port 5173.

---

## 🔐 Default Seed Credentials

The master database seed contains pre-configured test accounts across different operational roles:

| Employee Code | Employee Name | System Role | Assigned Department | Default Password |
| :---: | :---: | :---: | :---: | :---: |
| `Emp-0001` | Neha Mishra | HR Admin | Human Resources | ` |
| `Emp-0002` | Sangeeta Mishra | HR Operations | Human Resources |  |
| `Emp-0003` | Rajesh Kumar | Senior Engineer (Employee) | Engineering |  |
| `Emp-0004` | Ananya Rao | Frontend Engineer (Employee) | Engineering ||
| `Emp-0005` | Shivmani Sharma | VP of Engineering (HR Admin) | Engineering |  |

---

## ⚙️ Environment Configuration

### Backend Settings (`backend/.env`)

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `APP_NAME` | Display name of the enterprise instance | `SHIVMANI HRMS` |
| `ENVIRONMENT` | Runtime deployment stage | `development` or `production` |
| `DATABASE_URL` | SQLAlchemy connection string |  |
| `CORS_ORIGINS` | JSON-encoded array of allowed browser origins | `["http://localhost:5173", "http://127.0.0.1:5173"]` |
| `SECRET_KEY` | Symmetric key for session token signing | 64-character random hexadecimal string |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Lifetime of user authentication tokens | `1440` (24 hours) |

### Frontend Settings (`frontend/.env.local` / `frontend/.env.production`)

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Target base URL for backend API routers | `http://localhost:8000/api` |

---

## 🛡️ Enterprise Security & Data Governance

1. **Sensitive Data Masking**:
   - The user interface provides a centralized masking toggle to obscure Personally Identifiable Information (PII) including bank account numbers, IFSC codes, PAN details, and salary figures during presentations or public usage.

2. **Database Integrity & Foreign Key Safety**:
   - Every entity relationship is strictly enforced through SQL Server foreign key constraints and cascading soft-deletes (`is_deleted` flags) to ensure zero orphaned records.

3. **Stateless Resilient Client**:
   - In the event of network disruption or backend maintenance, the frontend features an in-memory typed fallback store so demonstration and review workflows remain uninterrupted.

4. **Immutable Audit Trails**:
   - Critical system transactions (Logins, Employee creations, Salary updates, Leave decisions) write persistent entries into the `audit_logs` table containing the timestamp, client IP, actor identity, and operation details.

---

## 📦 Production Build & Quality Verification

To validate both client and server components prior to production deployment:

```bash
# Validate frontend TypeScript compilation and bundle generation
cd frontend
npm run build

# Validate backend dependencies and syntax
cd ../backend
python -m py_compile app/main.py
```

---

## 📄 License & Intellectual Property

Copyright © 2026 SHIVMANI ENTERPRISES. All rights reserved.  
Built for enterprise internal human resource administration and operations.
