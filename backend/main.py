from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import logging
import os
from datetime import datetime
import asyncio

# Import services
from services.firestore_service import FirestoreService
from services.storage_service import StorageService

# Import models
from models.message import Message
from models.drawing import DrawingAction
from models.user import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Collaborative App Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services (lazy loading to avoid startup issues)
firestore_service = None
storage_service = None

def get_firestore_service():
    global firestore_service
    if firestore_service is None:
        firestore_service = FirestoreService()
    return firestore_service

def get_storage_service():
    global storage_service
    if storage_service is None:
        storage_service = StorageService()
    return storage_service

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_rooms: Dict[str, str] = {}  # user_id -> room_id

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        self.active_connections[room_id].append(websocket)
        self.user_rooms[user_id] = room_id
        
        # Notify others in the room
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }, exclude_websocket=websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        room_id = self.user_rooms.get(user_id)
        if room_id and room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            
            # Notify others in the room
            asyncio.create_task(self.broadcast_to_room(room_id, {
                "type": "user_left",
                "user_id": user_id,
                "timestamp": datetime.now().isoformat()
            }))
        
        if user_id in self.user_rooms:
            del self.user_rooms[user_id]

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_websocket: WebSocket = None):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(json.dumps(message))
                    except:
                        # Remove broken connections
                        self.active_connections[room_id].remove(connection)

manager = ConnectionManager()

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Collaborative App Backend", "status": "running"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "backend", "timestamp": datetime.now().isoformat()}

@app.get("/ready")
async def ready():
    """Readiness check endpoint"""
    try:
        # Test Firestore connection
        firestore = get_firestore_service()
        await firestore.test_connection()
        return {"status": "ready", "service": "backend", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {"status": "not_ready", "error": str(e)}

@app.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    await manager.connect(websocket, room_id, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            message_type = message_data.get("type")
            
            if message_type == "drawing":
                # Handle drawing action
                drawing_action = DrawingAction(**message_data.get("action", {}))
                await get_firestore_service().save_drawing_action(room_id, drawing_action)
                
                # Broadcast to other users in the room
                await manager.broadcast_to_room(room_id, {
                    "type": "drawing",
                    "action": drawing_action.model_dump(),
                    "user_id": user_id,
                    "timestamp": datetime.now().isoformat()
                }, exclude_websocket=websocket)
                
            elif message_type == "message":
                # Handle chat message
                message = Message(**message_data.get("message", {}))
                await get_firestore_service().save_message(room_id, message)
                
                # Broadcast to other users in the room
                await manager.broadcast_to_room(room_id, {
                    "type": "message",
                    "message": message.model_dump(),
                    "user_id": user_id,
                    "timestamp": datetime.now().isoformat()
                }, exclude_websocket=websocket)
                
            elif message_type == "clear_canvas":
                # Handle canvas clear
                await get_firestore_service().clear_drawing_actions(room_id)
                
                # Broadcast to other users in the room
                await manager.broadcast_to_room(room_id, {
                    "type": "clear_canvas",
                    "user_id": user_id,
                    "timestamp": datetime.now().isoformat()
                }, exclude_websocket=websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)

@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    room_id: str = Form(...),
    user_id: str = Form(...)
):
    """Upload file to Cloud Storage"""
    try:
        logger.info(f"File upload request: {file.filename}, size: {file.size}, room: {room_id}, user: {user_id}")
        
        # Validate file type and size
        storage = get_storage_service()
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        if not storage.is_allowed_file_type(file.filename):
            raise HTTPException(status_code=400, detail=f"File type not allowed: {file.filename}")
        
        if file.size and file.size > storage.get_file_size_limit():
            raise HTTPException(status_code=400, detail=f"File too large: {file.size} bytes (max: {storage.get_file_size_limit()} bytes)")
        
        # Upload file
        logger.info(f"Uploading file to storage...")
        file_url = await storage.upload_file(file, room_id)
        logger.info(f"File uploaded successfully: {file_url}")
        
        return {
            "success": True,
            "file_url": file_url,
            "filename": file.filename,
            "file_size": file.size,
            "file_type": file.content_type
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/test-storage")
async def test_storage():
    """Test storage service connection"""
    try:
        storage = get_storage_service()
        bucket_name = storage.bucket_name
        bucket_exists = storage.bucket.exists()
        
        return {
            "bucket_name": bucket_name,
            "bucket_exists": bucket_exists,
            "status": "ok"
        }
    except Exception as e:
        logger.error(f"Storage test error: {e}")
        return {
            "error": str(e),
            "status": "error"
        }

@app.get("/messages/{room_id}")
async def get_messages(room_id: str, limit: int = 50):
    """Get messages for a room"""
    try:
        firestore = get_firestore_service()
        messages = await firestore.get_messages(room_id, limit)
        return {"messages": messages}
    except Exception as e:
        logger.error(f"Error getting messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/drawing-actions/{room_id}")
async def get_drawing_actions(room_id: str):
    """Get drawing actions for a room"""
    try:
        firestore = get_firestore_service()
        actions = await firestore.get_drawing_actions(room_id)
        return {"actions": actions}
    except Exception as e:
        logger.error(f"Error getting drawing actions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rooms")
async def get_rooms():
    """Get list of available rooms"""
    try:
        firestore = get_firestore_service()
        rooms = await firestore.get_rooms()
        return {"rooms": rooms}
    except Exception as e:
        logger.error(f"Error getting rooms: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port) 