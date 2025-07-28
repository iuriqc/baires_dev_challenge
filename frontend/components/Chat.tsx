'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Image, File, Download } from 'lucide-react'
import { Message } from '@/types'
import { format } from 'date-fns'
import { useAppStore } from '@/store/appStore'
import toast from 'react-hot-toast'

interface ChatProps {
  socket: WebSocket | null
}

export default function Chat({ socket }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, room } = useAppStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket || !user || !room) return

    const message: Message = {
      id: `msg_${Date.now()}`,
      userId: user.id,
      username: user.username,
      content: inputMessage,
      messageType: 'text',
      timestamp: new Date(),
      roomId: room.id,
    }

    // Send via WebSocket
    socket.send(JSON.stringify({
      type: 'message',
      message: message,
    }))

    // Add to local state
    setMessages(prev => [...prev, message])
    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const testBackendConnection = async () => {
    try {
      console.log('🔍 Environment variables:')
      console.log('  - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
      console.log('  - NEXT_PUBLIC_WS_URL:', process.env.NEXT_PUBLIC_WS_URL)
      console.log('  - ENVIRONMENT:', process.env.ENVIRONMENT)
      
      console.log('Testing backend connection...')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/test-storage`)
      const data = await response.json()
      console.log('Backend test result:', data)
      toast.success(`Backend test: ${data.status}`)
    } catch (error) {
      console.error('Backend test failed:', error)
      toast.error('Backend test failed')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (!file || !socket || !user || !room) {
      toast.error('Please select a file and ensure you are connected')
      return
    }

    setIsUploading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('room_id', room.id)
      formData.append('user_id', user.id)

      // Upload file
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-file`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const data = await response.json()
      
      if (data.success) {
        const message: Message = {
          id: `msg_${Date.now()}`,
          userId: user.id,
          username: user.username,
          content: data.filename || file.name,
          messageType: 'file',
          timestamp: new Date(),
          roomId: room.id,
          fileUrl: data.file_url,
          fileSize: data.file_size || file.size,
          fileType: data.file_type || file.type,
        }

        // Send via WebSocket
        socket.send(JSON.stringify({
          type: 'message',
          message: message,
        }))

        // Add to local state
        setMessages(prev => [...prev, message])
        toast.success('File uploaded successfully!')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      // Clear the input
      e.target.value = ''
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!user || !room) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.userId === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${
                message.userId === user.id 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-900'
              } rounded-lg px-3 py-2`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.username}
                  </span>
                  <span className="text-xs opacity-70">
                    {format(message.timestamp, 'HH:mm')}
                  </span>
                </div>
                
                {message.messageType === 'text' ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  <div className="flex items-center space-x-2">
                    {getFileIcon(message.fileType || '')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.content}
                      </p>
                      {message.fileSize && (
                        <p className="text-xs opacity-70">
                          {formatFileSize(message.fileSize)}
                        </p>
                      )}
                    </div>
                    {message.fileUrl && (
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs opacity-70 hover:opacity-100"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <label className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
              disabled={isUploading}
            />
            <Paperclip className={`w-5 h-5 ${isUploading ? 'text-gray-300' : 'text-gray-400 hover:text-gray-600'}`} />
          </label>
          
          {/* Test button for debugging */}
          <button
            onClick={testBackendConnection}
            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            title="Test backend connection"
          >
            Test
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={isUploading}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isUploading}
            className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {isTyping && (
          <div className="text-xs text-gray-500 mt-2">
            Someone is typing...
          </div>
        )}
        
        {isUploading && (
          <div className="text-xs text-gray-500 mt-2">
            Uploading file...
          </div>
        )}
      </div>
    </div>
  )
} 