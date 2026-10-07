from typing import List, Dict, Any
from pydantic import BaseModel

class HeadcountMetric(BaseModel):
    total_employees: int
    active_employees: int
    inactive_employees: int
    full_time_count: int
    contract_count: int
    intern_count: int

class DepartmentDistribution(BaseModel):
    department_id: str
    department_name: str
    department_code: str
    headcount: int
    percentage: float

class AttendanceOverviewMetric(BaseModel):
    total_expected_today: int
    present_today: int
    late_today: int
    half_day_today: int
    on_leave_today: int
    absent_today: int
    attendance_rate: float

class LeaveUtilizationMetric(BaseModel):
    leave_type_name: str
    allocated_days: int
    used_days: int
    remaining_days: int
    utilization_rate: float

class PayrollExpenseMetric(BaseModel):
    total_monthly_gross: float
    total_monthly_net: float
    total_deductions: float
    avg_salary: float

class OverviewDashboardReport(BaseModel):
    headcount: HeadcountMetric
    department_distribution: List[DepartmentDistribution]
    attendance: AttendanceOverviewMetric
    leave_utilization: List[LeaveUtilizationMetric]
    payroll: PayrollExpenseMetric
    open_jobs_count: int
    total_candidates: int
    pending_approvals_count: int
