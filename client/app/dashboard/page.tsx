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
  TrendingUp
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">ImmigrantJobFinder</h1>
              <span className="text-sm text-gray-500">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name || 'User'}</span>
              <button
                onClick={() => router.push('/dashboard/profile')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'User'}!
          </h2>
          <p className="text-gray-600">
            Ready to find your dream job in Canada? Let's get started.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resume Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.resume_text ? 'Uploaded' : 'Not Uploaded'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Target Job</p>
                <p className="text-lg font-bold text-gray-900">
                  {user?.job_preference || 'Not Set'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Qualification Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.qualification_path?.progress?.completion_percentage || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Search className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Jobs Applied</p>
                <p className="text-2xl font-bold text-gray-900">{appliedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Resume Upload */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => router.push('/dashboard/resume')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Resume Upload</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Upload your resume to get AI-powered analysis and keyword extraction
            </p>
            <div className="flex items-center text-sm text-blue-600">
              <span>Get Started</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Job Search */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => router.push('/dashboard/jobs')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Job Search</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Search for jobs in your field across Canadian provinces
            </p>
            <div className="flex items-center text-sm text-green-600">
              <span>Browse Jobs</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Qualification Pathway */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => router.push('/dashboard/qualifications')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Qualification Pathway</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Get step-by-step guidance to become qualified in your profession
            </p>
            <div className="flex items-center text-sm text-purple-600">
              <span>View Pathway</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Profile */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => router.push('/dashboard/profile')}>
            <div className="flex items-center mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <User className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Profile</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Update your personal information and preferences
            </p>
            <div className="flex items-center text-sm text-orange-600">
              <span>Edit Profile</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

       

          
        </div>
      </div>
    </div>
  )
} 