import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Employee, PasswordResetToken
from app.schemas import (
    LoginRequest, TokenResponse, ForceChangePasswordRequest,
    ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest, UserRead
)
from app.auth_utils import (
    verify_password, hash_password, create_access_token,
    get_current_user, log_audit_action
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(User)
        .options(
            joinedload(User.employee).joinedload(Employee.department),
            joinedload(User.employee).joinedload(Employee.designation),
            joinedload(User.employee).joinedload(Employee.manager)
        )
        .where(User.employee_code == payload.employee_code)
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Please contact HR."
        )

    if user.employee and (user.employee.is_deleted or user.employee.employment_status != "ACTIVE"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your employee account is not active."
        )

    user.last_login_at = datetime.utcnow()
    await db.commit()

    token = create_access_token({
        "sub": user.id,
        "employee_id": user.employee_id,
        "employee_code": user.employee_code,
        "role": user.role,
        "must_change_password": user.must_change_password
    })

    client_ip = request.client.host if request.client else "127.0.0.1"
    emp_name = f"{user.employee.first_name} {user.employee.last_name}" if user.employee else user.employee_code
    await log_audit_action(db, user.employee_id, emp_name, "LOGIN", "User", user.id, f"User logged in from IP {client_ip}", client_ip)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "must_change_password": user.must_change_password,
        "user": user
    }

@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/force-change-password", response_model=UserRead)
async def force_change_password(
    payload: ForceChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirm password do not match.")

    current_user.password_hash = hash_password(payload.new_password)
    current_user.must_change_password = False
    current_user.updated_at = datetime.utcnow()
    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else current_user.employee_code
    await log_audit_action(db, current_user.employee_id, emp_name, "FORCE_PASSWORD_CHANGED", "User", current_user.id, "Default password changed on first login.")
    return current_user

@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirm password do not match.")

    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password.")

    current_user.password_hash = hash_password(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    await db.commit()

    emp_name = f"{current_user.employee.first_name} {current_user.employee.last_name}" if current_user.employee else current_user.employee_code
    await log_audit_action(db, current_user.employee_id, emp_name, "PASSWORD_CHANGED", "User", current_user.id, "Password updated by user.")
    return {"message": "Password changed successfully."}

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.employee_code == payload.employee_code)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        # Avoid user enumeration by returning standard message
        return {"message": "If the Employee ID exists, a password reset token has been generated."}

    token_str = str(uuid.uuid4()).replace("-", "")[:16]
    reset_tok = PasswordResetToken(
        user_id=user.id,
        token=token_str,
        expires_at=datetime.utcnow() + timedelta(hours=2),
        is_used=False
    )
    db.add(reset_tok)
    await db.commit()

    # In development/demo, return the reset token directly so testing is seamless
    return {
        "message": "If the Employee ID exists, a password reset token has been generated.",
        "dev_reset_token": token_str
    }

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    stmt = select(PasswordResetToken).where(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    )
    res = await db.execute(stmt)
    token_record = res.scalar_one_or_none()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user = await db.get(User, token_record.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="User account not found.")

    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = False
    user.updated_at = datetime.utcnow()
    token_record.is_used = True
    await db.commit()

    return {"message": "Password has been successfully reset. You can now login with your new password."}
