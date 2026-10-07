import re
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator, model_validator

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    @field_validator('name', 'code')
    @classmethod
    def validate_non_empty(cls, v: str):
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty or whitespace only.")
        return v

class DepartmentRead(DepartmentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    model_config = ConfigDict(from_attributes=True)

class DesignationBase(BaseModel):
    department_id: str
    name: str
    code: str
    description: Optional[str] = None

class DesignationCreate(DesignationBase):
    @field_validator('name', 'code')
    @classmethod
    def validate_non_empty(cls, v: str):
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty or whitespace only.")
        return v

class DesignationRead(DesignationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    model_config = ConfigDict(from_attributes=True)

class ManagerInfo(BaseModel):
    id: str
    employee_code: str
    first_name: str
    last_name: str
    email: str
    model_config = ConfigDict(from_attributes=True)

class EmployeeBase(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: date
    gender: str = "OTHER"
    date_of_joining: date
    employment_status: str = "ACTIVE"
    employment_type: str = "FULL_TIME"
    department_id: str
    designation_id: str
    manager_id: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "India"

    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    pan_number: Optional[str] = None
    uan_number: Optional[str] = None

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: str):
        val = v.strip()
        if not val:
            raise ValueError("Name cannot be empty or whitespace only.")
        if len(val) < 2 or len(val) > 50:
            raise ValueError("Name must be between 2 and 50 characters.")
        if val.isdigit():
            raise ValueError("Name cannot consist of numbers only.")
        if len(set(val.lower())) == 1 and len(val) > 3:
            raise ValueError("Name contains invalid repeated characters.")
        if not re.match(r"^[A-Za-z\s\-\'\.]+$", val):
            raise ValueError("Name contains invalid characters.")
        return val

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str):
        val = v.strip()
        if not val:
            raise ValueError("Phone number is required.")
        digits = re.sub(r'[\s\-\+\(\)]', '', val)
        if len(digits) < 8 or len(digits) > 15 or not digits.isdigit():
            raise ValueError("Invalid phone number format.")
        return val

    @field_validator('date_of_birth')
    @classmethod
    def validate_dob(cls, v: date):
        today = date.today()
        if v >= today:
            raise ValueError("Date of birth must be in the past.")
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError("Employee must be at least 18 years old.")
        if age > 80:
            raise ValueError("Invalid date of birth.")
        return v

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v: str):
        return v.strip().lower()

class EmployeeCreate(EmployeeBase):
    default_password: Optional[str] = "Mponline@123"
    role: Optional[str] = "EMPLOYEE"  # HR, EMPLOYEE

class EmployeeDocumentCreate(BaseModel):
    title: str
    document_type: str
    file_url: str

class EmployeeDocumentRead(BaseModel):
    id: str
    employee_id: str
    title: str
    document_type: str
    file_url: str
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    employment_status: Optional[str] = None
    employment_type: Optional[str] = None
    department_id: Optional[str] = None
    designation_id: Optional[str] = None
    manager_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    pan_number: Optional[str] = None
    uan_number: Optional[str] = None

class EmployeeRead(EmployeeBase):
    id: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    department: Optional[DepartmentRead] = None
    designation: Optional[DesignationRead] = None
    manager: Optional[ManagerInfo] = None
    model_config = ConfigDict(from_attributes=True)

class EmployeeListResponse(BaseModel):
    items: List[EmployeeRead]
    page: int
    page_size: int
    total: int
    total_pages: int

class HierarchyNode(BaseModel):
    id: str
    employee_code: str
    first_name: str
    last_name: str
    email: str
    designation_name: Optional[str] = None
    department_name: Optional[str] = None
    reports: List["HierarchyNode"] = []
    model_config = ConfigDict(from_attributes=True)
