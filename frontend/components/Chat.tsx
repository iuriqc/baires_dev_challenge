'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Image, File, Download } from 'lucide-react'
import { Message } from '@/types'
import { format } from 'date-fns'

interface ChatProps {
  socket: WebSocket | null
}

export default function Chat({ socket }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket) return

    const message: Message = {
      id: `msg_${Date.now()}`,
      userId: 'current-user', // This should come from user context
      username: 'Current User', // This should come from user context
      content: inputMessage,
      messageType: 'text',
      timestamp: new Date(),
      roomId: 'current-room', // This should come from room context
    }

    // Send via WebSocket
    socket.send(JSON.stringify({
      type: 'chat_message',
      content: inputMessage,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !socket) return

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('room_id', 'current-room')
    formData.append('user_id', 'current-user')

    // Upload file
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-file`, {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const message: Message = {
            id: `msg_${Date.now()}`,
            userId: 'current-user',
            username: 'Current User',
            content: file.name,
            messageType: 'file',
            timestamp: new Date(),
            roomId: 'current-room',
            fileUrl: data.file_url,
            fileSize: file.size,
            fileType: file.type,
          }
          setMessages(prev => [...prev, message])
        }
      })
      .catch(error => {
        console.error('Error uploading file:', error)
      })
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
              className={`flex ${message.userId === 'current-user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${
                message.userId === 'current-user' 
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
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Paperclip className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </label>
          
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
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
      </div>
    </div>
  )
} 