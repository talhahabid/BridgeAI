'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Check, Eye, Download, Target, Loader2, Star, FileEdit, FilePlus, ExternalLink } from 'lucide-react'

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
  const [showPreview, setShowPreview] = useState(false)
  const [showATSEvaluation, setShowATSEvaluation] = useState(false)
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false)
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

      // Add preview URLs to the documents
      const documentsWithPreview = response.data.files.map((doc: GeneratedDocument) => ({
        ...doc,
        previewUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/resumes/download-generated/${doc.path}`
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

  const showDocumentPreview = (previewUrl: string) => {
    setPreviewDocument(previewUrl)
  }

  const closePreview = () => {
    setPreviewDocument(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Loading resume data...</p>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Resume Management</h1>
          <p className="text-gray-600 mt-2">
            Upload your resume to get AI-powered analysis, keyword extraction, ATS optimization, and generate tailored documents
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
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
                <p className="text-gray-600">Processing your resume...</p>
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
                    onClick={() => setShowDocumentGenerator(!showDocumentGenerator)}
                    className="btn-primary flex items-center"
                  >
                    <FilePlus className="w-4 h-4 mr-2" />
                    Generate Documents
                  </button>
                  <button
                    onClick={() => setShowATSEvaluation(!showATSEvaluation)}
                    className="btn-secondary flex items-center"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    ATS Evaluation
                  </button>
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

            {/* Document Generator Section */}
            {showDocumentGenerator && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileEdit className="w-5 h-5 mr-2 text-primary-600" />
                  AI-Powered Document Generator
                </h2>
                <p className="text-gray-600 mb-6">
                  Generate tailored cover letters and optimized resumes using AI, formatted professionally with ReportLab.
                </p>
                <p className="text-sm text-gray-500 mb-4 bg-green-50 p-3 rounded-lg">
                  🎯 <strong>How it works:</strong> Our AI analyzes your resume and the job description to create personalized documents that follow Canadian standards and are optimized for ATS systems.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here to generate tailored documents..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black min-h-32"
                      rows={8}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black"
                    >
                      <option value="both">Cover Letter & Optimized Resume</option>
                      <option value="cover_letter">Cover Letter Only</option>
                      <option value="optimized_resume">Optimized Resume Only</option>
                    </select>
                  </div>

                  <button
                    onClick={generateDocuments}
                    disabled={isGenerating || !jobDescription.trim()}
                    className="btn-primary flex items-center justify-center w-full"
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
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FilePlus className="w-5 h-5 mr-2 text-green-600" />
                      Generated Documents
                    </h3>
                    <div className="space-y-3">
                      {generatedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-green-600 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.filename}</p>
                              <p className="text-sm text-gray-500 capitalize">{doc.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => showDocumentPreview(doc.previewUrl!)}
                              className="btn-secondary flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </button>
                            <button
                              onClick={() => downloadGeneratedDocument(doc.path, doc.filename)}
                              className="btn-secondary flex items-center"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
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
            {showATSEvaluation && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary-600" />
                  ATS Resume Evaluation
                </h2>
                <p className="text-gray-600 mb-6">
                  Get AI-powered feedback on how well your resume matches a specific job description and passes through Applicant Tracking Systems.
                </p>
                <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg">
                  💡 <strong>How it works:</strong> Our AI analyzes your resume against the job description using advanced ATS screening technology. This process happens automatically in the background and typically takes 30-60 seconds.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here to evaluate your resume against it..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black min-h-32"
                      rows={8}
                    />
                  </div>

                  <button
                    onClick={evaluateATS}
                    disabled={isEvaluating || !jobDescription.trim()}
                    className="btn-primary flex items-center justify-center w-full"
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
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-blue-600" />
                      ATS Evaluation Results
                    </h3>
                    <div className="space-y-3">
                      {atsEvaluation.feedback.map((feedback, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-gray-700 text-sm leading-relaxed">{feedback}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs text-gray-500">
                        <strong>Resume:</strong> {atsEvaluation.resume_filename} | 
                        <strong> Job:</strong> {atsEvaluation.job_description_preview}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

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

      {/* PDF Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = previewDocument
                    link.target = '_blank'
                    link.click()
                  }}
                  className="btn-secondary flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </button>
                <button
                  onClick={closePreview}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={previewDocument}
                className="w-full h-full border rounded"
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 