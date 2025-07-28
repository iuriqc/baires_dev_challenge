from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum

class DrawingActionType(str, Enum):
    DRAW = "draw"
    CLEAR = "clear"
    CHANGE_COLOR = "change_color"
    CHANGE_TOOL = "change_tool"

class DrawingAction(BaseModel):
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    id: str = Field(..., description="Unique action ID")
    user_id: str = Field(..., description="User ID who performed the action")
    action_type: DrawingActionType = Field(..., description="Type of drawing action")
    data: Dict[str, Any] = Field(..., description="Action data (coordinates, color, etc.)")
    timestamp: datetime = Field(..., description="Action timestamp")
    room_id: str = Field(..., description="Room ID where action was performed") 