import pytest
from datetime import datetime
from models.message import Message, MessageType
from models.drawing import DrawingAction, DrawingActionType
from models.user import User

def test_message_model():
    """Test Message model creation and validation"""
    message = Message(
        id="test-id",
        user_id="user-123",
        content="Hello, world!",
        message_type=MessageType.TEXT,
        timestamp=datetime.now(),
        room_id="room-123"
    )
    
    assert message.id == "test-id"
    assert message.user_id == "user-123"
    assert message.content == "Hello, world!"
    assert message.message_type == MessageType.TEXT
    assert message.room_id == "room-123"

def test_message_model_with_file():
    """Test Message model with file information"""
    message = Message(
        id="test-id",
        user_id="user-123",
        content="Uploaded file",
        message_type=MessageType.FILE,
        timestamp=datetime.now(),
        room_id="room-123",
        file_url="https://example.com/file.pdf",
        file_size=1024,
        file_type="application/pdf"
    )
    
    assert message.file_url == "https://example.com/file.pdf"
    assert message.file_size == 1024
    assert message.file_type == "application/pdf"

def test_drawing_action_model():
    """Test DrawingAction model creation and validation"""
    action = DrawingAction(
        id="action-123",
        user_id="user-123",
        action_type=DrawingActionType.DRAW,
        data={"x": 100, "y": 200, "color": "#000000"},
        timestamp=datetime.now(),
        room_id="room-123"
    )
    
    assert action.id == "action-123"
    assert action.user_id == "user-123"
    assert action.action_type == DrawingActionType.DRAW
    assert action.data["x"] == 100
    assert action.data["y"] == 200
    assert action.data["color"] == "#000000"
    assert action.room_id == "room-123"

def test_drawing_action_clear():
    """Test DrawingAction model for clear action"""
    action = DrawingAction(
        id="action-123",
        user_id="user-123",
        action_type=DrawingActionType.CLEAR,
        data={},
        timestamp=datetime.now(),
        room_id="room-123"
    )
    
    assert action.action_type == DrawingActionType.CLEAR
    assert action.data == {}

def test_user_model():
    """Test User model creation and validation"""
    user = User(
        id="user-123",
        username="John Doe",
        email="john@example.com",
        created_at=datetime.now(),
        is_online=True
    )
    
    assert user.id == "user-123"
    assert user.username == "John Doe"
    assert user.email == "john@example.com"
    assert user.is_online == True

def test_message_serialization():
    """Test Message model serialization"""
    message = Message(
        id="test-id",
        user_id="user-123",
        content="Hello, world!",
        message_type=MessageType.TEXT,
        timestamp=datetime.now(),
        room_id="room-123"
    )
    
    # Test that the model can be converted to dict using model_dump()
    message_dict = message.model_dump()
    assert "id" in message_dict
    assert "user_id" in message_dict
    assert "content" in message_dict
    assert "message_type" in message_dict

def test_drawing_action_serialization():
    """Test DrawingAction model serialization"""
    action = DrawingAction(
        id="action-123",
        user_id="user-123",
        action_type=DrawingActionType.DRAW,
        data={"x": 100, "y": 200},
        timestamp=datetime.now(),
        room_id="room-123"
    )
    
    # Test that the model can be converted to dict using model_dump()
    action_dict = action.model_dump()
    assert "id" in action_dict
    assert "user_id" in action_dict
    assert "action_type" in action_dict
    assert "data" in action_dict

if __name__ == "__main__":
    pytest.main([__file__]) 