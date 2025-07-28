import { create } from 'zustand'
import { User, Room, Message, DrawingAction } from '@/types'

interface AppState {
  user: User | null
  room: Room | null
  messages: Message[]
  drawingActions: DrawingAction[]
  activeUsers: User[]
  isConnected: boolean
  
  // Actions
  setUser: (user: User) => void
  setRoom: (room: Room) => void
  addMessage: (message: Message) => void
  addDrawingAction: (action: DrawingAction) => void
  setActiveUsers: (users: User[]) => void
  setIsConnected: (connected: boolean) => void
  clearMessages: () => void
  clearDrawingActions: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  room: null,
  messages: [],
  drawingActions: [],
  activeUsers: [],
  isConnected: false,

  setUser: (user) => set({ user }),
  setRoom: (room) => set({ room }),
  
  addMessage: (message) => {
    const { messages } = get()
    set({ messages: [...messages, message] })
  },
  
  addDrawingAction: (action) => {
    const { drawingActions } = get()
    set({ drawingActions: [...drawingActions, action] })
  },
  
  setActiveUsers: (users) => set({ activeUsers: users }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  
  clearMessages: () => set({ messages: [] }),
  clearDrawingActions: () => set({ drawingActions: [] }),
})) 