'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Circle } from 'lucide-react'
import { User } from '@/types'

interface UserPanelProps {
  socket: WebSocket | null
}

export default function UserPanel({ socket }: UserPanelProps) {
  const [activeUsers, setActiveUsers] = useState<User[]>([])

  useEffect(() => {
    // Mock data for demonstration
    setActiveUsers([
      { id: 'user1', username: 'Alice', isOnline: true },
      { id: 'user2', username: 'Bob', isOnline: true },
      { id: 'user3', username: 'Charlie', isOnline: false },
    ])
  }, [])

  const onlineUsers = activeUsers.filter(user => user.isOnline)
  const offlineUsers = activeUsers.filter(user => !user.isOnline)

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">Active Users</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {onlineUsers.length} online
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Online
            </h4>
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <Circle className="w-3 h-3 text-green-500 absolute -bottom-1 -right-1 fill-current" />
                  </div>
                  <span className="text-sm text-gray-900">{user.username}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Users */}
        {offlineUsers.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Offline
            </h4>
            <div className="space-y-2">
              {offlineUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2 opacity-60"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <Circle className="w-3 h-3 text-gray-400 absolute -bottom-1 -right-1 fill-current" />
                  </div>
                  <span className="text-sm text-gray-600">{user.username}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeUsers.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No users in this room</p>
          </div>
        )}
      </div>
    </div>
  )
} 