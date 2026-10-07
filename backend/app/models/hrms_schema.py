import uuid
from datetime import datetime, date, time
from typing import Optional, List
from sqlalchemy import (
    String, NVARCHAR, Integer, Numeric, Boolean, Date, Time, DateTime,
    ForeignKey, UniqueConstraint, Text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(NVARCHAR(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    designations: Mapped[List["Designation"]] = relationship("Designation", back_populates="department")
    employees: Mapped[List["Employee"]] = relationship("Employee", back_populates="department")
    job_openings: Mapped[List["JobOpening"]] = relationship("JobOpening", back_populates="department")

class Designation(Base):
    __tablename__ = "designations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    department_id: Mapped[str] = mapped_column(String(36), ForeignKey("departments.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(NVARCHAR(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    department: Mapped["Department"] = relationship("Department", back_populates="designations")
    employees: Mapped[List["Employee"]] = relationship("Employee", back_populates="designation")
    job_openings: Mapped[List["JobOpening"]] = relationship("JobOpening", back_populates="designation")

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    employee_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    first_name: Mapped[str] = mapped_column(NVARCHAR(50), nullable=False)
    last_name: Mapped[str] = mapped_column(NVARCHAR(50), nullable=False)
    email: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False, unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False, default="OTHER")
    date_of_joining: Mapped[date] = mapped_column(Date, nullable=False)
    employment_status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    employment_type: Mapped[str] = mapped_column(String(20), nullable=False, default="FULL_TIME")

    department_id: Mapped[str] = mapped_column(String(36), ForeignKey("departments.id"), nullable=False)
    designation_id: Mapped[str] = mapped_column(String(36), ForeignKey("designations.id"), nullable=False)
    manager_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("employees.id"), nullable=True)

    address: Mapped[Optional[str]] = mapped_column(NVARCHAR(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(NVARCHAR(50), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(NVARCHAR(50), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(NVARCHAR(50), nullable=True, default="India")

    emergency_contact_name: Mapped[Optional[str]] = mapped_column(NVARCHAR(100), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    bank_name: Mapped[Optional[str]] = mapped_column(NVARCHAR(100), nullable=True)
    account_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    ifsc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    pan_number: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    uan_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    department: Mapped["Department"] = relationship("Department", back_populates="employees")
    designation: Mapped["Designation"] = relationship("Designation", back_populates="employees")
    manager: Mapped[Optional["Employee"]] = relationship("Employee", remote_side=[id], back_populates="direct_reports")
    direct_reports: Mapped[List["Employee"]] = relationship("Employee", back_populates="manager")

    user: Mapped[Optional["User"]] = relationship("User", back_populates="employee", uselist=False)
    leave_balances: Mapped[List["LeaveBalance"]] = relationship("LeaveBalance", back_populates="employee")
    leave_requests: Mapped[List["LeaveRequest"]] = relationship("LeaveRequest", back_populates="employee")
    attendance_records: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="employee")
    salary_structure: Mapped[Optional["SalaryStructure"]] = relationship("SalaryStructure", back_populates="employee", uselist=False)
    payroll_records: Mapped[List["PayrollRecord"]] = relationship("PayrollRecord", back_populates="employee")
    goals: Mapped[List["PerformanceGoal"]] = relationship("PerformanceGoal", back_populates="employee")
    reviews: Mapped[List["PerformanceReview"]] = relationship("PerformanceReview", foreign_keys="[PerformanceReview.employee_id]", back_populates="employee")
    documents: Mapped[List["EmployeeDocument"]] = relationship("EmployeeDocument", back_populates="employee")

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False, unique=True)
    employee_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="EMPLOYEE")  # 'HR', 'EMPLOYEE'
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="user")
    reset_tokens: Mapped[List["PasswordResetToken"]] = relationship("PasswordResetToken", back_populates="user")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    token: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="reset_tokens")

class LeaveType(Base):
    __tablename__ = "leave_types"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(NVARCHAR(255), nullable=True)
    yearly_allotment: Mapped[int] = mapped_column(Integer, nullable=False, default=12)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    balances: Mapped[List["LeaveBalance"]] = relationship("LeaveBalance", back_populates="leave_type")
    requests: Mapped[List["LeaveRequest"]] = relationship("LeaveRequest", back_populates="leave_type")

class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False)
    leave_type_id: Mapped[str] = mapped_column(String(36), ForeignKey("leave_types.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    allocated_days: Mapped[int] = mapped_column(Integer, nullable=False)
    used_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    remaining_days: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type_id", "year", name="UQ_employee_leave_year"),
    )

    employee: Mapped["Employee"] = relationship("Employee", back_populates="leave_balances")
    leave_type: Mapped["LeaveType"] = relationship("LeaveType", back_populates="balances")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False)
    leave_type_id: Mapped[str] = mapped_column(String(36), ForeignKey("leave_types.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_days: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(NVARCHAR(500), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rejected_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(NVARCHAR(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="leave_requests")
    leave_type: Mapped["LeaveType"] = relationship("LeaveType", back_populates="requests")

class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    check_out: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PRESENT")  # PRESENT, ABSENT, LATE, HALF_DAY, LEAVE, HOLIDAY
    working_hours: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(NVARCHAR(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="UQ_employee_attendance_date"),
    )

    employee: Mapped["Employee"] = relationship("Employee", back_populates="attendance_records")

class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False, unique=True)
    basic_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    hra: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    conveyance_allowance: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    medical_allowance: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    special_allowance: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    pf_deduction: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    tax_deduction: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    other_deductions: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    gross_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    net_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="salary_structure")

class PayrollPeriod(Base):
    __tablename__ = "payroll_periods"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    period_name: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("month", "year", name="UQ_payroll_month_year"),
    )

    records: Mapped[List["PayrollRecord"]] = relationship("PayrollRecord", back_populates="period")

class PayrollRecord(Base):
    __tablename__ = "payroll_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    payroll_period_id: Mapped[str] = mapped_column(String(36), ForeignKey("payroll_periods.id"), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False)
    basic_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    hra: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    allowances: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    deductions: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    net_salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), nullable=False, default="PROCESSED")  # PAID, PENDING, PROCESSED
    payment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    payslip_number: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("payroll_period_id", "employee_id", name="UQ_employee_period_payroll"),
    )

    period: Mapped["PayrollPeriod"] = relationship("PayrollPeriod", back_populates="records")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="payroll_records")

