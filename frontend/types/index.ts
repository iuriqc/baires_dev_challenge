export interface User {
  id: string
  username: string
  isOnline: boolean
  lastSeen?: Date
}

export interface Room {
  id: string
  name: string
  createdAt?: Date
  activeUsers?: string[]
}

export interface Message {
  id: string
  userId: string
  username?: string
  content: string
  messageType: 'text' | 'file' | 'system'
  timestamp: Date
  roomId: string
  fileUrl?: string
  fileSize?: number
  fileType?: string
}

export interface DrawingAction {
  id: string
  userId: string
  username?: string
  actionType: 'draw' | 'clear' | 'change_color' | 'change_tool'
  data: any
  timestamp: Date
  roomId: string
}

export interface WebSocketMessage {
  type: string
  [key: string]: any
}

export interface DrawingPoint {
  x: number
  y: number
  pressure?: number
}

export interface DrawingStroke {
  points: DrawingPoint[]
  color: string
  width: number
  userId: string
  timestamp: Date
} 