'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, MessageCircle, Palette, Upload, Settings } from 'lucide-react'
import Whiteboard from '@/components/Whiteboard'
import Chat from '@/components/Chat'
import UserPanel from '@/components/UserPanel'
import FileUploadTest from '@/components/FileUploadTest'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAppStore } from '@/store/appStore'
import toast from 'react-hot-toast'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'chat'>('whiteboard')
  const [isConnected, setIsConnected] = useState(false)
  const { user, room, setUser, setRoom } = useAppStore()
  
  // Debug environment variables
  useEffect(() => {
    console.log('🌐 Environment Check:')
    console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('- NEXT_PUBLIC_WS_URL:', process.env.NEXT_PUBLIC_WS_URL)
    console.log('- NODE_ENV:', process.env.NODE_ENV)
  }, [])
  
  // Initialize user if not set
  useEffect(() => {
    if (!user) {
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`
      const username = `User_${Math.floor(Math.random() * 1000)}`
      setUser({ id: userId, username, isOnline: true })
    }
    
    if (!room) {
      const roomId = 'default-room'
      setRoom({ id: roomId, name: 'Default Room' })
    }
  }, [user, room, setUser, setRoom])

  // WebSocket connection
  const { socket, isConnected: wsConnected } = useWebSocket(
    user?.id || '',
    room?.id || ''
  )

  useEffect(() => {
    setIsConnected(wsConnected)
    if (wsConnected) {
      toast.success('Connected to room!')
    } else {
      toast.error('Disconnected from room')
    }
  }, [wsConnected])

  if (!user || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Collaborative Web App
              </h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Room: {room.name}</span>
              </div>
              <button className="btn btn-outline btn-sm">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Panel - Whiteboard */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <Whiteboard socket={socket} />
            </motion.div>
          </div>

          {/* Right Panel - Chat & Users */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload Test - Temporary for debugging */}
            <FileUploadTest />
            
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('whiteboard')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'whiteboard'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Palette className="w-4 h-4 inline mr-2" />
                  Tools
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'chat' ? (
                  <Chat socket={socket} />
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Drawing Tools
                    </div>
                    <div className="space-y-2">
                      <button className="w-full btn btn-outline btn-sm justify-start">
                        <Palette className="w-4 h-4 mr-2" />
                        Color Picker
                      </button>
                      <button className="w-full btn btn-outline btn-sm justify-start">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Users Panel */}
            <UserPanel socket={socket} />
          </div>
        </div>
      </div>
    </div>
  )
} 