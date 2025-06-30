'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Check, Eye, Download, ArrowLeft, Sparkles, Zap, Award, Target, Loader2, Star, FileEdit, FilePlus, ExternalLink } from 'lucide-react'

interface ResumeData {
  resume_text: string
  resume_filename: string
  resume_structured: Record<string, string>
  resume_keywords: string[]
  has_resume: boolean
}

interface ATSEvaluation {
  success: boolean
  feedback: string[]
  resume_filename: string
  job_description_preview: string
}

interface GeneratedDocument {
  type: string
  filename: string
  path: string
  previewUrl?: string
}

export default function ResumePage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'generate' | 'ats' | 'preview'>('generate')
  const [jobDescription, setJobDescription] = useState('')
  const [atsEvaluation, setAtsEvaluation] = useState<ATSEvaluation | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [documentType, setDocumentType] = useState('both')
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])
  const [previewDocument, setPreviewDocument] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchResumeData()
  }, [])

  const fetchResumeData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/resumes/content`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResumeData(response.data)
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/')
      } else {
        console.error('Error fetching resume data:', error)
      }
    } finally {
      setIsLoading(false)
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
      console.error('Upload error:', error)
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
      setAtsEvaluation(null)
      setGeneratedDocuments([])
      setPreviewDocument(null)
    } catch (error: any) {
      console.error('Remove error:', error)
      toast.error('Failed to remove resume')
    }
  }

  const evaluateATS = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description')
      return
    }

    if (!resumeData?.has_resume) {
      toast.error('Please upload a resume first')
      return
    }

    setIsEvaluating(true)
    try {
      const token = localStorage.getItem('token')
      
      // Get the resume file from the server
      const resumeResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/resumes/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      // Check if we got a valid PDF file
      if (resumeResponse.data.type !== 'application/pdf' && resumeResponse.data.size === 0) {
        toast.error('Resume file not found. Please upload your resume again.')
        return
      }

      // Create a file from the blob
      const resumeFile = new File([resumeResponse.data], resumeData.resume_filename, {
        type: 'application/pdf'
      })

      // Create form data for ATS evaluation
      const formData = new FormData()
      formData.append('resume_file', resumeFile)
      formData.append('job_description', jobDescription)

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resumes/ats-evaluate`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      setAtsEvaluation(response.data)
      toast.success('ATS evaluation completed!')
    } catch (error: any) {
      console.error('ATS evaluation error:', error)
      if (error.response?.status === 404) {
        toast.error('Resume file not found. Please upload your resume again.')
      } else if (error.response?.status === 500 && error.response?.data?.detail?.includes('Chrome driver')) {
        toast.error('ATS evaluation service is not available. Please try again later.')
      } else {
        toast.error(error.response?.data?.detail || 'Failed to evaluate resume')
      }
    } finally {
      setIsEvaluating(false)
    }
  }

  const generateDocuments = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description')
      return
    }

    if (!resumeData?.has_resume) {
      toast.error('Please upload a resume first')
      return
    }

    setIsGenerating(true)
    try {
      const token = localStorage.getItem('token')
      
      const formData = new FormData()
      formData.append('job_description', jobDescription)
      formData.append('document_type', documentType)

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resumes/generate-documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      // Add preview URLs to the documents with authentication
      const documentsWithPreview = response.data.files.map((doc: GeneratedDocument) => ({
        ...doc,
        previewUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/resumes/preview-generated/${doc.path}`
      }))

      setGeneratedDocuments(documentsWithPreview)
      toast.success(response.data.message)
    } catch (error: any) {
      console.error('Document generation error:', error)
      toast.error(error.response?.data?.detail || 'Failed to generate documents')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadGeneratedDocument = async (filePath: string, filename: string) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resumes/download-generated/${filePath}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      )

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Document downloaded successfully!')
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error('Failed to download document')
    }
  }

  const showDocumentPreview = async (previewUrl: string) => {
    try {
      const token = localStorage.getItem('token')
      
      // Create authenticated URL for iframe
      const authenticatedUrl = `${previewUrl}?token=${encodeURIComponent(token!)}`
      setPreviewDocument(authenticatedUrl)
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to load preview')
    }
  }

  const closePreview = () => {
    setPreviewDocument(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-12 h-12 border-2 border-purple-400/30 border-b-purple-400 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="text-slate-400">Loading resume data...</p>
        </div>
      </div>
    )
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
                Upload your resume to get AI-powered analysis, keyword extraction, ATS optimization, and generate tailored documents
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
                    onClick={() => setActiveTab('generate')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all text-white ${activeTab === 'generate' ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/30' : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50'}`}
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>Generate Documents</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('ats')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all text-white ${activeTab === 'ats' ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/30' : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50'}`}
                  >
                    <Target className="w-4 h-4" />
                    <span>ATS Evaluation</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all text-white ${activeTab === 'preview' ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/30' : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50'}`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Show Preview</span>
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
            </div>

            {/* Document Generator Section */}
            {activeTab === 'generate' && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <FileEdit className="w-5 h-5 mr-2 text-blue-400" />
                  AI-Powered Document Generator
                </h2>
                <p className="text-slate-400 mb-6">
                  Generate tailored cover letters and optimized resumes using AI, formatted professionally with ReportLab.
                </p>
                <p className="text-sm text-slate-400 mb-4 bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                  🎯 <strong>How it works:</strong> Our AI analyzes your resume and the job description to create personalized documents that follow Canadian standards and are optimized for ATS systems.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here to generate tailored documents..."
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 min-h-32"
                      rows={8}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Document Type
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    >
                      <option value="both">Cover Letter & Optimized Resume</option>
                      <option value="cover_letter">Cover Letter Only</option>
                      <option value="optimized_resume">Optimized Resume Only</option>
                    </select>
                  </div>

                  <button
                    onClick={generateDocuments}
                    disabled={isGenerating || !jobDescription.trim()}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-200"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Documents with AI...
                      </>
                    ) : (
                      <>
                        <FileEdit className="w-4 h-4 mr-2" />
                        Generate Tailored Documents
                      </>
                    )}
                  </button>
                </div>

                {/* Generated Documents */}
                {generatedDocuments.length > 0 && (
                  <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <FilePlus className="w-5 h-5 mr-2 text-green-400" />
                      Generated Documents
                    </h3>
                    <div className="space-y-3">
                      {generatedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-green-400 mr-3" />
                            <div>
                              <p className="font-medium text-white">{doc.filename}</p>
                              <p className="text-sm text-slate-400 capitalize">{doc.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => showDocumentPreview(doc.previewUrl!)}
                              className="flex items-center space-x-2 px-3 py-2 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg border border-slate-500/50 transition-all text-white"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Preview</span>
                            </button>
                            <button
                              onClick={() => downloadGeneratedDocument(doc.path, doc.filename)}
                              className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-all text-blue-300"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ATS Evaluation Section */}
            {activeTab === 'ats' && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-400" />
                  ATS Resume Evaluation
                </h2>
                <p className="text-slate-400 mb-6">
                  Get AI-powered feedback on how well your resume matches a specific job description and passes through Applicant Tracking Systems.
                </p>
                <p className="text-sm text-slate-400 mb-4 bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
                  💡 <strong>How it works:</strong> Our AI analyzes your resume against the job description using advanced ATS screening technology. This process happens automatically in the background and typically takes 30-60 seconds.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here to evaluate your resume against it..."
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 min-h-32"
                      rows={8}
                    />
                  </div>

                  <button
                    onClick={evaluateATS}
                    disabled={isEvaluating || !jobDescription.trim()}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-200"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Resume with AI...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Evaluate Resume for ATS
                      </>
                    )}
                  </button>
                </div>

                {/* ATS Evaluation Results */}
                {atsEvaluation && (
                  <div className="mt-6 p-6 bg-slate-900/60 rounded-2xl border border-blue-500/30 shadow-lg">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <Star className="w-6 h-6 text-blue-400" />
                      ATS Evaluation Results
                    </h3>
                    <div className="space-y-4">
                      {/* Try to extract and style key sections if present in feedback */}
                      {(() => {
                        // Join feedback into a single string for parsing
                        const feedbackText = Array.isArray(atsEvaluation.feedback) ? atsEvaluation.feedback.join('\n') : '';
                        // Regex for Match Percentage
                        const match = feedbackText.match(/Match Percentage: (\d+)%/);
                        // Regex for Missing Keywords
                        const missing = feedbackText.match(/Missing Keywords:([\s\S]*?)\n\n/);
                        // Regex for Final Thoughts
                        const final = feedbackText.match(/Final Thoughts:[\s\S]*?\n\n/);
                        // Regex for Recommendations
                        const recs = feedbackText.match(/Recommendations:[\s\S]*/);
                        return (
                          <>
                            {match && (() => {
                              const percent = parseInt(match[1], 10);
                              let rank = '';
                              let rankColor = '';
                              if (percent < 50) {
                                rank = 'Needs Improvement';
                                rankColor = 'bg-red-500/20 text-red-400 border-red-500/30';
                              } else if (percent < 75) {
                                rank = 'Average';
                                rankColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                              } else if (percent < 90) {
                                rank = 'Good';
                                rankColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                              } else {
                                rank = 'Excellent';
                                rankColor = 'bg-green-500/20 text-green-400 border-green-500/30';
                              }
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-semibold text-blue-300">Match Percentage:</span>
                                  <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full font-bold text-lg border border-blue-500/30">{percent}%</span>
                                  <span className={`inline-block px-3 py-1 rounded-full font-semibold text-sm border ml-2 ${rankColor}`}>{rank}</span>
                                </div>
                              );
                            })()}
                            {missing && (
                              <div>
                                <div className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
                                  <Zap className="w-5 h-5 text-purple-400" />
                                  Missing Keywords
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {missing[1].split(',').map((kw, i) => (
                                    <span key={i} className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-200 text-sm rounded-full border border-blue-500/30">
                                      {kw.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {final && (
                              <div>
                                <div className="text-lg font-semibold text-green-300 mb-1 flex items-center gap-2">
                                  <Award className="w-5 h-5 text-orange-400" />
                                  Final Thoughts
                                </div>
                                <div className="bg-slate-800/60 rounded-lg p-4 border border-green-500/20 text-slate-200 text-sm whitespace-pre-line">
                                  {final[0].replace('Final Thoughts:', '').trim()}
                                </div>
                              </div>
                            )}
                            {recs && (
                              <div>
                                <div className="text-lg font-semibold text-yellow-300 mb-1 flex items-center gap-2">
                                  <Target className="w-5 h-5 text-yellow-400" />
                                  Recommendations
                                </div>
                                <div className="bg-slate-800/60 rounded-lg p-4 border border-yellow-500/20 text-slate-200 text-sm whitespace-pre-line">
                                  <ul className="list-none space-y-2 pl-0">
                                    {recs[0]
                                      .replace('Recommendations:', '')
                                      .trim()
                                      .split(/\.(?=(?!\d)|\")/) // split at period not followed by a digit or at period followed by a double quote
                                      .map((rec, i) => rec.trim())
                                      .filter(Boolean)
                                      .map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="mt-1 w-2 h-2 bg-yellow-400 rounded-full inline-block flex-shrink-0"></span>
                                          <span>{rec}{rec.endsWith('.') ? '' : '.'}</span>
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                            {/* If parsing fails, fallback to original feedback */}
                            {!match && !missing && !final && !recs && (
                              <div className="space-y-2">
                                {Array.isArray(atsEvaluation.feedback) && atsEvaluation.feedback.length > 0 ? (
                                  atsEvaluation.feedback.map((feedback, index) => (
                                    <div key={index} className="text-slate-300 text-sm leading-relaxed">{feedback}</div>
                                  ))
                                ) : (
                                  <div className="text-slate-400 text-sm">No feedback available yet.</div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="mt-6 pt-4 border-t border-blue-500/30">
                      <p className="text-xs text-slate-400">
                        <strong>Resume:</strong> {atsEvaluation.resume_filename} | 
                        <strong> Job:</strong> {atsEvaluation.job_description_preview}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resume PDF Preview */}
            {activeTab === 'preview' && resumeData?.has_resume && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                  <Eye className="w-6 h-6 text-blue-400" />
                  <span>Resume PDF Preview</span>
                </h3>
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-600/50 flex justify-center">
                  <iframe
                    src={`${process.env.NEXT_PUBLIC_API_URL}/api/resumes/preview?token=${encodeURIComponent(localStorage.getItem('token') || '')}`}
                    className="w-full h-[80vh] border border-slate-600 rounded-lg"
                    title="Resume PDF Preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col border border-slate-600">
            <div className="flex items-center justify-between p-4 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white">Document Preview</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = previewDocument
                    link.target = '_blank'
                    link.click()
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg border border-slate-500/50 transition-all text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in New Tab</span>
                </button>
                <button
                  onClick={closePreview}
                  className="px-3 py-2 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg border border-slate-500/50 transition-all text-white"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={previewDocument}
                className="w-full h-full border border-slate-600 rounded-lg"
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}