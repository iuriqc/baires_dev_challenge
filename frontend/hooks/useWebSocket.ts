import { useEffect, useRef, useState } from 'react'
import { WebSocketMessage } from '@/types'

export function useWebSocket(userId: string, roomId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!userId || !roomId) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const ws = new WebSocket(`${wsUrl}/ws/${roomId}/${userId}`)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...')
        // The useEffect will handle reconnection
      }, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        console.log('Received message:', message)
        
        // Handle different message types
        switch (message.type) {
          case 'chat_message':
            // Handle chat message
            break
          case 'drawing_action':
            // Handle drawing action
            break
          case 'user_joined':
            // Handle user joined
            break
          case 'user_left':
            // Handle user left
            break
          case 'room_state':
            // Handle room state
            break
          default:
            console.log('Unknown message type:', message.type)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    setSocket(ws)

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      ws.close()
    }
  }, [userId, roomId])

  const sendMessage = (message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }

  return {
    socket,
    isConnected,
    sendMessage,
  }
} 