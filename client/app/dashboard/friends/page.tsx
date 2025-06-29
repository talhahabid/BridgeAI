'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import {
  User,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
  ArrowLeft,
  MapPin,
  Globe
} from 'lucide-react'

interface UserWithJobPreference {
  id: string
  name: string
  job_preference: string
  location: string
  origin_country?: string
  is_friend: boolean
  has_pending_request: boolean
  request_sent_by_me: boolean
}

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  sender_name: string
  receiver_name: string
  status: string
  created_at: string
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'requests' | 'friends'>('discover')
  const [discoverUsers, setDiscoverUsers] = useState<UserWithJobPreference[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<UserWithJobPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    loadData()
  }, [router, activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')

      if (activeTab === 'discover') {
        await loadDiscoverUsers(token!)
      } else if (activeTab === 'requests') {
        await loadFriendRequests(token!)
      } else if (activeTab === 'friends') {
        await loadFriends(token!)
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        router.push('/')
      } else {
        toast.error('Failed to load data')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadDiscoverUsers = async (token: string) => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/discover`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setDiscoverUsers(response.data)
  }

  const loadFriendRequests = async (token: string) => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('Friend requests data:', response.data)
    console.log('First friend request object:', response.data[0])
    console.log('First friend request ID:', response.data[0]?.id)
    setFriendRequests(response.data)
  }

  const loadFriends = async (token: string) => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/friends`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setFriends(response.data)
  }

  const sendFriendRequest = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/request`, {
        receiver_id: userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Friend request sent!')
      loadData() // Reload to update UI
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send friend request')
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    console.log('Accepting friend request with ID:', requestId)
    try {
      const token = localStorage.getItem('token')
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/request/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Friend request accepted!')
      loadData() // Reload to update UI
    } catch (error: any) {
      console.error('Error accepting friend request:', error)
      toast.error(error.response?.data?.detail || 'Failed to accept friend request')
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    console.log('Rejecting friend request with ID:', requestId)
    try {
      const token = localStorage.getItem('token')
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/request/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Friend request rejected')
      loadData() // Reload to update UI
    } catch (error: any) {
      console.error('Error rejecting friend request:', error)
      toast.error(error.response?.data?.detail || 'Failed to reject friend request')
    }
  }

  const openChat = (friendId: string, friendName: string) => {
    router.push(`/dashboard/friends/chat/${friendId}?name=${encodeURIComponent(friendName)}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-400/20 border-b-purple-400 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-3 text-slate-300 hover:text-white transition-all duration-200 group"
              >
                <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 group-hover:border-blue-500/30 group-hover:bg-slate-700/50 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="font-medium">Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Network & Connect</h1>
                <p className="text-slate-400 text-sm">Build your professional network</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-2 border border-slate-700/50">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('discover')}
                className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'discover'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Discover</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 relative ${activeTab === 'requests'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Requests</span>
                  {friendRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {friendRequests.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'friends'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Friends</span>
                  {friends.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-white/20 text-xs rounded-full">
                      {friends.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'discover' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Discover Professionals
              </h2>
              <p className="text-slate-400">Connect with people who share your career interests</p>
            </div>
            {discoverUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
                  <p className="text-slate-400 mb-2">We couldn't find anyone with your job preference yet</p>
                  <p className="text-sm text-slate-500">Make sure you've set your job preference in your profile</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoverUsers.map((user) => (
                  <div key={user.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-200 group">
                    <div className="flex items-center mb-6">
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{user.name.charAt(0)}</span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{user.name}</h3>
                        <p className="text-sm text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full inline-block">
                          {user.job_preference}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-slate-300">
                        <div className="p-2 bg-slate-700/50 rounded-lg mr-3">
                          <MapPin className="w-4 h-4 text-blue-400" />
                        </div>
                        <span>{user.location}</span>
                      </div>
                      {user.origin_country && (
                        <div className="flex items-center text-sm text-slate-300">
                          <div className="p-2 bg-slate-700/50 rounded-lg mr-3">
                            <Globe className="w-4 h-4 text-purple-400" />
                          </div>
                          <span>{user.origin_country}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      {user.is_friend ? (
                        <button
                          onClick={() => openChat(user.id, user.name)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Message</span>
                        </button>
                      ) : user.has_pending_request ? (
                        <button className="flex-1 bg-slate-700/50 text-slate-400 px-4 py-3 rounded-xl text-sm font-medium cursor-not-allowed border border-slate-600/50">
                          Request Pending
                        </button>
                      ) : user.request_sent_by_me ? (
                        <button className="flex-1 bg-slate-700/50 text-slate-400 px-4 py-3 rounded-xl text-sm font-medium cursor-not-allowed border border-slate-600/50">
                          Request Sent
                        </button>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Friend Requests
              </h2>
              <p className="text-slate-400">Manage your incoming connection requests</p>
            </div>
            {friendRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <UserPlus className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No pending requests</h3>
                  <p className="text-slate-400">You're all caught up! New requests will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div key={request.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-orange-500/30 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{request.sender_name.charAt(0)}</span>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{request.sender_name}</h3>
                          <p className="text-sm text-slate-400 mb-2">Wants to connect with you</p>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <p className="text-xs text-slate-500">
                              {new Date(request.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3 ml-4">
                        <button
                          onClick={() => acceptFriendRequest(request.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => rejectFriendRequest(request.id)}
                          className="bg-slate-700/50 text-slate-300 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 border border-slate-600/50"
                        >
                          <UserX className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                My Network
              </h2>
              <p className="text-slate-400">Your professional connections and friends</p>
            </div>
            {friends.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <UserCheck className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No connections yet</h3>
                  <p className="text-slate-400 mb-4">Start building your network by discovering people with similar interests</p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Discover People
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend) => (
                  <div key={friend.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/30 transition-all duration-200 group">
                    <div className="flex items-center mb-6">
                      <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{friend.name.charAt(0)}</span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{friend.name}</h3>
                        <p className="text-sm text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full inline-block">
                          {friend.job_preference}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-slate-300">
                        <div className="p-2 bg-slate-700/50 rounded-lg mr-3">
                          <MapPin className="w-4 h-4 text-green-400" />
                        </div>
                        <span>{friend.location}</span>
                      </div>
                      {friend.origin_country && (
                        <div className="flex items-center text-sm text-slate-300">
                          <div className="p-2 bg-slate-700/50 rounded-lg mr-3">
                            <Globe className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span>{friend.origin_country}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openChat(friend.id, friend.name)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Start Chat</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}