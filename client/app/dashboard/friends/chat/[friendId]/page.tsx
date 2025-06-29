'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Send, User, MessageCircle, Wifi, WifiOff } from 'lucide-react'

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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Start the conversation</h3>
                <p className="text-slate-400">Say hello to {friendName} and get the conversation started!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isFromFriend = msg.sender_id === friendId
                const showTime = index === 0 ||
                  new Date(messages[index - 1].created_at).getTime() - new Date(msg.created_at).getTime() > 300000

                return (
                  <div key={msg.id} className="space-y-2">
                    {showTime && (
                      <div className="text-center">
                        <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                          {new Date(msg.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isFromFriend ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-md">
                        <div
                          className={`rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl ${isFromFriend
                              ? 'bg-slate-800/80 border border-slate-700/50 text-white'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            }`}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-semibold opacity-80">
                              {isFromFriend ? friendName : 'You'}
                            </span>
                          </div>
                          <div className="text-sm leading-relaxed break-words">
                            {msg.content}
                          </div>
                          <div className="text-xs opacity-60 mt-2 text-right">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-6 py-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-300">{friendName} is typing</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
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