class JobOpening(Base):
    __tablename__ = "job_openings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(NVARCHAR(150), nullable=False)
    department_id: Mapped[str] = mapped_column(String(36), ForeignKey("departments.id"), nullable=False)
    designation_id: Mapped[str] = mapped_column(String(36), ForeignKey("designations.id"), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    openings_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="OPEN")  # OPEN, CLOSED, DRAFT
    posted_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    department: Mapped["Department"] = relationship("Department", back_populates="job_openings")
    designation: Mapped["Designation"] = relationship("Designation", back_populates="job_openings")
    candidates: Mapped[List["Candidate"]] = relationship("Candidate", back_populates="job_opening")

class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    job_opening_id: Mapped[str] = mapped_column(String(36), ForeignKey("job_openings.id"), nullable=False)
    first_name: Mapped[str] = mapped_column(NVARCHAR(50), nullable=False)
    last_name: Mapped[str] = mapped_column(NVARCHAR(50), nullable=False)
    email: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    resume_url: Mapped[Optional[str]] = mapped_column(NVARCHAR(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="APPLIED")  # APPLIED, SCREENING, INTERVIEW, SELECTED, OFFERED, HIRED, REJECTED
    interview_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    interview_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    experience_years: Mapped[float] = mapped_column(Numeric(3, 1), default=0.0, nullable=False)
    expected_salary: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    job_opening: Mapped["JobOpening"] = relationship("JobOpening", back_populates="candidates")

class PerformanceCycle(Base):
    __tablename__ = "performance_cycles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, CLOSED, DRAFT
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    goals: Mapped[List["PerformanceGoal"]] = relationship("PerformanceGoal", back_populates="cycle")
    reviews: Mapped[List["PerformanceReview"]] = relationship("PerformanceReview", back_populates="cycle")

class PerformanceGoal(Base):
    __tablename__ = "performance_goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    performance_cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("performance_cycles.id"), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False)
    title: Mapped[str] = mapped_column(NVARCHAR(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(NVARCHAR(500), nullable=True)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0 to 100
    status: Mapped[str] = mapped_column(String(20), default="IN_PROGRESS", nullable=False)  # NOT_STARTED, IN_PROGRESS, COMPLETED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    cycle: Mapped["PerformanceCycle"] = relationship("PerformanceCycle", back_populates="goals")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="goals")

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    performance_cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("performance_cycles.id"), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False)
    reviewer_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False)
    self_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5
    reviewer_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5
    self_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewer_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)  # PENDING, SUBMITTED, COMPLETED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("performance_cycle_id", "employee_id", name="UQ_review_employee_cycle"),
    )

    cycle: Mapped["PerformanceCycle"] = relationship("PerformanceCycle", back_populates="reviews")
    employee: Mapped["Employee"] = relationship("Employee", foreign_keys=[employee_id], back_populates="reviews")
    reviewer: Mapped["Employee"] = relationship("Employee", foreign_keys=[reviewer_id])

class CompanySetting(Base):
    __tablename__ = "company_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default="default-settings")
    company_name: Mapped[str] = mapped_column(NVARCHAR(100), default="SHIVMANI ENTERPRISES", nullable=False)
    company_email: Mapped[str] = mapped_column(NVARCHAR(100), default="hr@shivmanienterprises.com", nullable=False)
    company_phone: Mapped[str] = mapped_column(String(20), default="+91 80 4567 8900", nullable=False)
    company_address: Mapped[str] = mapped_column(NVARCHAR(255), default="Tower B, Tech Park, Whitefield, Bengaluru - 560066", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata", nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    fiscal_year_start: Mapped[str] = mapped_column(String(20), default="April", nullable=False)
    attendance_grace_period_mins: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    standard_working_hours: Mapped[float] = mapped_column(Numeric(4, 2), default=8.0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    actor_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    actor_name: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    entity: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False)
    title: Mapped[str] = mapped_column(NVARCHAR(100), nullable=False)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)  # IDENTITY, ACADEMIC, OFFER_LETTER, PAYSLIP, RELIEVING_LETTER, OTHER
    file_url: Mapped[str] = mapped_column(NVARCHAR(255), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="documents")
