from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class User(BaseModel):
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    id: str = Field(..., description="Unique user ID")
    username: str = Field(..., description="User display name")
    email: Optional[str] = Field(None, description="User email")
    created_at: datetime = Field(..., description="User creation timestamp")
    last_seen: Optional[datetime] = Field(None, description="Last activity timestamp")
    is_online: bool = Field(False, description="User online status") 