from app.routers.auth import router as auth_router
from app.routers.employee import router as employee_router
from app.routers.leave import router as leave_router
from app.routers.attendance import router as attendance_router
from app.routers.payroll import router as payroll_router
from app.routers.recruitment import router as recruitment_router
from app.routers.performance import router as performance_router
from app.routers.reports import router as reports_router
from app.routers.settings import router as settings_router
from app.routers.audit import router as audit_router

__all__ = [
    "auth_router",
    "employee_router",
    "leave_router",
    "attendance_router",
    "payroll_router",
    "recruitment_router",
    "performance_router",
    "reports_router",
    "settings_router",
    "audit_router"
]
