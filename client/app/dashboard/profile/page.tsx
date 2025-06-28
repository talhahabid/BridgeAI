'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import { Upload, User, Briefcase, MapPin, Globe, Save, Eye, X } from 'lucide-react'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Update your personal information and resume
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Canadian Province)
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Preference
                  </label>
                  <input
                    type="text"
                    name="job_preference"
                    value={formData.job_preference}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black"
                    placeholder="e.g., Software Developer, Data Analyst"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    name="origin_country"
                    value={formData.origin_country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black"
                    placeholder="e.g., India, China, Philippines"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>

          {/* Resume Section */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Resume Management
              </h2>

              {!profile?.resume_text ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Upload your resume to get AI-powered analysis and keyword extraction
                  </p>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    {isDragActive ? (
                      <p className="text-primary-600 font-medium">Drop your PDF resume here</p>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-1">
                          Drag and drop your PDF resume here, or click to select
                        </p>
                        <p className="text-sm text-gray-500">
                          Maximum file size: 10MB
                        </p>
                      </div>
                    )}
                  </div>
                  {isUploading && (
                    <div className="mt-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Processing your resume...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium text-green-800">{profile.resume_filename}</p>
                        <p className="text-sm text-green-600">Resume uploaded successfully</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowResumePreview(!showResumePreview)}
                        className="btn-secondary flex items-center text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {showResumePreview ? 'Hide' : 'Preview'}
                      </button>
                      <button
                        onClick={removeResume}
                        className="btn-secondary flex items-center text-sm text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {showResumePreview && profile.resume_text && (
                    <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                      <h4 className="font-medium text-gray-900 mb-2">Resume Preview</h4>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {profile.resume_text.substring(0, 500)}...
                      </div>
                    </div>
                  )}

                  {profile.resume_keywords && profile.resume_keywords.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Extracted Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.resume_keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload new resume */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3">Upload a new resume to replace the current one:</p>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {isDragActive ? 'Drop new PDF here' : 'Click to upload new resume'}
                      </p>
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