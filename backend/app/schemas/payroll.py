from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.employee import EmployeeRead

class SalaryStructureBase(BaseModel):
    employee_id: str
    basic_salary: float
    hra: float = 0.0
    conveyance_allowance: float = 0.0
    medical_allowance: float = 0.0
    special_allowance: float = 0.0
    pf_deduction: float = 0.0
    tax_deduction: float = 0.0
    other_deductions: float = 0.0
    effective_date: date

class SalaryStructureCreate(SalaryStructureBase):
    pass

class SalaryStructureRead(SalaryStructureBase):
    id: str
    gross_salary: float
    net_salary: float
    created_at: datetime
    updated_at: datetime
    employee: Optional[EmployeeRead] = None
    model_config = ConfigDict(from_attributes=True)

class PayrollPeriodCreate(BaseModel):
    period_name: str
    month: int
    year: int
    start_date: date
    end_date: date

class PayrollPeriodRead(BaseModel):
    id: str
    period_name: str
    month: int
    year: int
    start_date: date
    end_date: date
    is_processed: bool
    processed_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PayrollRecordRead(BaseModel):
    id: str
    payroll_period_id: str
    employee_id: str
    basic_salary: float
    hra: float
    allowances: float
    deductions: float
    net_salary: float
    payment_status: str
    payment_date: Optional[date] = None
    payslip_number: str
    created_at: datetime
    updated_at: datetime
    period: Optional[PayrollPeriodRead] = None
    employee: Optional[EmployeeRead] = None
    model_config = ConfigDict(from_attributes=True)

class GeneratePayrollRequest(BaseModel):
    payroll_period_id: str
    payment_date: Optional[date] = None

class PayrollSummaryResponse(BaseModel):
    total_payroll_cost: float
    total_employees_paid: int
    pending_approvals: int
    period_name: str
