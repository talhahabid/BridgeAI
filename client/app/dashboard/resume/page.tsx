'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Check, Eye, Download } from 'lucide-react'

interface ResumeData {
  resume_text: string
  resume_filename: string
  resume_structured: Record<string, string>
  resume_keywords: string[]
  has_resume: boolean
}

export default function ResumePage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchResumeData()
  }, [])

  const fetchResumeData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/resumes/content`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResumeData(response.data)
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/')
      }
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
      fetchResumeData()
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
      setResumeData(null)
    } catch (error: any) {
      toast.error('Failed to remove resume')
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Resume Management</h1>
          <p className="text-gray-600 mt-2">
            Upload your resume to get AI-powered analysis and keyword extraction
          </p>
        </div>

        {/* Upload Section */}
        {!resumeData?.has_resume && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Resume</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-primary-600 font-medium">Drop your PDF resume here</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Processing your resume...</p>
              </div>
            )}
          </div>
        )}

        {/* Resume Data Display */}
        {resumeData?.has_resume && (
          <div className="space-y-6">
            {/* Resume Info */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Resume Analysis</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="btn-secondary flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </button>
                  <button
                    onClick={removeResume}
                    className="btn-secondary flex items-center text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">File Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{resumeData.resume_filename}</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">Successfully parsed</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Extracted Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.resume_keywords?.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Text Preview */}
            {showPreview && resumeData.resume_text && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Full Resume Text</h3>
                <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {resumeData.resume_text}
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Text length: {resumeData.resume_text.length} characters</p>
                  <p>Keywords found: {resumeData.resume_keywords?.length || 0}</p>
                </div>
              </div>
            )}

            {/* Structured Content with better display */}
            {resumeData.resume_structured && Object.keys(resumeData.resume_structured).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Sections</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(resumeData.resume_structured).map(([section, content]) => (
                    <div key={section} className="border rounded-lg p-4 bg-white">
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">
                        {section.replace('_', ' ')}
                      </h4>
                      <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans">{content}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 