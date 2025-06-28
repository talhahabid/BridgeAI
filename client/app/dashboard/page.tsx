'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import {
  User,
  Briefcase,
  Upload,
  Search,
  Target,
  LogOut,
  FileText,
  TrendingUp,
  Users,
  Bell,
  Settings,
  Calendar,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react'

interface UserProfile {
  name: string
  email: string
  location: string
  job_preference: string
  origin_country?: string
  resume_text?: string
  resume_filename?: string
  qualification_path?: {
    progress: {
      completion_percentage: number
      total_steps: number
      completed_steps: number[]
    }
  }
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [appliedCount, setAppliedCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    fetchUserProfile()
  }, [router])

  useEffect(() => {
    const updateApplied = () => {
      const stored = parseInt(localStorage.getItem('appliedCount') || '0', 10)
      setAppliedCount(stored)
    }
    updateApplied()
    window.addEventListener('focus', updateApplied)
    return () => window.removeEventListener('focus', updateApplied)
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!token || !userId) {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        router.push('/')
        return
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/by-id/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Ensure all string fields are properly converted
      const userData = {
        ...response.data,
        name: String(response.data.name || ''),
        location: String(response.data.location || ''),
        job_preference: String(response.data.job_preference || ''),
        origin_country: response.data.origin_country ? String(response.data.origin_country) : '',
        resume_text: response.data.resume_text ? String(response.data.resume_text) : '',
        resume_filename: response.data.resume_filename ? String(response.data.resume_filename) : '',
        qualification_path: response.data.qualification_path
      }

      setUser(userData)
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        router.push('/')
      } else {
        toast.error('Failed to load profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    router.push('/')
    toast.success('Logged out successfully')
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
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 z-50">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 from-white-500 to-white-600 rounded-xl flex items-center justify-center">
              <img
                src="/images/logo.png"
                alt="BridgeAI Logo"
                className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.nextSibling instanceof HTMLElement) {
                    target.nextSibling.style.display = 'block';
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">BridgeAI</h1>
              <p className="text-xs text-slate-400">DASHBOARD</p>
            </div>
          </div>

          <nav className="space-y-2">
            <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl border border-blue-500/30">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Dashboard</span>
            </div>

            <button
              onClick={() => window.location.href = '/dashboard/resume'}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              <span>Resume</span>
            </button>

            <button
              onClick={() => window.location.href = '/dashboard/jobs'}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
            >
              <Search className="w-5 h-5" />
              <span>Job Search</span>
            </button>

            <button
              onClick={() => window.location.href = '/dashboard/qualifications'}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
            >
              <Target className="w-5 h-5" />
              <span>Qualifications</span>
            </button>

            <button
              onClick={() => window.location.href = '/dashboard/friends'}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
            >
              <Users className="w-5 h-5" />
              <span>Network</span>
            </button>

            <button
              onClick={() => window.location.href = '/dashboard/profile'}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* User Profile at Bottom */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{user?.name || 'User'}</p>
                <p className="text-slate-400 text-xs">{user?.job_preference || 'Job Seeker'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Hello {user?.name?.split(' ')[0] || 'User'}
                </h1>
                <p className="text-slate-400 flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{user?.location || 'Canada'}</span>
                </p>
              </div>
              <div className="flex items-center space-x-4">

                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="flex items-center space-x-3 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-white text-sm">{user?.name || 'User'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {user?.resume_text ? '1' : '0'}
                  </p>
                  <p className="text-xs text-slate-400">Resume</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${user?.resume_text ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <p className="text-sm text-slate-300">
                  {user?.resume_text ? 'Uploaded' : 'Not Uploaded'}
                </p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {user?.qualification_path?.progress?.completion_percentage || 0}%
                  </p>
                  <p className="text-xs text-slate-400">Progress</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${user?.qualification_path?.progress?.completion_percentage || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{appliedCount}</p>
                  <p className="text-xs text-slate-400">Applied</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <p className="text-sm text-slate-300">Jobs Applied</p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-orange-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-xs text-slate-400">Connections</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <p className="text-sm text-slate-300">Network</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all cursor-pointer group"
                    onClick={() => router.push('/dashboard/resume')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-500/30 rounded-xl">
                        <Upload className="w-6 h-6 text-blue-400" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Resume Upload</h4>
                    <p className="text-slate-400 text-sm">Upload and optimize your resume with AI analysis</p>
                  </div>

                  <div
                    className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all cursor-pointer group"
                    onClick={() => router.push('/dashboard/jobs')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-500/30 rounded-xl">
                        <Search className="w-6 h-6 text-green-400" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-green-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Job Search</h4>
                    <p className="text-slate-400 text-sm">Find relevant jobs across Canadian provinces</p>
                  </div>

                  <div
                    className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer group"
                    onClick={() => router.push('/dashboard/qualifications')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500/30 rounded-xl">
                        <Target className="w-6 h-6 text-purple-400" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Qualifications</h4>
                    <p className="text-slate-400 text-sm">Get certified in your professional field</p>
                  </div>

                  <div
                    className="bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all cursor-pointer group"
                    onClick={() => router.push('/dashboard/friends')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-orange-500/30 rounded-xl">
                        <Users className="w-6 h-6 text-orange-400" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Network</h4>
                    <p className="text-slate-400 text-sm">Connect with professionals in your field</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Profile & Tasks */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{user?.name || 'User'}</h3>
                  <p className="text-slate-400 text-sm">{user?.job_preference || 'Job Seeker'}</p>
                  <div className="flex items-center justify-center space-x-1 mt-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 text-sm">{user?.location || 'Canada'}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Edit Profile
                </button>
              </div>

              {/* Tasks */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-bold text-white mb-4">Tasks</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div className="flex-1">
                      <p className="text-white text-sm">Complete Profile</p>
                      <p className="text-slate-400 text-xs">Update your personal information</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-xl">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <div className="flex-1">
                      <p className="text-white text-sm">Upload Resume</p>
                      <p className="text-slate-400 text-xs">Add your latest resume</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-xl">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-white text-sm">Apply to Jobs</p>
                      <p className="text-slate-400 text-xs">Start your job search</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
