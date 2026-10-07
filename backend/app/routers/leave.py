import math
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import LeaveRequest, LeaveBalance, LeaveType, Employee, User
from app.schemas import (
    LeaveTypeRead, LeaveBalanceRead, LeaveRequestCreate, LeaveRequestStatusUpdate,
    LeaveRequestRead, LeaveRequestListResponse
)
from app.auth_utils import get_current_user, require_hr, log_audit_action

router = APIRouter(prefix="/api", tags=["Leave Management"])

def leave_request_options():
    return [
        joinedload(LeaveRequest.employee).joinedload(Employee.department),
        joinedload(LeaveRequest.employee).joinedload(Employee.designation),
        joinedload(LeaveRequest.employee).joinedload(Employee.manager),
        joinedload(LeaveRequest.leave_type)
    ]

@router.get("/leave-types", response_model=List[LeaveTypeRead])
async def get_leave_types(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(LeaveType).where(LeaveType.is_active == True, LeaveType.is_deleted == False)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/leaves", response_model=LeaveRequestRead, status_code=status.HTTP_201_CREATED)
async def create_leave_request(
    payload: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Employee can only create for self, HR can create for any employee
    target_emp_id = payload.employee_id
    if current_user.role != "HR" and target_emp_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="You can only apply for leave for yourself.")

    emp = await db.get(Employee, target_emp_id)
    if not emp or emp.is_deleted or emp.employment_status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Employee is not active or does not exist.")

    l_type = await db.get(LeaveType, payload.leave_type_id)
    if not l_type or l_type.is_deleted or not l_type.is_active:
        raise HTTPException(status_code=400, detail="Leave type is inactive or invalid.")

    total_days = (payload.end_date - payload.start_date).days + 1
    if total_days <= 0:
        raise HTTPException(status_code=400, detail="Invalid leave date range.")

    overlap_stmt = select(LeaveRequest).where(
        LeaveRequest.employee_id == target_emp_id,
        LeaveRequest.is_deleted == False,
        LeaveRequest.status.in_(["PENDING", "APPROVED"]),
        and_(
            LeaveRequest.start_date <= payload.end_date,
            LeaveRequest.end_date >= payload.start_date
        )
    )
    overlap_res = await db.execute(overlap_stmt)
    if overlap_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have an active or pending leave request for these dates.")

    current_year = payload.start_date.year
    bal_stmt = select(LeaveBalance).where(
        LeaveBalance.employee_id == target_emp_id,
        LeaveBalance.leave_type_id == payload.leave_type_id,
        LeaveBalance.year == current_year
    )
    bal_res = await db.execute(bal_stmt)
    balance = bal_res.scalar_one_or_none()

    if not balance:
        balance = LeaveBalance(
            employee_id=target_emp_id,
            leave_type_id=payload.leave_type_id,
            year=current_year,
            allocated_days=l_type.yearly_allotment,
            used_days=0,
            remaining_days=l_type.yearly_allotment
        )
        db.add(balance)
        await db.flush()

    if balance.remaining_days < total_days:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient leave balance. Requested: {total_days} day(s), Available: {balance.remaining_days} day(s)."
        )

    req = LeaveRequest(
        employee_id=target_emp_id,
        leave_type_id=payload.leave_type_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_days=total_days,
        reason=payload.reason,
        status="PENDING"
    )
    db.add(req)
    await db.commit()

    emp_name = f"{emp.first_name} {emp.last_name}"
    await log_audit_action(db, current_user.employee_id, emp_name, "LEAVE_APPLIED", "LeaveRequest", req.id, f"Applied for {total_days} day(s) of {l_type.name}")

    full_stmt = (
        select(LeaveRequest)
        .options(*leave_request_options())
        .where(LeaveRequest.id == req.id)
    )
    res = await db.execute(full_stmt)
    return res.scalar_one()

