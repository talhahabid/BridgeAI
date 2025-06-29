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
  Building,
  ChevronLeft,
  Sparkles,
  Award,
  BookOpen,
  Users,
  ExternalLink
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-400/20 border-t-purple-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-400/20 border-b-blue-400 rounded-full animate-spin animate-reverse"></div>
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
            className="flex items-center text-slate-400 hover:text-white mb-6 transition-all group"
          >
            <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Qualification Pathway</h1>
                  <p className="text-slate-400">AI-powered step-by-step plan for your Canadian career journey</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {qualificationData && (
                <button
                  onClick={deleteQualificationPath}
                  className="flex items-center space-x-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Path</span>
                </button>
              )}
              <button
                onClick={generateQualificationPath}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span>{isGenerating ? 'Generating...' : 'Generate AI Path'}</span>
              </button>
            </div>
          </div>
        </div>

        {!qualificationData ? (
          /* Generate Path Section */
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12 border border-slate-700/50 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                <Brain className="w-12 h-12 text-purple-400" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Generate Your AI-Powered Qualification Path
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                Our advanced AI analyzes your profile, resume, and career goals to create a personalized
                roadmap for professional qualification in Canada.
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Profile Analysis</h3>
                  <p className="text-slate-400 text-sm">Deep analysis of your background and experience</p>
                </div>

                <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Resume Review</h3>
                  <p className="text-slate-400 text-sm">Comprehensive evaluation of your skills and qualifications</p>
                </div>

                <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Job Requirements</h3>
                  <p className="text-slate-400 text-sm">Industry-specific requirements and standards</p>
                </div>

                <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Province-Specific</h3>
                  <p className="text-slate-400 text-sm">Tailored to your target province's regulations</p>
                </div>
              </div>

              <button
                onClick={generateQualificationPath}
                disabled={isGenerating}
                className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-2xl transition-all mx-auto text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Generating Your Personalized Path...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Generate My AI Path</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Qualification Path Display */
          <div className="space-y-8">
            {/* Path Overview */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl border border-purple-500/30">
                    <Award className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {qualificationData.qualification_path.job_title}
                    </h2>
                    <p className="text-slate-400 flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-2" />
                      {qualificationData.qualification_path.province}, Canada
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Generated on</p>
                  <p className="font-medium text-white">{formatDate(qualificationData.generated_at)}</p>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Your Progress</h3>
                  <span className="text-slate-400">
                    {qualificationData.progress.completed_steps.length} of {qualificationData.progress.total_steps} steps completed
                  </span>
                </div>

                <div className="flex items-center space-x-8 mb-6">
                  {/* Circular progress */}
                  <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="rgb(51 65 85)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - qualificationData.progress.completion_percentage / 100)}`}
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgb(168 85 247)" />
                          <stop offset="100%" stopColor="rgb(59 130 246)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {qualificationData.progress.completion_percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Linear progress bar */}
                  <div className="flex-1">
                    <div className="w-full bg-slate-700/50 rounded-full h-6">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-6 rounded-full transition-all duration-500 relative overflow-hidden"
                        style={{ width: `${qualificationData.progress.completion_percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        {qualificationData.progress.completed_steps.length}
                      </div>
                      <div className="text-slate-400">Steps Completed</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-6 border border-orange-500/20">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-400 mb-1">
                        {qualificationData.progress.total_steps - qualificationData.progress.completed_steps.length}
                      </div>
                      <div className="text-slate-400">Steps Remaining</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-1">
                        {qualificationData.qualification_path.estimated_total_time}
                      </div>
                      <div className="text-slate-400">Est. Duration</div>
                    </div>
                  </div>
                </div>

                {/* Progress Message */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Progress Insights</h4>
                      <p className="text-slate-300">
                        {qualificationData.progress.completion_percentage === 0 && "Ready to start your journey! Complete your first step to begin building momentum."}
                        {qualificationData.progress.completion_percentage > 0 && qualificationData.progress.completion_percentage < 25 && "Excellent start! You're building solid foundations for your career transformation."}
                        {qualificationData.progress.completion_percentage >= 25 && qualificationData.progress.completion_percentage < 50 && "Outstanding progress! You're developing real momentum toward your goals."}
                        {qualificationData.progress.completion_percentage >= 50 && qualificationData.progress.completion_percentage < 75 && "Incredible dedication! You're more than halfway to achieving your qualification goals."}
                        {qualificationData.progress.completion_percentage >= 75 && qualificationData.progress.completion_percentage < 100 && "Almost there! You're in the final phase of your qualification journey."}
                        {qualificationData.progress.completion_percentage === 100 && "🎉 Congratulations! You've successfully completed your qualification pathway!"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Last updated {formatDate(qualificationData.progress.last_updated)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 mb-6 border border-blue-500/20">
                <h3 className="font-semibold text-blue-400 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Path Overview
                </h3>
                <p className="text-slate-300 leading-relaxed">{qualificationData.qualification_path.summary}</p>
              </div>

              {/* Important Notes */}
              {qualificationData.qualification_path.important_notes.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl p-6 mb-6 border border-yellow-500/20">
                  <h3 className="font-semibold text-yellow-400 mb-3">⚠️ Important Considerations</h3>
                  <ul className="space-y-2">
                    {qualificationData.qualification_path.important_notes.map((note, index) => (
                      <li key={index} className="text-slate-300 flex items-start">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regulatory Bodies */}
              {qualificationData.qualification_path.regulatory_bodies.length > 0 && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20">
                  <h3 className="font-semibold text-green-400 mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Regulatory Bodies
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {qualificationData.qualification_path.regulatory_bodies.map((body, index) => (
                      <span key={index} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
                        {body}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Steps */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                <Target className="w-6 h-6 mr-3 text-purple-400" />
                Qualification Steps
              </h3>

              <div className="space-y-6">
                {qualificationData.qualification_path.steps.map((step, index) => {
                  const isCompleted = qualificationData.progress.completed_steps.includes(step.step_number)
                  const stepIndex = step.step_number - 1
                  const previousStepCompleted = stepIndex === 0 || qualificationData.progress.completed_steps.includes(step.step_number - 1)
                  const isNextStep = !isCompleted && previousStepCompleted

                  return (
                    <div key={step.step_number} className={`relative rounded-2xl p-6 transition-all duration-300 border ${isCompleted
                      ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-lg shadow-green-500/10'
                      : isNextStep
                        ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500/50'
                      }`}>
                      {/* Step connector line */}
                      {index < qualificationData.qualification_path.steps.length - 1 && (
                        <div className={`absolute left-8 top-16 w-0.5 h-16 ${isCompleted ? 'bg-green-400' : 'bg-slate-600'
                          }`}></div>
                      )}

                      <div className="flex items-start space-x-6">
                        <button
                          onClick={() => updateStepProgress(step.step_number, !isCompleted)}
                          disabled={isUpdating}
                          className={`relative z-10 p-2 rounded-full transition-all ${isCompleted
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : isNextStep
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                              : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                            }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                            <div className="flex items-center space-x-4">
                              <h4 className="text-xl font-semibold text-white">
                                Step {step.step_number}: {step.title}
                              </h4>
                              <span className={`px-3 py-1 text-sm rounded-full font-medium ${isCompleted
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : isNextStep
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
                                }`}>
                                {isCompleted ? '✓ Completed' : isNextStep ? '→ Next Step' : 'Pending'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-6 text-sm">
                              <div className="flex items-center text-slate-400">
                                <Clock className="w-4 h-4 mr-2" />
                                <span>{step.estimated_duration}</span>
                              </div>
                              <div className="flex items-center text-slate-400">
                                <DollarSign className="w-4 h-4 mr-2" />
                                <span>{step.cost_estimate}</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-slate-300 mb-6 leading-relaxed">{step.description}</p>

                          {/* Step Progress Bar */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                              <span>Step Progress</span>
                              <span>{isCompleted ? '100%' : '0%'}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${isCompleted
                                  ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                                  : 'bg-slate-600'
                                  }`}
                                style={{ width: isCompleted ? '100%' : '0%' }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Requirements */}
                            {step.requirements.length > 0 && (
                              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/50">
                                <h5 className="font-semibold text-white mb-3 flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-2 text-blue-400" />
                                  Requirements
                                </h5>
                                <ul className="space-y-2">
                                  {step.requirements.map((req, index) => (
                                    <li key={index} className="text-slate-300 flex items-start text-sm">
                                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Resources */}
                            {step.resources.length > 0 && (
                              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/50">
                                <h5 className="font-semibold text-white mb-3 flex items-center">
                                  <ExternalLink className="w-4 h-4 mr-2 text-purple-400" />
                                  Resources
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {step.resources.map((resource, index) => (
                                    <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-lg border border-purple-500/30">
                                      {resource}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {step.notes && (
                            <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
                              <h5 className="font-semibold text-yellow-400 mb-2">📝 Additional Notes</h5>
                              <p className="text-slate-300 text-sm leading-relaxed">{step.notes}</p>
                            </div>
                          )}
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