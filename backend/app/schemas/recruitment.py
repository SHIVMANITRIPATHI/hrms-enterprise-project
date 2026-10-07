from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.employee import DepartmentRead, DesignationRead

class JobOpeningBase(BaseModel):
    title: str
    department_id: str
    designation_id: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    openings_count: int = 1
    status: str = "OPEN"

class JobOpeningCreate(JobOpeningBase):
    pass

class JobOpeningRead(JobOpeningBase):
    id: str
    posted_date: date
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    department: Optional[DepartmentRead] = None
    designation: Optional[DesignationRead] = None
    model_config = ConfigDict(from_attributes=True)

class CandidateBase(BaseModel):
    job_opening_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    resume_url: Optional[str] = None
    experience_years: float = 0.0
    expected_salary: Optional[float] = None
    status: str = "APPLIED"

class CandidateCreate(CandidateBase):
    pass

class CandidateStatusUpdate(BaseModel):
    status: str
    interview_date: Optional[datetime] = None
    interview_notes: Optional[str] = None

class CandidateRead(CandidateBase):
    id: str
    interview_date: Optional[datetime] = None
    interview_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    job_opening: Optional[JobOpeningRead] = None
    model_config = ConfigDict(from_attributes=True)

class ConvertCandidateRequest(BaseModel):
    candidate_id: str
    employee_code: str
    date_of_birth: date
    gender: str = "OTHER"
    date_of_joining: date
    employment_type: str = "FULL_TIME"
    manager_id: Optional[str] = None
    basic_salary: float
    default_password: str = "Mponline@123"