@router.get("/leaves", response_model=LeaveRequestListResponse)
async def list_leave_requests(
    employee_id: Optional[str] = None,
    leave_type_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(LeaveRequest).where(LeaveRequest.is_deleted == False)

    # If employee, only view own leaves
    if current_user.role != "HR":
        query = query.where(LeaveRequest.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.where(LeaveRequest.employee_id == employee_id)

    if leave_type_id:
        query = query.where(LeaveRequest.leave_type_id == leave_type_id)
    if status:
        query = query.where(LeaveRequest.status == status)
    if start_date:
        query = query.where(LeaveRequest.start_date >= start_date)
    if end_date:
        query = query.where(LeaveRequest.end_date <= end_date)

    count_stmt = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    query = (
        query.options(*leave_request_options())
        .order_by(LeaveRequest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    res = await db.execute(query)
    items = res.scalars().all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {"items": items, "page": page, "page_size": page_size, "total": total, "total_pages": total_pages}

@router.get("/leaves/{leave_id}", response_model=LeaveRequestRead)
async def get_leave_request(
    leave_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(LeaveRequest)
        .options(*leave_request_options())
        .where(LeaveRequest.id == leave_id, LeaveRequest.is_deleted == False)
    )
    res = await db.execute(stmt)
    req = res.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    if current_user.role != "HR" and req.employee_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to leave request.")

    return req

@router.patch("/leaves/{leave_id}/approve", response_model=LeaveRequestRead)
async def approve_leave_request(
    leave_id: str,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    async with db.begin():
        stmt = (
            select(LeaveRequest)
            .options(*leave_request_options())
            .where(LeaveRequest.id == leave_id, LeaveRequest.is_deleted == False)
            .with_for_update()
        )
        res = await db.execute(stmt)
        req = res.scalar_one_or_none()

        if not req:
            raise HTTPException(status_code=404, detail="Leave request not found.")
        if req.status != "PENDING":
            raise HTTPException(status_code=400, detail=f"Cannot approve a request with status '{req.status}'.")

        bal_stmt = select(LeaveBalance).where(
            LeaveBalance.employee_id == req.employee_id,
            LeaveBalance.leave_type_id == req.leave_type_id,
            LeaveBalance.year == req.start_date.year
        ).with_for_update()
        bal_res = await db.execute(bal_stmt)
        balance = bal_res.scalar_one_or_none()

        if not balance:
            raise HTTPException(status_code=400, detail="Leave balance record missing.")
        if balance.remaining_days < req.total_days:
            raise HTTPException(status_code=400, detail="Insufficient leave balance to approve.")

        balance.used_days += req.total_days
        balance.remaining_days = balance.allocated_days - balance.used_days
        balance.updated_at = datetime.utcnow()

        req.status = "APPROVED"
        req.approved_at = datetime.utcnow()
        req.updated_at = datetime.utcnow()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "LEAVE_APPROVED", "LeaveRequest", req.id, f"Approved leave request #{req.id}")

    return req

@router.patch("/leaves/{leave_id}/reject", response_model=LeaveRequestRead)
async def reject_leave_request(
    leave_id: str,
    payload: LeaveRequestStatusUpdate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(LeaveRequest)
        .options(*leave_request_options())
        .where(LeaveRequest.id == leave_id, LeaveRequest.is_deleted == False)
    )
    res = await db.execute(stmt)
    req = res.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Cannot reject a request with status '{req.status}'.")

    req.status = "REJECTED"
    req.rejected_at = datetime.utcnow()
    req.rejection_reason = payload.rejection_reason
    req.updated_at = datetime.utcnow()

    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "HR Admin"
    await log_audit_action(db, current_user.employee_id, emp_name, "LEAVE_REJECTED", "LeaveRequest", req.id, f"Rejected leave request #{req.id}: {payload.rejection_reason}")

    return req

@router.patch("/leaves/{leave_id}/cancel", response_model=LeaveRequestRead)
async def cancel_leave_request(
    leave_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    async with db.begin():
        stmt = (
            select(LeaveRequest)
            .options(*leave_request_options())
            .where(LeaveRequest.id == leave_id, LeaveRequest.is_deleted == False)
            .with_for_update()
        )
        res = await db.execute(stmt)
        req = res.scalar_one_or_none()

        if not req:
            raise HTTPException(status_code=404, detail="Leave request not found.")

        # Non-HR can only cancel own leave
        if current_user.role != "HR" and req.employee_id != current_user.employee_id:
            raise HTTPException(status_code=403, detail="Unauthorized to cancel this leave request.")

        if req.status in ["CANCELLED", "REJECTED"]:
            raise HTTPException(status_code=400, detail=f"Request is already {req.status}.")

        if req.status == "APPROVED":
            bal_stmt = select(LeaveBalance).where(
                LeaveBalance.employee_id == req.employee_id,
                LeaveBalance.leave_type_id == req.leave_type_id,
                LeaveBalance.year == req.start_date.year
            ).with_for_update()
            bal_res = await db.execute(bal_stmt)
            balance = bal_res.scalar_one_or_none()

            if balance:
                balance.used_days = max(0, balance.used_days - req.total_days)
                balance.remaining_days = balance.allocated_days - balance.used_days
                balance.updated_at = datetime.utcnow()

        req.status = "CANCELLED"
        req.cancelled_at = datetime.utcnow()
        req.updated_at = datetime.utcnow()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else "Employee"
    await log_audit_action(db, current_user.employee_id, emp_name, "LEAVE_CANCELLED", "LeaveRequest", req.id, f"Cancelled leave request #{req.id}")

    return req
