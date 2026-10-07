from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from app.schemas.employee import EmployeeRead

class LeaveTypeBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    yearly_allotment: int = 12
    is_active: bool = True

class LeaveTypeCreate(LeaveTypeBase):
    pass

class LeaveTypeRead(LeaveTypeBase):
    id: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    model_config = ConfigDict(from_attributes=True)

class LeaveBalanceRead(BaseModel):
    id: str
    employee_id: str
    leave_type_id: str
    year: int
    allocated_days: int
    used_days: int
    remaining_days: int
    leave_type: Optional[LeaveTypeRead] = None
    model_config = ConfigDict(from_attributes=True)

class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type_id: str
    start_date: date
    end_date: date
    reason: str

    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v: str):
        val = v.strip()
        if not val or len(val) < 5:
            raise ValueError("Reason must be at least 5 characters long.")
        if len(val) > 500:
            raise ValueError("Reason cannot exceed 500 characters.")
        return val

    @model_validator(mode='after')
    def validate_dates(self):
        if self.start_date > self.end_date:
            raise ValueError("Start date cannot be after end date.")
        return self

class LeaveRequestStatusUpdate(BaseModel):
    rejection_reason: Optional[str] = None

class LeaveRequestRead(BaseModel):
    id: str
    employee_id: str
    leave_type_id: str
    start_date: date
    end_date: date
    total_days: int
    reason: str
    status: str
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    employee: Optional[EmployeeRead] = None
    leave_type: Optional[LeaveTypeRead] = None
    model_config = ConfigDict(from_attributes=True)

class LeaveRequestListResponse(BaseModel):
    items: List[LeaveRequestRead]
    page: int
    page_size: int
    total: int
    total_pages: int
