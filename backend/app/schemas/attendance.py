from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.employee import EmployeeRead

class AttendanceCheckIn(BaseModel):
    notes: Optional[str] = None

class AttendanceCheckOut(BaseModel):
    notes: Optional[str] = None

class AttendanceCorrection(BaseModel):
    employee_id: str
    date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: str  # PRESENT, ABSENT, LATE, HALF_DAY, LEAVE, HOLIDAY
    notes: Optional[str] = None

class AttendanceRecordRead(BaseModel):
    id: str
    employee_id: str
    date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: str
    working_hours: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    employee: Optional[EmployeeRead] = None
    model_config = ConfigDict(from_attributes=True)

class AttendanceSummary(BaseModel):
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    leave_days: int
    avg_working_hours: float

class AttendanceListResponse(BaseModel):
    items: List[AttendanceRecordRead]
    page: int
    page_size: int
    total: int
    total_pages: int
