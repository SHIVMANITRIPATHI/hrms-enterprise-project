from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogRead
from app.auth_utils import require_hr

router = APIRouter(prefix="/api/audit", tags=["Audit Logs"])

@router.get("/logs", response_model=List[AuditLogRead])
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)

    query = query.order_by(AuditLog.timestamp.desc()).limit(limit)
    res = await db.execute(query)
    return res.scalars().all()
