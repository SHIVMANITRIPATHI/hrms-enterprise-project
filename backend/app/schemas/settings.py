from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class CompanySettingsRead(BaseModel):
    id: str
    company_name: str
    company_email: str
    company_phone: str
    company_address: str
    timezone: str
    currency: str
    fiscal_year_start: str
    attendance_grace_period_mins: int
    standard_working_hours: float
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CompanySettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_email: Optional[str] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    fiscal_year_start: Optional[str] = None
    attendance_grace_period_mins: Optional[int] = None
    standard_working_hours: Optional[float] = None
