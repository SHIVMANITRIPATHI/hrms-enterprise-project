from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import CompanySetting, Department, Designation, LeaveType, User
from app.schemas import (
    CompanySettingsRead, CompanySettingsUpdate,
    DepartmentCreate, DepartmentRead,
    DesignationCreate, DesignationRead,
    LeaveTypeCreate, LeaveTypeRead
)
from app.auth_utils import get_current_user, require_hr, log_audit_action

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("/company", response_model=CompanySettingsRead)
async def get_company_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CompanySetting)
    res = await db.execute(stmt)
    settings_obj = res.scalar_one_or_none()

    if not settings_obj:
        settings_obj = CompanySetting(id="default-settings")
        db.add(settings_obj)
        await db.commit()
        await db.refresh(settings_obj)

    return settings_obj

@router.patch("/company", response_model=CompanySettingsRead)
async def update_company_settings(
    payload: CompanySettingsUpdate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CompanySetting)
    res = await db.execute(stmt)
    settings_obj = res.scalar_one_or_none()

    if not settings_obj:
        settings_obj = CompanySetting(id="default-settings")
        db.add(settings_obj)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(settings_obj, key, value)

    settings_obj.updated_at = datetime.utcnow()
    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "COMPANY_SETTINGS_UPDATED", "CompanySetting", settings_obj.id, "Updated company profile / policy settings")

    return settings_obj

@router.post("/departments", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
async def create_department(
    payload: DepartmentCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    check_stmt = select(Department).where((Department.name == payload.name) | (Department.code == payload.code))
    res = await db.execute(check_stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department with this name or code already exists.")

    dept = Department(name=payload.name, code=payload.code, description=payload.description)
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept

@router.post("/designations", response_model=DesignationRead, status_code=status.HTTP_201_CREATED)
async def create_designation(
    payload: DesignationCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    dept = await db.get(Department, payload.department_id)
    if not dept:
        raise HTTPException(status_code=400, detail="Department does not exist.")

    desig = Designation(
        department_id=payload.department_id,
        name=payload.name,
        code=payload.code,
        description=payload.description
    )
    db.add(desig)
    await db.commit()
    await db.refresh(desig)
    return desig

@router.post("/leave-types", response_model=LeaveTypeRead, status_code=status.HTTP_201_CREATED)
async def create_leave_type(
    payload: LeaveTypeCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    lt = LeaveType(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        yearly_allotment=payload.yearly_allotment,
        is_active=payload.is_active
    )
    db.add(lt)
    await db.commit()
    await db.refresh(lt)
    return lt
