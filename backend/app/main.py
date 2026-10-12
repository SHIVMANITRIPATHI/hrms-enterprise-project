import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.config import settings
from app.database import init_db
from app.routers import (
    auth_router, employee_router, leave_router, attendance_router,
    payroll_router, recruitment_router, performance_router,
    reports_router, settings_router, audit_router
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("hrms.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} Backend Service v{settings.APP_VERSION}...")
    await init_db()
    yield
    logger.info(f"Shutting down {settings.APP_NAME} Backend Service...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.APP_VERSION,
    description="SHIVMANI HRMS — Enterprise Role-Based Human Resource Management System",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.error(f"Database Integrity Error: {str(exc.orig)}")
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Database conflict: A unique constraint or foreign key rule was violated."}
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database SQLAlchemy Error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal database error occurred. Please try again."}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error occurred."}
    )

# Register all Routers
app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(leave_router)
app.include_router(attendance_router)
app.include_router(payroll_router)
app.include_router(recruitment_router)
app.include_router(performance_router)
app.include_router(reports_router)
app.include_router(settings_router)
app.include_router(audit_router)

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "CONNECTED"
    }
