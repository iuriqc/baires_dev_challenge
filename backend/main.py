from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import json
import asyncio
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

from services.firestore_service import FirestoreService
from services.storage_service import StorageService
from models.message import Message, MessageType
from models.drawing import DrawingAction
from models.user import User

load_dotenv()

app = FastAPI(title="Collaborative Web App API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
firestore_service = FirestoreService()
storage_service = StorageService()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.room_connections: Dict[str, List[str]] = {}
        self.user_rooms: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str, room_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
        if room_id not in self.room_connections:
            self.room_connections[room_id] = []
        self.room_connections[room_id].append(user_id)
        self.user_rooms[user_id] = room_id

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        if user_id in self.user_rooms:
            room_id = self.user_rooms[user_id]
            if room_id in self.room_connections:
                self.room_connections[room_id].remove(user_id)
                if not self.room_connections[room_id]:
                    del self.room_connections[room_id]
            del self.user_rooms[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    async def broadcast_to_room(self, message: str, room_id: str, exclude_user: str = None):
        if room_id in self.room_connections:
            for user_id in self.room_connections[room_id]:
                if user_id != exclude_user and user_id in self.active_connections:
                    await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "Collaborative Web App API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    await manager.connect(websocket, user_id, room_id)
    
    try:
        # Notify others that user joined
        join_message = {
            "type": "user_joined",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_to_room(json.dumps(join_message), room_id, user_id)
        
        # Send current room state
        room_state = await firestore_service.get_room_state(room_id)
        await manager.send_personal_message(json.dumps(room_state), user_id)
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "chat_message":
                # Handle chat message
                message = Message(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    content=message_data["content"],
                    message_type=MessageType.TEXT,
                    timestamp=datetime.utcnow(),
                    room_id=room_id
                )
                
                # Save to Firestore
                await firestore_service.save_message(message)
                
                # Broadcast to room
                await manager.broadcast_to_room(json.dumps({
                    "type": "chat_message",
                    "message": message.dict()
                }), room_id)
                
            elif message_data["type"] == "drawing_action":
                # Handle drawing action
                drawing_action = DrawingAction(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    action_type=message_data["action_type"],
                    data=message_data["data"],
                    timestamp=datetime.utcnow(),
                    room_id=room_id
                )
                
                # Save to Firestore
                await firestore_service.save_drawing_action(drawing_action)
                
                # Broadcast to room
                await manager.broadcast_to_room(json.dumps({
                    "type": "drawing_action",
                    "action": drawing_action.dict()
                }), room_id, user_id)
                
            elif message_data["type"] == "user_presence":
                # Handle user presence update
                await manager.broadcast_to_room(json.dumps({
                    "type": "user_presence",
                    "user_id": user_id,
                    "status": message_data["status"],
                    "timestamp": datetime.utcnow().isoformat()
                }), room_id, user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        
        # Notify others that user left
        leave_message = {
            "type": "user_left",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_to_room(json.dumps(leave_message), room_id)

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...), room_id: str = None, user_id: str = None):
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Upload to Google Cloud Storage
        file_url = await storage_service.upload_file(file, room_id)
        
        # Create message for file
        message = Message(
            id=str(uuid.uuid4()),
            user_id=user_id,
            content=file.filename,
            message_type=MessageType.FILE,
            file_url=file_url,
            timestamp=datetime.utcnow(),
            room_id=room_id
        )
        
        # Save to Firestore
        await firestore_service.save_message(message)
        
        # Broadcast to room via WebSocket
        await manager.broadcast_to_room(json.dumps({
            "type": "file_upload",
            "message": message.dict()
        }), room_id)
        
        return {
            "success": True,
            "file_url": file_url,
            "message": message.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages/{room_id}")
async def get_messages(room_id: str, limit: int = 50):
    try:
        messages = await firestore_service.get_messages(room_id, limit)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/drawing-actions/{room_id}")
async def get_drawing_actions(room_id: str):
    try:
        actions = await firestore_service.get_drawing_actions(room_id)
        return {"actions": actions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rooms")
async def create_room(room_name: str):
    try:
        room_id = str(uuid.uuid4())
        room_data = {
            "id": room_id,
            "name": room_name,
            "created_at": datetime.utcnow().isoformat(),
            "active_users": []
        }
        
        await firestore_service.create_room(room_data)
        return {"room_id": room_id, "room_data": room_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rooms")
async def get_rooms():
    try:
        rooms = await firestore_service.get_rooms()
        return {"rooms": rooms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 