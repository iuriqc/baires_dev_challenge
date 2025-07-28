import { useEffect, useRef, useState } from 'react'
import { WebSocketMessage } from '@/types'

export function useWebSocket(userId: string, roomId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!userId || !roomId) return

    let wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    
    // Fallback: if we have API URL but no WS URL, try to convert it
    if (!process.env.NEXT_PUBLIC_WS_URL && process.env.NEXT_PUBLIC_API_URL) {
      wsUrl = process.env.NEXT_PUBLIC_API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
      console.log('🔄 Using API URL fallback for WebSocket:', wsUrl)
    }
    
    const fullWsUrl = `${wsUrl}/ws/${roomId}/${userId}`
    
    console.log('🔌 WebSocket connection details:')
    console.log('  - NEXT_PUBLIC_WS_URL:', process.env.NEXT_PUBLIC_WS_URL)
    console.log('  - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('  - wsUrl:', wsUrl)
    console.log('  - fullWsUrl:', fullWsUrl)
    console.log('  - userId:', userId)
    console.log('  - roomId:', roomId)
    
    const ws = new WebSocket(fullWsUrl)

    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully')
      setIsConnected(true)
    }

    ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason)
      setIsConnected(false)
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting to reconnect...')
        // The useEffect will handle reconnection
      }, 3000)
    }

    ws.onerror = (error) => {
      console.error('💥 WebSocket error:', error)
      console.error('  - Error details:', {
        readyState: ws.readyState,
        url: ws.url,
        bufferedAmount: ws.bufferedAmount
      })
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