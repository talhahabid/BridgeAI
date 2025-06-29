'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Check, Eye, Download, ArrowLeft, Sparkles, Zap, Award } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white mb-6 group transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl border border-blue-500/30">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Resume Management</h1>
              <p className="text-slate-400 mt-1">
                Upload your resume to get AI-powered analysis and keyword extraction
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {!resumeData?.has_resume && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/30 mb-4">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">AI-Powered Analysis</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload Your Resume</h2>
              <p className="text-slate-400">Get instant insights and keyword extraction powered by AI</p>
            </div>

            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragActive
                  ? 'border-blue-500 bg-blue-500/10 scale-105'
                  : 'border-slate-600 hover:border-blue-500/50 hover:bg-slate-700/30'
                }`}
            >
              <input {...getInputProps()} />

              {/* Upload Icon with Animation */}
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30 transition-all duration-300 ${isDragActive ? 'scale-110 rotate-3' : ''
                }`}>
                <Upload className={`w-10 h-10 text-blue-400 transition-all duration-300 ${isDragActive ? 'scale-110' : ''
                  }`} />
              </div>

              {isDragActive ? (
                <div>
                  <p className="text-blue-400 font-semibold text-lg mb-2">Drop your PDF resume here</p>
                  <p className="text-slate-400">Release to upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-white font-semibold text-lg mb-2">
                    Drag and drop your PDF resume here
                  </p>
                  <p className="text-slate-400 mb-4">
                    or click to browse and select your file
                  </p>
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 text-sm">PDF files only • Max 10MB</span>
                  </div>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-3 px-6 py-3 bg-slate-700/50 rounded-2xl border border-slate-600">
                  <div className="relative">
                    <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-6 h-6 border-2 border-purple-400/30 border-b-purple-400 rounded-full animate-spin animate-reverse"></div>
                  </div>
                  <span className="text-white font-medium">Processing your resume with AI...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resume Data Display */}
        {resumeData?.has_resume && (
          <div className="space-y-8">
            {/* Resume Info Header */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-2xl border border-green-500/30">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Resume Analysis Complete</h2>
                    <p className="text-slate-400">AI-powered insights and keyword extraction</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl border border-slate-600 transition-all text-white"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                  </button>
                  <button
                    onClick={removeResume}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/30 transition-all text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* File Information */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span>File Information</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Filename</span>
                      <span className="text-white font-medium">{resumeData.resume_filename}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 font-medium">Successfully Parsed</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Content Length</span>
                      <span className="text-white font-medium">{resumeData.resume_text?.length || 0} characters</span>
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span>Extracted Keywords</span>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                      {resumeData.resume_keywords?.length || 0}
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {resumeData.resume_keywords?.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 text-sm rounded-full border border-blue-500/30 hover:border-blue-400/50 transition-all"
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
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                  <Eye className="w-6 h-6 text-blue-400" />
                  <span>Full Resume Text</span>
                </h3>
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-600/50">
                  <div className="max-h-96 overflow-y-auto">
                    <div className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {resumeData.resume_text}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-600/50 flex items-center justify-between text-sm text-slate-400">
                    <span>Characters: {resumeData.resume_text.length.toLocaleString()}</span>
                    <span>Keywords: {resumeData.resume_keywords?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Structured Content */}
            {resumeData.resume_structured && Object.keys(resumeData.resume_structured).length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                  <Award className="w-6 h-6 text-orange-400" />
                  <span>Resume Sections</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(resumeData.resume_structured).map(([section, content]) => (
                    <div key={section} className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50 hover:border-slate-500/50 transition-all">
                      <h4 className="text-lg font-semibold text-white mb-4 capitalize flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                        <span>{section.replace('_', ' ')}</span>
                      </h4>
                      <div className="bg-slate-900/30 rounded-lg p-4 max-h-40 overflow-y-auto border border-slate-600/30">
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                          {content}
                        </pre>
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