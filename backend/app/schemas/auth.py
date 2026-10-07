from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from app.schemas.employee import EmployeeRead

class LoginRequest(BaseModel):
    employee_code: str
    password: str

    @field_validator('employee_code')
    @classmethod
    def validate_employee_code(cls, v: str):
        val = v.strip()
        if not val:
            raise ValueError("Employee ID is required.")
        return val

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str):
        if not v:
            raise ValueError("Password is required.")
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    must_change_password: bool
    user: "UserRead"

class ForceChangePasswordRequest(BaseModel):
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_pass(cls, v: str):
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters long.")
        return v

class ForgotPasswordRequest(BaseModel):
    employee_code: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class UserRead(BaseModel):
    id: str
    employee_id: str
    employee_code: str
    role: str
    is_active: bool
    must_change_password: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    employee: Optional[EmployeeRead] = None
    model_config = ConfigDict(from_attributes=True)
