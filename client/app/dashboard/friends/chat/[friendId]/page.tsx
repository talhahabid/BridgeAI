'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Send, User } from 'lucide-react'

interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  sender_name: string
  content: string
  created_at: string
  is_read: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const friendId = params?.friendId as string
  const friendName = searchParams?.get('name') || 'Friend'
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/')
      return
    }

    connectWebSocket(userId)
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [router, friendId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const connectWebSocket = (userId: string) => {
    // Get authentication token
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No authentication token found')
      return
    }
    
    // Use environment variable for WebSocket URL, fallback to localhost for development
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || window.location.hostname
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT || '8000'
    const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/ws/chat/${userId}?token=${encodeURIComponent(token)}`
    
    console.log('Connecting to WebSocket:', wsUrl)
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }
    
    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      setIsConnected(false)
      
      // Don't reconnect if unauthorized
      if (event.code === 4001) {
        console.error('WebSocket unauthorized, redirecting to login')
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        router.push('/')
        return
      }
      
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (localStorage.getItem('userId') && localStorage.getItem('token')) {
          connectWebSocket(localStorage.getItem('userId')!)
        }
      }, 3000)
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }
    
    wsRef.current = ws
  }

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'chat_message':
        // Only add message if it's from the current friend or to the current friend
        if (data.sender_id === friendId || data.receiver_id === friendId) {
          setMessages(prev => [...prev, {
            id: data.id,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            sender_name: data.sender_id === friendId ? friendName : 'You',
            content: data.content,
            created_at: data.created_at,
            is_read: data.is_read
          }])
        }
        break
      case 'typing_indicator':
        if (data.sender_id === friendId) {
          setIsTyping(data.is_typing)
        }
        break
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return
    
    const messageData = {
      type: 'chat_message',
      receiver_id: friendId,
      content: newMessage.trim()
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageData))
      setNewMessage('')
    } else {
      toast.error('Connection lost. Please refresh the page.')
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    // Send typing indicator
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const typingData = {
        type: 'typing',
        receiver_id: friendId,
        is_typing: true
      }
      wsRef.current.send(JSON.stringify(typingData))
      
      // Clear typing indicator after 2 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const stopTypingData = {
            type: 'typing',
            receiver_id: friendId,
            is_typing: false
          }
          wsRef.current.send(JSON.stringify(stopTypingData))
        }
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push('/dashboard/friends')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <User className="w-6 h-6 text-indigo-600" />
                <span className="text-lg font-semibold text-gray-900">{friendName}</span>
              </div>
            </div>
            <div />
          </div>
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-8">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400">No messages yet. Say hi!</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === friendId ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-xs break-words shadow text-sm ${
                    msg.sender_id === friendId
                      ? 'bg-white text-gray-900 border border-gray-200'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  <div className="mb-1 font-medium">
                    {msg.sender_id === friendId ? friendName : 'You'}
                  </div>
                  <div>{msg.content}</div>
                  <div className="text-xs text-gray-400 mt-1 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-600">
                {friendName} is typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="bg-white border-t max-w-2xl mx-auto w-full px-4 py-4 flex items-center space-x-2">
        <input
          type="text"
          className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
          disabled={!isConnected}
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected || !newMessage.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Send className="w-5 h-5 mr-1" />
          Send
        </button>
      </div>
    </div>
  )
} 