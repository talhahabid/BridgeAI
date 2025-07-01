'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Send, User, Trash2, MoreVertical, Wifi, WifiOff } from 'lucide-react'
import { chatService, ChatMessage } from '../../../../services/chatService'

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
  const [isLoading, setIsLoading] = useState(true)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/')
      return
    }

    loadChatHistory()
    connectWebSocket(userId)
    markMessagesAsRead()
    
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

  const loadChatHistory = async () => {
    try {
      setIsLoading(true)
      const response = await chatService.getChatMessages(friendId, 50, 0)
      setMessages(response.messages)
      setHasMoreMessages(response.has_more)
    } catch (error) {
      console.error('Error loading chat history:', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoading) return
    
    try {
      const response = await chatService.getChatMessages(friendId, 20, messages.length)
      setMessages(prev => [...response.messages, ...prev])
      setHasMoreMessages(response.has_more)
    } catch (error) {
      console.error('Error loading more messages:', error)
      toast.error('Failed to load more messages')
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await chatService.markMessagesAsRead(friendId)
      // Update local messages to mark them as read
      setMessages(prev => prev.map(msg => 
        msg.sender_id === friendId ? { ...msg, is_read: true } : msg
      ))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      setSelectedMessage(null)
      toast.success('Message deleted')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const connectWebSocket = (userId: string) => {
    // Get authentication token
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No authentication token found')
      return
    }

    // Use environment variable for WebSocket URL, fallback to current host for production
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${userId}?token=${encodeURIComponent(token)}`

    console.log('Connecting to WebSocket:', wsUrl)
    const ws = new WebSocket(wsUrl)

    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.error('WebSocket connection timeout')
        ws.close()
        setIsConnected(false)
        toast.error('Connection timeout. Please try again.')
      }
    }, 10000) // 10 second timeout

    ws.onopen = () => {
      console.log('WebSocket connected')
      clearTimeout(connectionTimeout)
      setIsConnected(true)
      toast.success('Connected to chat')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      clearTimeout(connectionTimeout)
      setIsConnected(false)

      // Don't reconnect if unauthorized
      if (event.code === 4001) {
        console.error('WebSocket unauthorized, redirecting to login')
        toast.error('Authentication failed. Please login again.')
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        router.push('/')
        return
      }

      // Show reconnection message
      toast.error('Connection lost. Reconnecting...')

      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (localStorage.getItem('userId') && localStorage.getItem('token')) {
          console.log('Attempting to reconnect...')
          connectWebSocket(localStorage.getItem('userId')!)
        }
      }, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      clearTimeout(connectionTimeout)
      setIsConnected(false)
      toast.error('Connection error. Please check your internet connection.')
    }

    wsRef.current = ws
  }

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'chat_message':
        // Only add message if it's from the current friend or to the current friend
        if (data.sender_id === friendId || data.receiver_id === friendId) {
          const newMessage: ChatMessage = {
            id: data.id,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            sender_name: data.sender_name,
            content: data.content,
            message_type: data.message_type || 'text',
            created_at: data.created_at,
            is_read: data.is_read
          }
          
          setMessages(prev => [...prev, newMessage])
          
          // Mark as read if from friend
          if (data.sender_id === friendId) {
            markMessagesAsRead()
          }
        }
        break
      case 'typing_indicator':
        if (data.sender_id === friendId) {
          setIsTyping(data.is_typing)
        }
        break
      case 'message_deleted':
        if (data.message_id) {
          setMessages(prev => prev.filter(msg => msg.id !== data.message_id))
        }
        break
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return

    const messageData = {
      type: 'chat_message',
      receiver_id: friendId,
      content: newMessage.trim(),
      message_type: 'text'
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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isOwnMessage = (message: ChatMessage) => {
    return message.sender_id === localStorage.getItem('userId')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <button
              onClick={() => router.push('/dashboard/friends')}
              className="flex items-center space-x-3 text-slate-400 hover:text-white transition-all duration-200 group"
            >
              <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 group-hover:border-blue-500/30 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium">Back to Network</span>
            </button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {friendName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{friendName}</h1>
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm font-medium">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Load more messages button */}
            {hasMoreMessages && (
              <div className="flex justify-center">
                <button
                  onClick={loadMoreMessages}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Load more messages
                </button>
              </div>
            )}
            
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-lg font-medium mb-2">No messages yet</div>
                <div className="text-sm">Start a conversation with {friendName}!</div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="relative group">
                    <div
                      className={`rounded-lg px-4 py-2 max-w-xs break-words shadow text-sm ${
                        isOwnMessage(msg)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className="mb-1 font-medium">
                        {isOwnMessage(msg) ? 'You' : friendName}
                      </div>
                      <div>{msg.content}</div>
                      <div className={`text-xs mt-1 flex items-center justify-between ${
                        isOwnMessage(msg) ? 'text-indigo-200' : 'text-gray-400'
                      }`}>
                        <span>{formatMessageTime(msg.created_at)}</span>
                        {isOwnMessage(msg) && (
                          <span className="ml-2">
                            {msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Message actions (delete) */}
                    {isOwnMessage(msg) && (
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedMessage(selectedMessage === msg.id ? null : msg.id)}
                          className="bg-gray-800 text-white p-1 rounded-full hover:bg-gray-700"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                        
                        {selectedMessage === msg.id && (
                          <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="flex items-center space-x-2 px-3 py-1 text-red-600 hover:bg-red-50 w-full text-left text-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span>{friendName} is typing</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-t border-slate-700/50 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                placeholder={isConnected ? `Message ${friendName}...` : "Connecting..."}
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                disabled={!isConnected}
              />
              {!isConnected && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-blue-400 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={!isConnected || !newMessage.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white p-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:scale-100 flex items-center justify-center min-w-[60px]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}