from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.employee import EmployeeRead

class PerformanceCycleBase(BaseModel):
    title: str
    start_date: date
    end_date: date
    status: str = "ACTIVE"

class PerformanceCycleCreate(PerformanceCycleBase):
    pass

class PerformanceCycleRead(PerformanceCycleBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PerformanceGoalBase(BaseModel):
    performance_cycle_id: str
    employee_id: str
    title: str
    description: Optional[str] = None
    target_date: date
    progress: int = 0
    status: str = "IN_PROGRESS"

class PerformanceGoalCreate(PerformanceGoalBase):
    pass

class PerformanceGoalUpdate(BaseModel):
    progress: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None

class PerformanceGoalRead(PerformanceGoalBase):
    id: str
    created_at: datetime
    updated_at: datetime
    employee: Optional[EmployeeRead] = None
    model_config = ConfigDict(from_attributes=True)

class PerformanceReviewBase(BaseModel):
    performance_cycle_id: str
    employee_id: str
    reviewer_id: str
    self_rating: Optional[int] = None
    reviewer_rating: Optional[int] = None
    self_feedback: Optional[str] = None
    reviewer_feedback: Optional[str] = None
    status: str = "PENDING"

class PerformanceReviewCreate(PerformanceReviewBase):
    pass

class PerformanceReviewSubmitSelf(BaseModel):
    self_rating: int
    self_feedback: str

class PerformanceReviewSubmitReviewer(BaseModel):
    reviewer_rating: int
    reviewer_feedback: str

class PerformanceReviewRead(PerformanceReviewBase):
    id: str
    created_at: datetime
    updated_at: datetime
    cycle: Optional[PerformanceCycleRead] = None
    employee: Optional[EmployeeRead] = None
    reviewer: Optional[EmployeeRead] = None
    model_config = ConfigDict(from_attributes=True)
