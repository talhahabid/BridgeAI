'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  User,
  Briefcase,
  MapPin,
  Globe,
  Save,
  Eye,
  X,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Camera
} from 'lucide-react'

interface UserProfile {
  _id: string
  name: string
  email: string
  location: string
  job_preference: string
  origin_country: string
  resume_text: string
  resume_filename: string
  resume_structured: Record<string, string>
  resume_keywords: string[]
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showResumePreview, setShowResumePreview] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    job_preference: '',
    origin_country: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!token || !userId) {
        router.push('/')
        return
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/by-id/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Ensure all string fields are properly converted
      const profileData = {
        ...response.data,
        name: String(response.data.name || ''),
        location: String(response.data.location || ''),
        job_preference: String(response.data.job_preference || ''),
        origin_country: response.data.origin_country ? String(response.data.origin_country) : '',
        resume_text: response.data.resume_text ? String(response.data.resume_text) : '',
        resume_filename: response.data.resume_filename ? String(response.data.resume_filename) : '',
        resume_keywords: Array.isArray(response.data.resume_keywords)
          ? response.data.resume_keywords.map((k: any) => String(k))
          : []
      }

      setProfile(profileData)
      setFormData({
        name: profileData.name,
        location: profileData.location,
        job_preference: profileData.job_preference,
        origin_country: profileData.origin_country
      })
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/')
      } else {
        toast.error('Failed to load profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!token || !userId) {
        router.push('/')
        return
      }

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/by-id/${userId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      toast.success('Profile updated successfully!')
      fetchProfile() // Refresh profile data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resumes/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      toast.success('Resume uploaded and parsed successfully!')
      fetchProfile() // Refresh profile data
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload resume')
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  const removeResume = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/resumes/remove`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Resume removed successfully')
      fetchProfile() // Refresh profile data
    } catch (error: any) {
      toast.error('Failed to remove resume')
    }
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
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                <p className="text-slate-400">Manage your personal information and resume</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {profile?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 sticky top-24">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-3xl">
                      {profile?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{profile?.name || 'User'}</h2>
                <p className="text-slate-400 text-sm mb-2">{profile?.email}</p>
                <div className="flex items-center justify-center space-x-4 text-sm text-slate-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile?.location || 'Not specified'}</span>
                  </div>
                  {profile?.origin_country && (
                    <div className="flex items-center space-x-1">
                      <Globe className="w-4 h-4" />
                      <span>{profile.origin_country}</span>
                    </div>
                  )}
                </div>
              </div>

              

              {/* Resume Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-white text-sm">Resume</span>
                  </div>
                  {profile?.resume_text ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-purple-400" />
                    <span className="text-white text-sm">Personal Info</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Personal Information</h2>
                  <p className="text-slate-400 text-sm">Update your basic profile details</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/30 rounded-xl text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-2">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Canadian Province
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  >
                    <option value="">Select a province</option>
                    <option value="Alberta">Alberta</option>
                    <option value="British Columbia">British Columbia</option>
                    <option value="Manitoba">Manitoba</option>
                    <option value="New Brunswick">New Brunswick</option>
                    <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                    <option value="Nova Scotia">Nova Scotia</option>
                    <option value="Ontario">Ontario</option>
                    <option value="Prince Edward Island">Prince Edward Island</option>
                    <option value="Quebec">Quebec</option>
                    <option value="Saskatchewan">Saskatchewan</option>
                    <option value="Northwest Territories">Northwest Territories</option>
                    <option value="Nunavut">Nunavut</option>
                    <option value="Yukon">Yukon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Job Preference
                  </label>
                  <input
                    type="text"
                    name="job_preference"
                    value={formData.job_preference}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="e.g., Software Developer, Data Analyst"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    name="origin_country"
                    value={formData.origin_country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="e.g., India, China, Philippines"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

            {/* Resume Management */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Briefcase className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Resume Management</h2>
                  <p className="text-slate-400 text-sm">Upload and manage your professional resume</p>
                </div>
              </div>

              {!profile?.resume_text ? (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Resume Uploaded</h3>
                    <p className="text-slate-400 mb-6">
                      Upload your resume to get AI-powered analysis and keyword extraction
                    </p>
                  </div>

                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-slate-600/50 hover:border-purple-500/30 hover:bg-purple-500/5'
                      }`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-10 h-10 text-purple-400" />
                      </div>
                      {isDragActive ? (
                        <div>
                          <p className="text-purple-400 font-medium text-lg">Drop your PDF resume here</p>
                          <p className="text-slate-400">Release to upload</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white font-medium text-lg mb-2">
                            Drag and drop your PDF resume here
                          </p>
                          <p className="text-slate-400 mb-2">or click to browse files</p>
                          <p className="text-sm text-slate-500">
                            Maximum file size: 10MB • PDF format only
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUploading && (
                    <div className="text-center py-6">
                      <div className="relative inline-block">
                        <div className="w-8 h-8 border-4 border-purple-400/20 border-t-purple-400 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-slate-300 mt-3 font-medium">Processing your resume...</p>
                      <p className="text-slate-400 text-sm">This may take a moment</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Resume Status */}
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-2xl border border-green-500/30">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-100 text-lg">{profile.resume_filename}</p>
                        <p className="text-green-300 text-sm">Resume uploaded and processed successfully</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowResumePreview(!showResumePreview)}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{showResumePreview ? 'Hide' : 'Preview'}</span>
                      </button>
                      <button
                        onClick={removeResume}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Resume Preview */}
                  {showResumePreview && profile.resume_text && (
                    <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                      <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span>Resume Preview</span>
                      </h4>
                      <div className="bg-slate-800/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                        <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {profile.resume_text.substring(0, 1000)}
                          {profile.resume_text.length > 1000 && '...'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {profile.resume_keywords && profile.resume_keywords.length > 0 && (
                    <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                      <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span>Extracted Keywords</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.resume_keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 text-blue-300 text-sm rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload New Resume */}
                  <div className="border-t border-slate-600/30 pt-6">
                    <h4 className="font-medium text-white mb-4">Replace Resume</h4>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-slate-600/50 hover:border-purple-500/30'
                        }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-300 mb-1">
                        {isDragActive ? 'Drop new PDF here' : 'Click to upload new resume'}
                      </p>
                      <p className="text-slate-500 text-sm">This will replace your current resume</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}