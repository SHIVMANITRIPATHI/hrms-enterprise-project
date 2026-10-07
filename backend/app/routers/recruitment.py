from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import JobOpening, Candidate, Employee, User, SalaryStructure, Department, Designation
from app.schemas import (
    JobOpeningCreate, JobOpeningRead,
    CandidateCreate, CandidateStatusUpdate, CandidateRead,
    ConvertCandidateRequest, EmployeeRead
)
from app.auth_utils import get_current_user, require_hr, hash_password, log_audit_action

router = APIRouter(prefix="/api/recruitment", tags=["Recruitment"])

def job_options():
    return [
        joinedload(JobOpening.department),
        joinedload(JobOpening.designation)
    ]

def candidate_options():
    return [
        joinedload(Candidate.job_opening).joinedload(JobOpening.department),
        joinedload(Candidate.job_opening).joinedload(JobOpening.designation)
    ]

@router.get("/jobs", response_model=List[JobOpeningRead])
async def get_jobs(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(JobOpening).options(*job_options()).where(JobOpening.is_deleted == False)
    if status:
        query = query.where(JobOpening.status == status)
    query = query.order_by(JobOpening.posted_date.desc())
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/jobs", response_model=JobOpeningRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobOpeningCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    dept = await db.get(Department, payload.department_id)
    if not dept:
        raise HTTPException(status_code=400, detail="Invalid department ID.")
    desig = await db.get(Designation, payload.designation_id)
    if not desig:
        raise HTTPException(status_code=400, detail="Invalid designation ID.")

    job = JobOpening(
        title=payload.title,
        department_id=payload.department_id,
        designation_id=payload.designation_id,
        description=payload.description,
        requirements=payload.requirements,
        openings_count=payload.openings_count,
        status=payload.status,
        posted_date=date.today()
    )
    db.add(job)
    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "JOB_OPENING_CREATED", "JobOpening", job.id, f"Created job opening: {job.title}")

    full_stmt = select(JobOpening).options(*job_options()).where(JobOpening.id == job.id)
    res = await db.execute(full_stmt)
    return res.scalar_one()

@router.get("/candidates", response_model=List[CandidateRead])
async def get_candidates(
    job_opening_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    query = select(Candidate).options(*candidate_options()).where(Candidate.is_deleted == False)
    if job_opening_id:
        query = query.where(Candidate.job_opening_id == job_opening_id)
    if status:
        query = query.where(Candidate.status == status)

    query = query.order_by(Candidate.created_at.desc())
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/candidates", response_model=CandidateRead, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    payload: CandidateCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    job = await db.get(JobOpening, payload.job_opening_id)
    if not job or job.is_deleted:
        raise HTTPException(status_code=400, detail="Invalid job opening ID.")

    cand = Candidate(
        job_opening_id=payload.job_opening_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        resume_url=payload.resume_url,
        experience_years=payload.experience_years,
        expected_salary=payload.expected_salary,
        status=payload.status
    )
    db.add(cand)
    await db.commit()

    full_stmt = select(Candidate).options(*candidate_options()).where(Candidate.id == cand.id)
    res = await db.execute(full_stmt)
    return res.scalar_one()

@router.patch("/candidates/{candidate_id}/status", response_model=CandidateRead)
async def update_candidate_status(
    candidate_id: str,
    payload: CandidateStatusUpdate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Candidate).options(*candidate_options()).where(Candidate.id == candidate_id, Candidate.is_deleted == False)
    res = await db.execute(stmt)
    cand = res.scalar_one_or_none()

    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    cand.status = payload.status
    if payload.interview_date:
        cand.interview_date = payload.interview_date
    if payload.interview_notes:
        cand.interview_notes = payload.interview_notes
    cand.updated_at = datetime.utcnow()

    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "CANDIDATE_STATUS_UPDATED", "Candidate", cand.id, f"Candidate {cand.first_name} {cand.last_name} moved to status {payload.status}")

    return cand

@router.post("/candidates/{candidate_id}/convert-to-employee", response_model=EmployeeRead)
async def convert_candidate_to_employee(
    candidate_id: str,
    payload: ConvertCandidateRequest,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    cand_stmt = select(Candidate).options(joinedload(Candidate.job_opening)).where(Candidate.id == candidate_id)
    cand_res = await db.execute(cand_stmt)
    cand = cand_res.scalar_one_or_none()

    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    # Check unique code & email
    code_check = await db.execute(select(Employee).where(Employee.employee_code == payload.employee_code))
    if code_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee code already in use.")

    email_check = await db.execute(select(Employee).where(Employee.email == cand.email))
    if email_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An employee with this email already exists.")

    emp = Employee(
        employee_code=payload.employee_code,
        first_name=cand.first_name,
        last_name=cand.last_name,
        email=cand.email,
        phone=cand.phone,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        date_of_joining=payload.date_of_joining,
        employment_status="ACTIVE",
        employment_type=payload.employment_type,
        department_id=cand.job_opening.department_id,
        designation_id=cand.job_opening.designation_id,
        manager_id=payload.manager_id
    )
    db.add(emp)
    await db.flush()

    # Create User account
    user = User(
        employee_id=emp.id,
        employee_code=emp.employee_code,
        password_hash=hash_password(payload.default_password),
        role="EMPLOYEE",
        is_active=True,
        must_change_password=True
    )
    db.add(user)

    # Create Salary Structure
    sal_basic = payload.basic_salary
    sal_hra = sal_basic * 0.5
    sal_allowances = sal_basic * 0.2
    sal_pf = sal_basic * 0.12
    sal_tax = sal_basic * 0.1
    sal_gross = sal_basic + sal_hra + sal_allowances
    sal_net = sal_gross - (sal_pf + sal_tax)

    sal = SalaryStructure(
        employee_id=emp.id,
        basic_salary=sal_basic,
        hra=sal_hra,
        special_allowance=sal_allowances,
        pf_deduction=sal_pf,
        tax_deduction=sal_tax,
        gross_salary=sal_gross,
        net_salary=sal_net,
        effective_date=payload.date_of_joining
    )
    db.add(sal)

    # Mark candidate as HIRED
    cand.status = "HIRED"
    cand.updated_at = datetime.utcnow()

    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "CANDIDATE_HIRED_AND_ONBOARDED", "Employee", emp.id, f"Candidate {cand.first_name} {cand.last_name} converted to Employee {emp.employee_code}")

    full_stmt = (
        select(Employee)
        .options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
            joinedload(Employee.manager)
        )
        .where(Employee.id == emp.id)
    )
    res = await db.execute(full_stmt)
    return res.scalar_one()
