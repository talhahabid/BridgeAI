'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { 
  Brain, 
  CheckCircle, 
  Circle, 
  Clock, 
  DollarSign, 
  FileText, 
  Target, 
  TrendingUp,
  RefreshCw,
  Trash2,
  Calendar,
  MapPin,
  User,
  Building
} from 'lucide-react'

interface QualificationStep {
  step_number: number
  title: string
  description: string
  estimated_duration: string
  requirements: string[]
  cost_estimate: string
  resources: string[]
  notes: string
}

interface QualificationPath {
  job_title: string
  province: string
  estimated_total_time: string
  steps: QualificationStep[]
  summary: string
  important_notes: string[]
  regulatory_bodies: string[]
}

interface Progress {
  completed_steps: number[]
  total_steps: number
  completion_percentage: number
  started_at: string
  last_updated: string
}

interface QualificationData {
  qualification_path: QualificationPath
  progress: Progress
  generated_at: string
}

export default function QualificationsPage() {
  const [qualificationData, setQualificationData] = useState<QualificationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchQualificationPath()
  }, [])

  const fetchQualificationPath = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/qualifications/path`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQualificationData(response.data)
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No qualification path found, this is normal
        setQualificationData(null)
      } else if (error.response?.status === 401) {
        router.push('/')
      } else {
        toast.error('Failed to load qualification path')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateQualificationPath = async () => {
    setIsGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/qualifications/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setQualificationData(response.data)
      toast.success('Qualification path generated successfully!')
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail)
      } else {
        toast.error('Failed to generate qualification path')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const updateStepProgress = async (stepNumber: number, completed: boolean) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qualifications/progress?step_number=${stepNumber}&completed=${completed}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      // Update local state
      if (qualificationData) {
        setQualificationData({
          ...qualificationData,
          progress: response.data.progress
        })
      }
      
      toast.success(`Step ${stepNumber} ${completed ? 'completed' : 'marked as incomplete'}`)
    } catch (error: any) {
      toast.error('Failed to update progress')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteQualificationPath = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/qualifications/path`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setQualificationData(null)
      toast.success('Qualification path deleted successfully')
    } catch (error: any) {
      toast.error('Failed to delete qualification path')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
      <div className="max-w-6xl mx-auto px-4 py-8">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Qualification Pathway</h1>
              <p className="text-gray-600 mt-2">
                AI-generated step-by-step plan to qualify for your target job in Canada
              </p>
            </div>
            <div className="flex space-x-3">
              {qualificationData && (
                <button
                  onClick={deleteQualificationPath}
                  className="btn-secondary flex items-center text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Path
                </button>
              )}
              <button
                onClick={generateQualificationPath}
                disabled={isGenerating}
                className="btn-primary flex items-center"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                {isGenerating ? 'Generating...' : 'Generate New Path'}
              </button>
            </div>
          </div>
        </div>

        {!qualificationData ? (
          /* Generate Path Section */
          <div className="card text-center py-12">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Generate Your Qualification Path
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our AI will analyze your resume, job preference, and location to create a personalized 
              step-by-step plan for qualifying in your profession in Canada.
            </p>
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span>Profile Analysis</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-2" />
                <span>Resume Review</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Target className="w-4 h-4 mr-2" />
                <span>Job Requirements</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Province-Specific</span>
              </div>
            </div>
            <button
              onClick={generateQualificationPath}
              disabled={isGenerating}
              className="btn-primary flex items-center mx-auto"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Generating Your Path...' : 'Generate AI Path'}
            </button>
          </div>
        ) : (
          /* Qualification Path Display */
          <div className="space-y-8">
            {/* Path Overview */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {qualificationData.qualification_path.job_title}
                  </h2>
                  <p className="text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {qualificationData.qualification_path.province}, Canada
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Generated on</p>
                  <p className="font-medium">{formatDate(qualificationData.generated_at)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">
                    {qualificationData.progress.completed_steps.length} of {qualificationData.progress.total_steps} steps completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${qualificationData.progress.completion_percentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                  <span>{qualificationData.progress.completion_percentage}% Complete</span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Started {formatDate(qualificationData.progress.started_at)}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Last updated {formatDate(qualificationData.progress.last_updated)}
                    </span>
                  </div>
                </div>
                
                {/* Progress Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {qualificationData.progress.completed_steps.length}
                    </div>
                    <div className="text-xs text-gray-600">Steps Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {qualificationData.progress.total_steps - qualificationData.progress.completed_steps.length}
                    </div>
                    <div className="text-xs text-gray-600">Steps Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(qualificationData.progress.completion_percentage)}%
                    </div>
                    <div className="text-xs text-gray-600">Overall Progress</div>
                  </div>
                </div>
                
                {/* Progress Summary */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Progress Summary</h4>
                      <p className="text-sm text-gray-600">
                        {qualificationData.progress.completion_percentage === 0 && "You're just getting started! Complete your first step to begin your journey."}
                        {qualificationData.progress.completion_percentage > 0 && qualificationData.progress.completion_percentage < 25 && "Great start! Keep up the momentum and tackle the next step."}
                        {qualificationData.progress.completion_percentage >= 25 && qualificationData.progress.completion_percentage < 50 && "You're making excellent progress! You're well on your way to achieving your goals."}
                        {qualificationData.progress.completion_percentage >= 50 && qualificationData.progress.completion_percentage < 75 && "You're more than halfway there! Stay focused and keep pushing forward."}
                        {qualificationData.progress.completion_percentage >= 75 && qualificationData.progress.completion_percentage < 100 && "Almost there! You're in the final stretch of your qualification journey."}
                        {qualificationData.progress.completion_percentage === 100 && "Congratulations! You've completed all steps in your qualification path!"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Estimated completion</div>
                      <div className="font-medium text-gray-900">{qualificationData.qualification_path.estimated_total_time}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Path Summary</h3>
                <p className="text-blue-800">{qualificationData.qualification_path.summary}</p>
                <div className="flex items-center mt-3 text-sm text-blue-700">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Estimated Total Time: {qualificationData.qualification_path.estimated_total_time}</span>
                </div>
              </div>

              {/* Important Notes */}
              {qualificationData.qualification_path.important_notes.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
                  <ul className="space-y-1">
                    {qualificationData.qualification_path.important_notes.map((note, index) => (
                      <li key={index} className="text-yellow-800 text-sm flex items-start">
                        <span className="w-1 h-1 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regulatory Bodies */}
              {qualificationData.qualification_path.regulatory_bodies.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Regulatory Bodies</h3>
                  <div className="flex flex-wrap gap-2">
                    {qualificationData.qualification_path.regulatory_bodies.map((body, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        {body}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Steps */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Qualification Steps</h3>
              <div className="space-y-6">
                {qualificationData.qualification_path.steps.map((step) => {
                  const isCompleted = qualificationData.progress.completed_steps.includes(step.step_number)
                  const stepIndex = step.step_number - 1
                  const previousStepCompleted = stepIndex === 0 || qualificationData.progress.completed_steps.includes(step.step_number - 1)
                  const isNextStep = !isCompleted && previousStepCompleted
                  
                  return (
                    <div key={step.step_number} className={`border rounded-lg p-6 transition-all duration-300 ${
                      isCompleted 
                        ? 'border-green-200 bg-green-50 shadow-md' 
                        : isNextStep 
                          ? 'border-blue-200 bg-blue-50 shadow-sm' 
                          : 'border-gray-200 hover:shadow-md'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <button
                            onClick={() => updateStepProgress(step.step_number, !isCompleted)}
                            disabled={isUpdating}
                            className={`mt-1 p-1 rounded-full transition-colors ${
                              isCompleted 
                                ? 'text-green-600 hover:text-green-700' 
                                : isNextStep
                                  ? 'text-blue-600 hover:text-blue-700'
                                  : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                Step {step.step_number}: {step.title}
                              </h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                isCompleted 
                                  ? 'bg-green-100 text-green-800' 
                                  : isNextStep
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isCompleted ? 'Completed' : isNextStep ? 'Next Step' : 'Pending'}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4">{step.description}</p>
                            
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-2" />
                                <span>Duration: {step.estimated_duration}</span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <DollarSign className="w-4 h-4 mr-2" />
                                <span>Cost: {step.cost_estimate}</span>
                              </div>
                            </div>

                            {/* Step Progress Indicator */}
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Step Progress</span>
                                <span>{isCompleted ? '100%' : '0%'}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                  }`}
                                  style={{ width: isCompleted ? '100%' : '0%' }}
                                ></div>
                              </div>
                            </div>

                            {step.requirements.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium text-gray-900 mb-2">Requirements:</h5>
                                <ul className="space-y-1">
                                  {step.requirements.map((req, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {step.resources.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium text-gray-900 mb-2">Resources:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {step.resources.map((resource, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {resource}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {step.notes && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-1">Notes:</h5>
                                <p className="text-sm text-gray-600">{step.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 