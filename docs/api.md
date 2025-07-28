# API Documentation

This document describes the REST API and WebSocket endpoints for the Collaborative Web Application.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://your-backend-url.com`

## Authentication

Currently, the API uses a simple user identification system. In production, consider implementing JWT authentication.

## REST API Endpoints

### Health Check

#### GET /health

Check the health status of the API.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### File Upload

#### POST /upload-file

Upload a file to Google Cloud Storage.

**Parameters:**
- `file` (multipart/form-data): The file to upload
- `room_id` (query): Room ID for organizing files
- `user_id` (query): User ID who uploaded the file

**Response:**
```json
{
  "success": true,
  "file_url": "https://storage.googleapis.com/bucket/file.jpg",
  "message": {
    "id": "msg_123",
    "user_id": "user_456",
    "content": "file.jpg",
    "message_type": "file",
    "file_url": "https://storage.googleapis.com/bucket/file.jpg",
    "timestamp": "2024-01-15T10:30:00Z",
    "room_id": "room_789"
  }
}
```

**Error Response:**
```json
{
  "detail": "No file provided"
}
```

### Messages

#### GET /messages/{room_id}

Get messages for a specific room.

**Parameters:**
- `room_id` (path): Room ID
- `limit` (query, optional): Number of messages to return (default: 50)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "user_id": "user_456",
      "username": "Alice",
      "content": "Hello everyone!",
      "message_type": "text",
      "timestamp": "2024-01-15T10:30:00Z",
      "room_id": "room_789"
    }
  ]
}
```

### Drawing Actions

#### GET /drawing-actions/{room_id}

Get drawing actions for a specific room.

**Parameters:**
- `room_id` (path): Room ID

**Response:**
```json
{
  "actions": [
    {
      "id": "action_123",
      "user_id": "user_456",
      "action_type": "draw",
      "data": {
        "points": [{"x": 100, "y": 200}, {"x": 150, "y": 250}],
        "color": "#000000",
        "width": 2
      },
      "timestamp": "2024-01-15T10:30:00Z",
      "room_id": "room_789"
    }
  ]
}
```

### Rooms

#### POST /rooms

Create a new room.

**Parameters:**
- `room_name` (query): Name of the room

**Response:**
```json
{
  "room_id": "room_123",
  "room_data": {
    "id": "room_123",
    "name": "Design Team",
    "created_at": "2024-01-15T10:30:00Z",
    "active_users": []
  }
}
```

#### GET /rooms

Get all rooms.

**Response:**
```json
{
  "rooms": [
    {
      "id": "room_123",
      "name": "Design Team",
      "created_at": "2024-01-15T10:30:00Z",
      "active_users": ["user_456", "user_789"]
    }
  ]
}
```

## WebSocket API

### Connection

Connect to the WebSocket endpoint:

```
ws://localhost:8000/ws/{room_id}/{user_id}
```

### Message Types

#### Chat Message

Send a chat message:

```json
{
  "type": "chat_message",
  "content": "Hello everyone!"
}
```

**Response:**
```json
{
  "type": "chat_message",
  "message": {
    "id": "msg_123",
    "user_id": "user_456",
    "content": "Hello everyone!",
    "message_type": "text",
    "timestamp": "2024-01-15T10:30:00Z",
    "room_id": "room_789"
  }
}
```

#### Drawing Action

Send a drawing action:

```json
{
  "type": "drawing_action",
  "action_type": "draw",
  "data": {
    "points": [{"x": 100, "y": 200}, {"x": 150, "y": 250}],
    "color": "#000000",
    "width": 2
  }
}
```

**Response:**
```json
{
  "type": "drawing_action",
  "action": {
    "id": "action_123",
    "user_id": "user_456",
    "action_type": "draw",
    "data": {
      "points": [{"x": 100, "y": 200}, {"x": 150, "y": 250}],
      "color": "#000000",
      "width": 2
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "room_id": "room_789"
  }
}
```

#### User Presence

Update user presence:

```json
{
  "type": "user_presence",
  "status": "online"
}
```

**Response:**
```json
{
  "type": "user_presence",
  "user_id": "user_456",
  "status": "online",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### System Messages

#### User Joined

```json
{
  "type": "user_joined",
  "user_id": "user_456",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### User Left

```json
{
  "type": "user_left",
  "user_id": "user_456",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Room State

```json
{
  "type": "room_state",
  "room_id": "room_789",
  "messages": [...],
  "drawing_actions": [...],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### File Upload

```json
{
  "type": "file_upload",
  "message": {
    "id": "msg_123",
    "user_id": "user_456",
    "content": "file.jpg",
    "message_type": "file",
    "file_url": "https://storage.googleapis.com/bucket/file.jpg",
    "timestamp": "2024-01-15T10:30:00Z",
    "room_id": "room_789"
  }
}
```

## Data Models

### Message

```typescript
interface Message {
  id: string;
  user_id: string;
  username?: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  timestamp: Date;
  room_id: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
}
```

### DrawingAction

```typescript
interface DrawingAction {
  id: string;
  user_id: string;
  action_type: 'draw' | 'clear' | 'change_color' | 'change_tool';
  data: any;
  timestamp: Date;
  room_id: string;
}
```

### User

```typescript
interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
}
```

### Room

```typescript
interface Room {
  id: string;
  name: string;
  createdAt?: Date;
  activeUsers?: string[];
}
```

## Error Handling

### HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "detail": "Error message description"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## CORS Configuration

The API allows CORS from the following origins:
- `http://localhost:3000` (development)
- `https://your-frontend-url.com` (production)

## File Upload Limits

- **Maximum file size**: 10MB
- **Allowed file types**: Images, PDFs, documents, text files
- **Storage**: Google Cloud Storage with public read access

## WebSocket Connection Limits

- **Maximum connections per room**: No limit (scales with Cloud Run)
- **Connection timeout**: 300 seconds
- **Heartbeat interval**: 30 seconds

## Security Considerations

1. **Input Validation**: All inputs are validated using Pydantic models
2. **File Type Validation**: Only allowed file types can be uploaded
3. **CORS**: Configured to allow only trusted origins
4. **HTTPS**: All production communications use HTTPS/WSS

## Monitoring

### Health Check

Monitor the `/health` endpoint for service availability.

### Logging

All API requests and WebSocket messages are logged for debugging and monitoring.

### Metrics

Consider implementing custom metrics for:
- Active WebSocket connections
- File upload success rate
- Message delivery latency
- Drawing action frequency

## Examples

### JavaScript Client Example

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/room123/user456');

// Send chat message
ws.send(JSON.stringify({
  type: 'chat_message',
  content: 'Hello everyone!'
}));

// Send drawing action
ws.send(JSON.stringify({
  type: 'drawing_action',
  action_type: 'draw',
  data: {
    points: [{x: 100, y: 200}, {x: 150, y: 250}],
    color: '#000000',
    width: 2
  }
}));

// Handle incoming messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Python Client Example

```python
import websockets
import json
import asyncio

async def connect_to_room():
    uri = "ws://localhost:8000/ws/room123/user456"
    async with websockets.connect(uri) as websocket:
        # Send chat message
        await websocket.send(json.dumps({
            "type": "chat_message",
            "content": "Hello from Python!"
        }))
        
        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

asyncio.run(connect_to_room())
```

## Next Steps

- [Setup Guide](setup.md)
- [Deployment Guide](deployment.md)
- [Architecture Overview](architecture.md) 