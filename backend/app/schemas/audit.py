from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AuditLogRead(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_name: str
    action: str
    entity: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
