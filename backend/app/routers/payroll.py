import math
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import SalaryStructure, PayrollPeriod, PayrollRecord, Employee, User
from app.schemas import (
    SalaryStructureCreate, SalaryStructureRead,
    PayrollPeriodCreate, PayrollPeriodRead,
    PayrollRecordRead, GeneratePayrollRequest, PayrollSummaryResponse
)
from app.auth_utils import get_current_user, require_hr, log_audit_action

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])

def payroll_record_options():
    return [
        joinedload(PayrollRecord.period),
        joinedload(PayrollRecord.employee).joinedload(Employee.department),
        joinedload(PayrollRecord.employee).joinedload(Employee.designation)
    ]

@router.get("/salary-structures", response_model=List[SalaryStructureRead])
async def get_salary_structures(
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(SalaryStructure)
        .options(
            joinedload(SalaryStructure.employee).joinedload(Employee.department),
            joinedload(SalaryStructure.employee).joinedload(Employee.designation)
        )
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/salary-structures", response_model=SalaryStructureRead)
async def create_or_update_salary_structure(
    payload: SalaryStructureCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    emp = await db.get(Employee, payload.employee_id)
    if not emp or emp.is_deleted:
        raise HTTPException(status_code=400, detail="Invalid employee ID.")

    gross = payload.basic_salary + payload.hra + payload.conveyance_allowance + payload.medical_allowance + payload.special_allowance
    deductions = payload.pf_deduction + payload.tax_deduction + payload.other_deductions
    net = gross - deductions

    stmt = select(SalaryStructure).where(SalaryStructure.employee_id == payload.employee_id)
    res = await db.execute(stmt)
    structure = res.scalar_one_or_none()

    if not structure:
        structure = SalaryStructure(
            employee_id=payload.employee_id,
            basic_salary=payload.basic_salary,
            hra=payload.hra,
            conveyance_allowance=payload.conveyance_allowance,
            medical_allowance=payload.medical_allowance,
            special_allowance=payload.special_allowance,
            pf_deduction=payload.pf_deduction,
            tax_deduction=payload.tax_deduction,
            other_deductions=payload.other_deductions,
            gross_salary=gross,
            net_salary=net,
            effective_date=payload.effective_date
        )
        db.add(structure)
    else:
        structure.basic_salary = payload.basic_salary
        structure.hra = payload.hra
        structure.conveyance_allowance = payload.conveyance_allowance
        structure.medical_allowance = payload.medical_allowance
        structure.special_allowance = payload.special_allowance
        structure.pf_deduction = payload.pf_deduction
        structure.tax_deduction = payload.tax_deduction
        structure.other_deductions = payload.other_deductions
        structure.gross_salary = gross
        structure.net_salary = net
        structure.effective_date = payload.effective_date
        structure.updated_at = datetime.utcnow()

    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "SALARY_STRUCTURE_UPDATED", "SalaryStructure", structure.id, f"Salary configured for {emp.employee_code}")

    full_stmt = (
        select(SalaryStructure)
        .options(
            joinedload(SalaryStructure.employee).joinedload(Employee.department),
            joinedload(SalaryStructure.employee).joinedload(Employee.designation)
        )
        .where(SalaryStructure.id == structure.id)
    )
    res = await db.execute(full_stmt)
    return res.scalar_one()

@router.get("/periods", response_model=List[PayrollPeriodRead])
async def get_payroll_periods(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PayrollPeriod).order_by(PayrollPeriod.year.desc(), PayrollPeriod.month.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/periods", response_model=PayrollPeriodRead, status_code=status.HTTP_201_CREATED)
async def create_payroll_period(
    payload: PayrollPeriodCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PayrollPeriod).where(
        PayrollPeriod.month == payload.month,
        PayrollPeriod.year == payload.year
    )
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Payroll period for this month and year already exists.")

    period = PayrollPeriod(
        period_name=payload.period_name,
        month=payload.month,
        year=payload.year,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_processed=False
    )
    db.add(period)
    await db.commit()
    return period

@router.post("/generate", response_model=PayrollSummaryResponse)
async def generate_payroll(
    payload: GeneratePayrollRequest,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    period = await db.get(PayrollPeriod, payload.payroll_period_id)
    if not period:
        raise HTTPException(status_code=404, detail="Payroll period not found.")

    # Fetch all active employees with salary structures
    emp_stmt = select(Employee).options(joinedload(Employee.salary_structure)).where(
        Employee.is_deleted == False,
        Employee.employment_status == "ACTIVE"
    )
    emp_res = await db.execute(emp_stmt)
    active_employees = emp_res.scalars().all()

    total_cost = 0.0
    paid_count = 0

    for emp in active_employees:
        sal = emp.salary_structure
        if not sal:
            # Fallback standard structure if not yet explicitly configured
            sal_basic = 40000.0
            sal_hra = 20000.0
            sal_allowances = 5000.0
            sal_deductions = 4800.0
            sal_net = 60200.0
        else:
            sal_basic = float(sal.basic_salary)
            sal_hra = float(sal.hra)
            sal_allowances = float(sal.conveyance_allowance + sal.medical_allowance + sal.special_allowance)
            sal_deductions = float(sal.pf_deduction + sal.tax_deduction + sal.other_deductions)
            sal_net = float(sal.net_salary)

        # Check existing record for period
        rec_stmt = select(PayrollRecord).where(
            PayrollRecord.payroll_period_id == period.id,
            PayrollRecord.employee_id == emp.id
        )
        rec_res = await db.execute(rec_stmt)
        record = rec_res.scalar_one_or_none()

        payslip_no = f"PAY-{period.year}-{str(period.month).zfill(2)}-{emp.employee_code.replace('Emp-', '').replace('EMP-', '')}"

        if not record:
            record = PayrollRecord(
                payroll_period_id=period.id,
                employee_id=emp.id,
                basic_salary=sal_basic,
                hra=sal_hra,
                allowances=sal_allowances,
                deductions=sal_deductions,
                net_salary=sal_net,
                payment_status="PAID",
                payment_date=payload.payment_date or date.today(),
                payslip_number=payslip_no
            )
            db.add(record)
        else:
            record.basic_salary = sal_basic
            record.hra = sal_hra
            record.allowances = sal_allowances
            record.deductions = sal_deductions
            record.net_salary = sal_net
            record.payment_status = "PAID"
            record.payment_date = payload.payment_date or date.today()
            record.updated_at = datetime.utcnow()

        total_cost += sal_net
        paid_count += 1

    period.is_processed = True
    period.processed_at = datetime.utcnow()
    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "PAYROLL_GENERATED", "PayrollPeriod", period.id, f"Generated payroll for period {period.period_name} ({paid_count} employees)")

    return {
        "total_payroll_cost": round(total_cost, 2),
        "total_employees_paid": paid_count,
        "pending_approvals": 0,
        "period_name": period.period_name
    }

@router.get("/records", response_model=List[PayrollRecordRead])
async def get_payroll_records(
    period_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    query = select(PayrollRecord).options(*payroll_record_options())
    if period_id:
        query = query.where(PayrollRecord.payroll_period_id == period_id)
    if employee_id:
        query = query.where(PayrollRecord.employee_id == employee_id)

    query = query.order_by(PayrollRecord.created_at.desc())
    res = await db.execute(query)
    return res.scalars().all()

@router.get("/me", response_model=List[PayrollRecordRead])
async def get_my_payroll(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(PayrollRecord)
        .options(*payroll_record_options())
        .where(PayrollRecord.employee_id == current_user.employee_id)
        .order_by(PayrollRecord.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/payslip/{record_id}", response_model=PayrollRecordRead)
async def get_payslip(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(PayrollRecord)
        .options(*payroll_record_options())
        .where(PayrollRecord.id == record_id)
    )
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Payslip record not found.")

    # Authorization check: employee can only view own payslip, HR can view all
    if current_user.role != "HR" and record.employee_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to payslip.")

    return record
