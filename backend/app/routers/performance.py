from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import PerformanceCycle, PerformanceGoal, PerformanceReview, Employee, User
from app.schemas import (
    PerformanceCycleCreate, PerformanceCycleRead,
    PerformanceGoalCreate, PerformanceGoalUpdate, PerformanceGoalRead,
    PerformanceReviewCreate, PerformanceReviewSubmitSelf,
    PerformanceReviewSubmitReviewer, PerformanceReviewRead
)
from app.auth_utils import get_current_user, require_hr, log_audit_action

router = APIRouter(prefix="/api/performance", tags=["Performance"])

def goal_options():
    return [
        joinedload(PerformanceGoal.employee).joinedload(Employee.department),
        joinedload(PerformanceGoal.employee).joinedload(Employee.designation)
    ]

def review_options():
    return [
        joinedload(PerformanceReview.cycle),
        joinedload(PerformanceReview.employee).joinedload(Employee.department),
        joinedload(PerformanceReview.employee).joinedload(Employee.designation),
        joinedload(PerformanceReview.reviewer).joinedload(Employee.designation)
    ]

@router.get("/cycles", response_model=List[PerformanceCycleRead])
async def get_cycles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PerformanceCycle).order_by(PerformanceCycle.start_date.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/cycles", response_model=PerformanceCycleRead, status_code=status.HTTP_201_CREATED)
async def create_cycle(
    payload: PerformanceCycleCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    cycle = PerformanceCycle(
        title=payload.title,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status
    )
    db.add(cycle)
    await db.commit()
    return cycle

@router.get("/goals", response_model=List[PerformanceGoalRead])
async def get_goals(
    cycle_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(PerformanceGoal).options(*goal_options())

    # If not HR, only view own goals
    if current_user.role != "HR":
        query = query.where(PerformanceGoal.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.where(PerformanceGoal.employee_id == employee_id)

    if cycle_id:
        query = query.where(PerformanceGoal.performance_cycle_id == cycle_id)

    query = query.order_by(PerformanceGoal.target_date.asc())
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/goals", response_model=PerformanceGoalRead, status_code=status.HTTP_201_CREATED)
async def create_goal(
    payload: PerformanceGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Employee can create goal for self; HR can create for anyone
    target_emp_id = payload.employee_id
    if current_user.role != "HR":
        target_emp_id = current_user.employee_id

    goal = PerformanceGoal(
        performance_cycle_id=payload.performance_cycle_id,
        employee_id=target_emp_id,
        title=payload.title,
        description=payload.description,
        target_date=payload.target_date,
        progress=payload.progress,
        status=payload.status
    )
    db.add(goal)
    await db.commit()

    full_stmt = select(PerformanceGoal).options(*goal_options()).where(PerformanceGoal.id == goal.id)
    res = await db.execute(full_stmt)
    return res.scalar_one()

@router.patch("/goals/{goal_id}", response_model=PerformanceGoalRead)
async def update_goal(
    goal_id: str,
    payload: PerformanceGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PerformanceGoal).options(*goal_options()).where(PerformanceGoal.id == goal_id)
    res = await db.execute(stmt)
    goal = res.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    if current_user.role != "HR" and goal.employee_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized to edit this goal.")

    if payload.progress is not None:
        goal.progress = max(0, min(100, payload.progress))
        if goal.progress == 100:
            goal.status = "COMPLETED"
    if payload.status:
        goal.status = payload.status
    if payload.description is not None:
        goal.description = payload.description

    goal.updated_at = datetime.utcnow()
    await db.commit()
    return goal

@router.get("/reviews", response_model=List[PerformanceReviewRead])
async def get_reviews(
    cycle_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(PerformanceReview).options(*review_options())

    if current_user.role != "HR":
        query = query.where(
            (PerformanceReview.employee_id == current_user.employee_id) |
            (PerformanceReview.reviewer_id == current_user.employee_id)
        )
    elif employee_id:
        query = query.where(PerformanceReview.employee_id == employee_id)

    if cycle_id:
        query = query.where(PerformanceReview.performance_cycle_id == cycle_id)

    query = query.order_by(PerformanceReview.created_at.desc())
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/reviews", response_model=PerformanceReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review_assignment(
    payload: PerformanceReviewCreate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    review = PerformanceReview(
        performance_cycle_id=payload.performance_cycle_id,
        employee_id=payload.employee_id,
        reviewer_id=payload.reviewer_id,
        status="PENDING"
    )
    db.add(review)
    await db.commit()

    full_stmt = select(PerformanceReview).options(*review_options()).where(PerformanceReview.id == review.id)
    res = await db.execute(full_stmt)
    return res.scalar_one()

@router.patch("/reviews/{review_id}/self", response_model=PerformanceReviewRead)
async def submit_self_review(
    review_id: str,
    payload: PerformanceReviewSubmitSelf,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PerformanceReview).options(*review_options()).where(PerformanceReview.id == review_id)
    res = await db.execute(stmt)
    review = res.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Performance review record not found.")

    if review.employee_id != current_user.employee_id and current_user.role != "HR":
        raise HTTPException(status_code=403, detail="You can only submit self-assessment for yourself.")

    review.self_rating = payload.self_rating
    review.self_feedback = payload.self_feedback
    review.status = "SUBMITTED"
    review.updated_at = datetime.utcnow()
    await db.commit()
    return review

@router.patch("/reviews/{review_id}/reviewer", response_model=PerformanceReviewRead)
async def submit_manager_review(
    review_id: str,
    payload: PerformanceReviewSubmitReviewer,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PerformanceReview).options(*review_options()).where(PerformanceReview.id == review_id)
    res = await db.execute(stmt)
    review = res.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Performance review record not found.")

    if review.reviewer_id != current_user.employee_id and current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Unauthorized to submit reviewer assessment.")

    review.reviewer_rating = payload.reviewer_rating
    review.reviewer_feedback = payload.reviewer_feedback
    review.status = "COMPLETED"
    review.updated_at = datetime.utcnow()
    await db.commit()
    return review
