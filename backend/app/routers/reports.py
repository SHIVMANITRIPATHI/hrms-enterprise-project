from datetime import date
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Employee, Department, Attendance, LeaveBalance, LeaveType,
    LeaveRequest, SalaryStructure, JobOpening, Candidate, User
)
from app.schemas import (
    HeadcountMetric, DepartmentDistribution, AttendanceOverviewMetric,
    LeaveUtilizationMetric, PayrollExpenseMetric, OverviewDashboardReport
)
from app.auth_utils import require_hr

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/overview", response_model=OverviewDashboardReport)
async def get_overview_report(
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    # 1. Headcount Metrics
    emp_stmt = select(Employee).where(Employee.is_deleted == False)
    emp_res = await db.execute(emp_stmt)
    all_employees = emp_res.scalars().all()

    total_emp = len(all_employees)
    active_emp = sum(1 for e in all_employees if e.employment_status == "ACTIVE")
    inactive_emp = total_emp - active_emp
    full_time = sum(1 for e in all_employees if e.employment_type == "FULL_TIME")
    contract = sum(1 for e in all_employees if e.employment_type == "CONTRACT")
    intern = sum(1 for e in all_employees if e.employment_type == "INTERN")

    headcount_data = HeadcountMetric(
        total_employees=total_emp,
        active_employees=active_emp,
        inactive_employees=inactive_emp,
        full_time_count=full_time,
        contract_count=contract,
        intern_count=intern
    )

    # 2. Department Distribution
    dept_stmt = select(Department).where(Department.is_deleted == False)
    dept_res = await db.execute(dept_stmt)
    all_depts = dept_res.scalars().all()

    dept_dist = []
    for d in all_depts:
        count = sum(1 for e in all_employees if e.department_id == d.id)
        pct = round((count / max(1, total_emp)) * 100, 1)
        dept_dist.append(DepartmentDistribution(
            department_id=d.id,
            department_name=d.name,
            department_code=d.code,
            headcount=count,
            percentage=pct
        ))

    # 3. Today's Attendance
    today = date.today()
    att_stmt = select(Attendance).where(Attendance.date == today)
    att_res = await db.execute(att_stmt)
    today_att = att_res.scalars().all()

    present_c = sum(1 for a in today_att if a.status in ["PRESENT", "LATE"])
    late_c = sum(1 for a in today_att if a.status == "LATE")
    half_c = sum(1 for a in today_att if a.status == "HALF_DAY")
    leave_c = sum(1 for a in today_att if a.status == "LEAVE")
    absent_c = sum(1 for a in today_att if a.status == "ABSENT")
    unaccounted = max(0, active_emp - len(today_att))
    total_absent = absent_c + unaccounted
    att_rate = round((present_c / max(1, active_emp)) * 100, 1)

    attendance_data = AttendanceOverviewMetric(
        total_expected_today=active_emp,
        present_today=present_c,
        late_today=late_c,
        half_day_today=half_c,
        on_leave_today=leave_c,
        absent_today=total_absent,
        attendance_rate=att_rate
    )

    # 4. Leave Utilization
    lt_stmt = select(LeaveType).where(LeaveType.is_deleted == False)
    lt_res = await db.execute(lt_stmt)
    leave_types = lt_res.scalars().all()

    bal_stmt = select(LeaveBalance).where(LeaveBalance.year == today.year)
    bal_res = await db.execute(bal_stmt)
    balances = bal_res.scalars().all()

    leave_utilization = []
    for lt in leave_types:
        allocated = sum(b.allocated_days for b in balances if b.leave_type_id == lt.id)
        used = sum(b.used_days for b in balances if b.leave_type_id == lt.id)
        remaining = allocated - used
        rate = round((used / max(1, allocated)) * 100, 1)
        leave_utilization.append(LeaveUtilizationMetric(
            leave_type_name=lt.name,
            allocated_days=allocated,
            used_days=used,
            remaining_days=remaining,
            utilization_rate=rate
        ))

    # 5. Payroll Expenses
    sal_stmt = select(SalaryStructure)
    sal_res = await db.execute(sal_stmt)
    salary_records = sal_res.scalars().all()

    tot_gross = sum(float(s.gross_salary) for s in salary_records)
    tot_net = sum(float(s.net_salary) for s in salary_records)
    tot_deductions = tot_gross - tot_net
    avg_sal = round(tot_net / max(1, len(salary_records)), 2)

    payroll_data = PayrollExpenseMetric(
        total_monthly_gross=tot_gross,
        total_monthly_net=tot_net,
        total_deductions=tot_deductions,
        avg_salary=avg_sal
    )

    # 6. Recruitment & Pending Approvals
    job_stmt = select(func.count(JobOpening.id)).where(JobOpening.status == "OPEN", JobOpening.is_deleted == False)
    job_c = (await db.execute(job_stmt)).scalar() or 0

    cand_stmt = select(func.count(Candidate.id)).where(Candidate.is_deleted == False)
    cand_c = (await db.execute(cand_stmt)).scalar() or 0

    pending_leave_stmt = select(func.count(LeaveRequest.id)).where(LeaveRequest.status == "PENDING", LeaveRequest.is_deleted == False)
    pending_leaves = (await db.execute(pending_leave_stmt)).scalar() or 0

    return OverviewDashboardReport(
        headcount=headcount_data,
        department_distribution=dept_dist,
        attendance=attendance_data,
        leave_utilization=leave_utilization,
        payroll=payroll_data,
        open_jobs_count=job_c,
        total_candidates=cand_c,
        pending_approvals_count=pending_leaves
    )
