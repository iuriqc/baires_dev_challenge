import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from dotenv import load_dotenv

from models.message import Message, MessageType
from models.drawing import DrawingAction
from models.user import User

load_dotenv()

class FirestoreService:
    def __init__(self):
        # Initialize Firestore client
        # In production, this will use service account credentials
        # For local development, you can use gcloud auth application-default login
        self.db = firestore.AsyncClient()
        
    async def save_message(self, message: Message) -> None:
        """Save message to Firestore"""
        try:
            doc_ref = self.db.collection('messages').document(message.id)
            await doc_ref.set(message.model_dump())
        except Exception as e:
            print(f"Error saving message: {e}")
            raise
    
    async def get_messages(self, room_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get messages for a room"""
        try:
            query = (self.db.collection('messages')
                    .where(filter=FieldFilter("room_id", "==", room_id))
                    .order_by("timestamp", direction=firestore.Query.DESCENDING)
                    .limit(limit))
            
            docs = await query.get()
            messages = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                messages.append(data)
            
            return messages
        except Exception as e:
            print(f"Error getting messages: {e}")
            return []
    
    async def save_drawing_action(self, action: DrawingAction) -> None:
        """Save drawing action to Firestore"""
        try:
            doc_ref = self.db.collection('drawing_actions').document(action.id)
            await doc_ref.set(action.model_dump())
        except Exception as e:
            print(f"Error saving drawing action: {e}")
            raise
    
    async def get_drawing_actions(self, room_id: str) -> List[Dict[str, Any]]:
        """Get drawing actions for a room"""
        try:
            query = (self.db.collection('drawing_actions')
                    .where(filter=FieldFilter("room_id", "==", room_id))
                    .order_by("timestamp", direction=firestore.Query.ASCENDING))
            
            docs = await query.get()
            actions = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                actions.append(data)
            
            return actions
        except Exception as e:
            print(f"Error getting drawing actions: {e}")
            return []
    
    async def create_room(self, room_data: Dict[str, Any]) -> None:
        """Create a new room"""
        try:
            doc_ref = self.db.collection('rooms').document(room_data['id'])
            await doc_ref.set(room_data)
        except Exception as e:
            print(f"Error creating room: {e}")
            raise
    
    async def get_rooms(self) -> List[Dict[str, Any]]:
        """Get all rooms"""
        try:
            query = self.db.collection('rooms').order_by("created_at", direction=firestore.Query.DESCENDING)
            docs = await query.get()
            rooms = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                rooms.append(data)
            return rooms
        except Exception as e:
            print(f"Error getting rooms: {e}")
            return []
    
    async def get_room_state(self, room_id: str) -> Dict[str, Any]:
        """Get current state of a room including messages and drawing actions"""
        try:
            # Get messages
            messages = await self.get_messages(room_id, limit=20)
            
            # Get drawing actions
            drawing_actions = await self.get_drawing_actions(room_id)
            
            return {
                "type": "room_state",
                "room_id": room_id,
                "messages": messages,
                "drawing_actions": drawing_actions,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting room state: {e}")
            return {
                "type": "room_state",
                "room_id": room_id,
                "messages": [],
                "drawing_actions": [],
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def save_user(self, user: User) -> None:
        """Save user data"""
        try:
            doc_ref = self.db.collection('users').document(user.id)
            await doc_ref.set(user.model_dump())
        except Exception as e:
            print(f"Error saving user: {e}")
            raise
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            doc_ref = self.db.collection('users').document(user_id)
            doc = await doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    async def update_user_presence(self, user_id: str, is_online: bool) -> None:
        """Update user online status"""
        try:
            doc_ref = self.db.collection('users').document(user_id)
            await doc_ref.update({
                'is_online': is_online,
                'last_seen': datetime.utcnow().isoformat()
            })
        except Exception as e:
            print(f"Error updating user presence: {e}")
            raise 