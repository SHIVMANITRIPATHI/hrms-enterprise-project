import math
from datetime import datetime, date, time
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Attendance, Employee, User, CompanySetting
from app.schemas import (
    AttendanceCheckIn, AttendanceCheckOut, AttendanceCorrection,
    AttendanceRecordRead, AttendanceSummary, AttendanceListResponse
)
from app.auth_utils import get_current_user, require_hr, log_audit_action

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

def attendance_options():
    return [
        joinedload(Attendance.employee).joinedload(Employee.department),
        joinedload(Attendance.employee).joinedload(Employee.designation)
    ]

@router.post("/check-in", response_model=AttendanceRecordRead)
async def check_in(
    payload: AttendanceCheckIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    now_time = datetime.now().time()

    # Check if already checked in today
    stmt = select(Attendance).where(
        Attendance.employee_id == current_user.employee_id,
        Attendance.date == today
    )
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()

    if record and record.check_in:
        raise HTTPException(status_code=400, detail="You have already checked in for today.")

    # Determine status (LATE if after 9:30 AM)
    status_val = "PRESENT"
    if now_time.hour > 9 or (now_time.hour == 9 and now_time.minute > 30):
        status_val = "LATE"

    if not record:
        record = Attendance(
            employee_id=current_user.employee_id,
            date=today,
            check_in=now_time,
            status=status_val,
            working_hours=0.0,
            notes=payload.notes
        )
        db.add(record)
    else:
        record.check_in = now_time
        record.status = status_val
        if payload.notes:
            record.notes = payload.notes
        record.updated_at = datetime.utcnow()

    await db.commit()

    full_stmt = select(Attendance).options(*attendance_options()).where(Attendance.id == record.id)
    res = await db.execute(full_stmt)
    return res.scalar_one()

@router.post("/check-out", response_model=AttendanceRecordRead)
async def check_out(
    payload: AttendanceCheckOut,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    now_time = datetime.now().time()

    stmt = select(Attendance).where(
        Attendance.employee_id == current_user.employee_id,
        Attendance.date == today
    )
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()

    if not record or not record.check_in:
        raise HTTPException(status_code=400, detail="No check-in record found for today. Please check in first.")

    record.check_out = now_time
    # Compute working hours
    check_in_dt = datetime.combine(today, record.check_in)
    check_out_dt = datetime.combine(today, now_time)
    duration_hrs = (check_out_dt - check_in_dt).total_seconds() / 3600.0
    record.working_hours = round(max(0.0, duration_hrs), 2)

    if record.working_hours < 4.0:
        record.status = "HALF_DAY"

    if payload.notes:
        record.notes = f"{record.notes or ''} | Out: {payload.notes}".strip(" |")

    record.updated_at = datetime.utcnow()
    await db.commit()

    full_stmt = select(Attendance).options(*attendance_options()).where(Attendance.id == record.id)
    res = await db.execute(full_stmt)
    return res.scalar_one()

@router.get("/me", response_model=AttendanceListResponse)
async def get_my_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Attendance).where(Attendance.employee_id == current_user.employee_id)
    if start_date:
        query = query.where(Attendance.date >= start_date)
    if end_date:
        query = query.where(Attendance.date <= end_date)

    count_stmt = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    query = query.options(*attendance_options()).order_by(Attendance.date.desc()).offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(query)
    items = res.scalars().all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {"items": items, "page": page, "page_size": page_size, "total": total, "total_pages": total_pages}

@router.get("/me/summary", response_model=AttendanceSummary)
async def get_my_attendance_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target_year = year or date.today().year
    target_month = month or date.today().month

    start_d = date(target_year, target_month, 1)
    if target_month == 12:
        end_d = date(target_year + 1, 1, 1)
    else:
        end_d = date(target_year, target_month + 1, 1)

    stmt = select(Attendance).where(
        Attendance.employee_id == current_user.employee_id,
        Attendance.date >= start_d,
        Attendance.date < end_d
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    present_c = sum(1 for r in records if r.status in ["PRESENT", "LATE"])
    late_c = sum(1 for r in records if r.status == "LATE")
    half_c = sum(1 for r in records if r.status == "HALF_DAY")
    leave_c = sum(1 for r in records if r.status == "LEAVE")
    absent_c = sum(1 for r in records if r.status == "ABSENT")
    total_hours = sum(r.working_hours for r in records)
    avg_hours = round(total_hours / max(1, len(records)), 2)

    return {
        "total_days": len(records),
        "present_days": present_c,
        "absent_days": absent_c,
        "late_days": late_c,
        "half_days": half_c,
        "leave_days": leave_c,
        "avg_working_hours": avg_hours
    }

@router.get("", response_model=AttendanceListResponse)
async def get_organization_attendance(
    target_date: Optional[date] = None,
    department_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    query = select(Attendance)

    if target_date:
        query = query.where(Attendance.date == target_date)
    if employee_id:
        query = query.where(Attendance.employee_id == employee_id)
    if status:
        query = query.where(Attendance.status == status)

    if department_id:
        query = query.join(Attendance.employee).where(Employee.department_id == department_id)

    count_stmt = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    query = query.options(*attendance_options()).order_by(Attendance.date.desc()).offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(query)
    items = res.scalars().all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {"items": items, "page": page, "page_size": page_size, "total": total, "total_pages": total_pages}

@router.post("/correct", response_model=AttendanceRecordRead)
async def correct_attendance(
    payload: AttendanceCorrection,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Attendance).where(
        Attendance.employee_id == payload.employee_id,
        Attendance.date == payload.date
    )
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()

    # Calculate hours if check_in and check_out provided
    working_hours = 0.0
    if payload.check_in and payload.check_out:
        in_dt = datetime.combine(payload.date, payload.check_in)
        out_dt = datetime.combine(payload.date, payload.check_out)
        working_hours = round(max(0.0, (out_dt - in_dt).total_seconds() / 3600.0), 2)
    elif payload.status in ["PRESENT", "LATE"]:
        working_hours = 8.0

    if not record:
        record = Attendance(
            employee_id=payload.employee_id,
            date=payload.date,
            check_in=payload.check_in,
            check_out=payload.check_out,
            status=payload.status,
            working_hours=working_hours,
            notes=f"HR Manual Correction: {payload.notes or ''}".strip()
        )
        db.add(record)
    else:
        record.check_in = payload.check_in
        record.check_out = payload.check_out
        record.status = payload.status
        record.working_hours = working_hours
        record.notes = f"HR Manual Correction: {payload.notes or ''}".strip()
        record.updated_at = datetime.utcnow()

    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "ATTENDANCE_CORRECTED", "Attendance", record.id, f"Attendance for {payload.date} set to {payload.status}")

    full_stmt = select(Attendance).options(*attendance_options()).where(Attendance.id == record.id)
    res = await db.execute(full_stmt)
    return res.scalar_one()
