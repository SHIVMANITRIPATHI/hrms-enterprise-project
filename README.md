# SHIVMANI HRMS — Enterprise Human Resource Management System

A production-grade Enterprise HRMS built with high aesthetic standards, enterprise-grade architecture, and robust reliability.

---

## 🏛️ System Architecture

```text
hrms-enterprise-project/
├── docker-compose.yml           # Multi-service setup (SQL Server + FastAPI backend)
├── README.md                    # System documentation
├── database/
│   ├── migrations/
│   │   └── 001_init_schema.sql  # SQL Server DDL with constraints, indexes & temporal columns
│   └── seeds/
│       └── 002_mock_data.sql    # Seed data (Departments, Designations, Employees, Leaves)
├── devops/
│   ├── azure-pipelines.yml      # CI/CD pipeline definition
│   └── scripts/
│       └── start-dev.sh         # Development automation script
├── backend/
│   ├── Dockerfile               # Python 3.12-slim container with non-root security
│   ├── requirements.txt         # FastAPI, SQLAlchemy 2.x async, aiomssql, Pydantic v2
│   ├── .env.example             # Backend environment template
│   └── app/
│       ├── config.py            # pydantic-settings configuration loader
│       ├── database.py          # SQLAlchemy async session management & DB lifecycle
│       ├── main.py              # FastAPI application, CORS, lifespan & error handlers
│       ├── models/              # SQLAlchemy 2.x ORM models
│       ├── schemas/             # Pydantic v2 validation schemas
│       └── routers/             # REST endpoints (/employees, /leaves, /health)
└── frontend/
    ├── index.html               # Vite HTML entry
    ├── vite.config.ts           # Vite + React configuration with '@/' path alias
    ├── tailwind.config.js       # Enterprise slate & brand blue palette
    ├── postcss.config.js        # PostCSS configuration
    └── src/
        ├── App.tsx              # Application root with dynamic routing & sensitive data masking
        ├── components/
        │   ├── ui/              # Button, Card, Modal, Input, Select, StatusBadge, Avatar, Tabs, etc.
        │   └── shared/          # Enterprise Sidebar & Header with notification/profile menus
        ├── features/
        │   ├── dashboard/       # Workforce KPI cards, recent joiners, quick actions, pending approvals
        │   ├── directory/       # Employee directory with search, filters, CRUD modals, pagination
        │   ├── leave/           # Leave balances, request submissions, approval/rejection workflows
        │   └── profile/         # 3-tab profile with sensitive data masking toggle
        ├── services/            # Typed API client with automatic mock fallback
        ├── types/               # TypeScript interfaces matching backend models
        ├── utils/               # Formatters (dates, currency, masking) and validators
        ├── hooks/               # Custom reusable React hooks (useDebounce)
        └── routes/              # Navigation route definitions
```

---

## 🚀 Key Features

1. **Workforce Analytics Dashboard**:
   - Real-time headcount, on-leave count, attendance rate, and pending approval metrics.
   - Quick action shortcuts for employee creation, leave applications, and policy reviews.
   - Recent joiners timeline and urgent approval queue.

2. **Employee Directory & Lifecycle Management**:
   - Advanced multi-filter search (by department, designation, employment type, employment status).
   - Full CRUD operations with modal forms, real-time client validation, and soft-deletion.
   - Comprehensive employee cards with avatar generator and status badges.

3. **Leave Management & Approval Workflows**:
   - Real-time balance cards showing allocated, used, and remaining days with visual progress bars.
   - Leave application modal with live working days calculation and date validations.
   - Supervisor action panel for 1-click approvals and rejections with reason capture.
   - Leave cancellation workflow with automated balance rollback.

4. **Executive Profile & Data Privacy**:
   - Tabbed view: Personal details, Employment metadata, Statutory & Banking information.
   - One-click sensitive data masking (Bank account numbers, PAN cards, Salary) across the UI.

5. **Fault-Tolerant Resilience (Mock Fallback)**:
   - If the backend is running and connected to SQL Server, the app uses live REST endpoints.
   - If the backend is unreachable, the frontend automatically falls back to an in-memory mutable typed mock store, ensuring 100% demo uptime.

---

## 🛠️ Quick Start

### 1. Start SQL Server & Backend via Docker

```bash
# Start SQL Server and Backend
docker compose up -d
```

Or run SQL Server locally and execute migrations:
- `database/migrations/001_init_schema.sql`
- `database/seeds/002_mock_data.sql`

### 2. Run Backend Locally (Alternative)

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Unix:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

### 3. Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

The web application will be accessible at `http://localhost:5173`.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_NAME` | Name of the application | `SHIVMANI HRMS` |
| `ENVIRONMENT` | Environment type | `development` |
| `DATABASE_URL` | SQLAlchemy async connection string | `mssql+aiomssql://sa:Enter%40123@127.0.0.1:1433/hrms_db` |
| `CORS_ORIGINS` | Allowed CORS origins JSON list | `["http://localhost:5173","http://127.0.0.1:5173"]` |

### Frontend (`frontend/.env.local`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for REST API | `http://localhost:8000/api` |

---

## 🧪 Testing & Verification

- **Frontend Production Build**: Run `npm run build` in `frontend/` (validates TypeScript compilation and bundles assets via Vite).
- **Backend Type & Route Validation**: All schemas use Pydantic V2 classmethods and FastAPI dependency injection for session safety.

________________________________________________________________________________


-------------------------------------------------------------------------
-------------------------------------------------------------------------
# 🏛️ Enterprise HRMS (Scale-Ready Layout)

An asynchronous, scale-ready Human Resource Management System tailored for small scale enterprises (20-30 employees), running on an isolated local container grid and engineered for flawless deployment to the **Azure Free Tier Cloud** ecosystem.

## 🧱 Cloud Infrastructure Topography
- **Database Wrapper:** Azure SQL Database (Serverless / Free Offer Tier)
- **Application Engine:** Azure App Service (Linux Web App for Containers - F1 Free Compute)
- **Deployment Mechanics:** Azure DevOps Multi-Stage Pipelines (`devops/azure-pipelines.yml`)
- **Staging Pipeline Intermediary:** Azure Storage Blob (HTTPS Staging for `.bacpac` updates)

## 🔄 Dynamic Context Configuration Matrix
The system switches between local mock processing and production cloud environments using run-time variables without requiring modification to internal API source components.

### 💻 Local Run Mode
Backend containers query a local isolated SQL Server container image using:
`DATABASE_URL=mssql+pyodbc://sa:YourStrongEnterprisePassword123!@sqlserver:1433/hrms_db?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no`

### ☁️ Production Run Mode
Azure App Service intercepts the execution layer and streams queries via protected parameters to your personal Azure SQL instance over encrypted sockets:
`DATABASE_URL=mssql+aioodbc://dbadmin:<secret>@sqlserver-hrms-free.database.windows.net:1433/sqldb-hrms-production?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes`
