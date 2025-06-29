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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 shadow-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-slate-200 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Connect with People</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-slate-700/50">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('discover')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'discover'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                Discover
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                Requests
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'friends'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                Friends
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'discover' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              People with the same job preference as you
            </h2>
            {discoverUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found with the same job preference</p>
                <p className="text-sm text-gray-400 mt-2">Make sure you've set your job preference in your profile</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoverUsers.map((user) => (
                  <div key={user.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.job_preference}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{user.location}</span>
                      </div>
                      {user.origin_country && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Globe className="w-4 h-4 mr-2" />
                          <span>{user.origin_country}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {user.is_friend ? (
                        <button
                          onClick={() => openChat(user.id, user.name)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center space-x-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Message</span>
                        </button>
                      ) : user.has_pending_request ? (
                        <button className="flex-1 bg-gray-300 text-gray-600 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
                          Request Pending
                        </button>
                      ) : user.request_sent_by_me ? (
                        <button className="flex-1 bg-gray-300 text-gray-600 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
                          Request Sent
                        </button>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center justify-center space-x-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Add Friend</span>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending Friend Requests
            </h2>
            {friendRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending friend requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{request.sender_name}</h3>
                          <p className="text-sm text-gray-600">Wants to connect with you</p>
                          <p className="text-xs text-gray-400">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptFriendRequest(request.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center space-x-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => rejectFriendRequest(request.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center space-x-2"
                        >
                          <UserX className="w-4 h-4" />
                          <span>Reject</span>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              My Friends
            </h2>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">You don't have any friends yet</p>
                <p className="text-sm text-gray-400 mt-2">Start by discovering people with similar interests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend) => (
                  <div key={friend.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{friend.name}</h3>
                        <p className="text-sm text-gray-600">{friend.job_preference}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{friend.location}</span>
                      </div>
                      {friend.origin_country && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Globe className="w-4 h-4 mr-2" />
                          <span>{friend.origin_country}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openChat(friend.id, friend.name)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center space-x-2"
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