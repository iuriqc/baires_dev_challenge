from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum

class MessageType(str, Enum):
    TEXT = "text"
    FILE = "file"
    SYSTEM = "system"

class Message(BaseModel):
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    id: str = Field(..., description="Unique message ID")
    user_id: str = Field(..., description="User ID who sent the message")
    content: str = Field(..., description="Message content or filename")
    message_type: MessageType = Field(..., description="Type of message")
    timestamp: datetime = Field(..., description="Message timestamp")
    room_id: str = Field(..., description="Room ID where message was sent")
    file_url: Optional[str] = Field(None, description="File URL for file messages")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    file_type: Optional[str] = Field(None, description="File MIME type") 