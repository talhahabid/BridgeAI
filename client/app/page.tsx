'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { Mail, Lock, User, MapPin, Briefcase, Globe, Upload } from 'lucide-react'

interface AuthForm {
  name: string
  email: string
  password: string
  location: string
  job_preference: string
  origin_country: string
}

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState<AuthForm>({
    name: '',
    email: '',
    password: '',
    location: '',
    job_preference: '',
    origin_country: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
      const data = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, data)
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token)
        localStorage.setItem('userId', response.data.user_id)
        toast.success(isLogin ? 'Login successful!' : 'Account created successfully!')
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof AuthForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ImmigrantJobFinder
            </h1>
            <p className="text-xl text-gray-600">
              Find jobs and understand how to become qualified in Canada
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Auth Form */}
            <div className="card">
              <div className="flex mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                    isLogin 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                    !isLogin 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="input-field pl-10"
                        placeholder="Enter your full name"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="input-field pl-10"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="input-field pl-10"
                      placeholder="Enter your password"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Canadian Province
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="input-field pl-10"
                          required={!isLogin}
                        >
                          <option value="">Select a province</option>
                          <option value="ontario">Ontario</option>
                          <option value="quebec">Quebec</option>
                          <option value="british_columbia">British Columbia</option>
                          <option value="alberta">Alberta</option>
                          <option value="manitoba">Manitoba</option>
                          <option value="saskatchewan">Saskatchewan</option>
                          <option value="nova_scotia">Nova Scotia</option>
                          <option value="new_brunswick">New Brunswick</option>
                          <option value="newfoundland">Newfoundland and Labrador</option>
                          <option value="pei">Prince Edward Island</option>
                          <option value="northwest_territories">Northwest Territories</option>
                          <option value="nunavut">Nunavut</option>
                          <option value="yukon">Yukon</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Preference
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.job_preference}
                          onChange={(e) => handleInputChange('job_preference', e.target.value)}
                          className="input-field pl-10"
                          placeholder="e.g., Software Engineer, Doctor, Teacher"
                          required={!isLogin}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country of Origin
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.origin_country}
                          onChange={(e) => handleInputChange('origin_country', e.target.value)}
                          className="input-field pl-10"
                          placeholder="e.g., India, China, Philippines"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    isLogin ? 'Login' : 'Create Account'
                  )}
                </button>
              </form>
            </div>

            {/* Features */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Why ImmigrantJobFinder?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Upload className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Resume Parsing</h4>
                      <p className="text-sm text-gray-600">
                        Upload your resume and get structured analysis with keyword extraction
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Job Search</h4>
                      <p className="text-sm text-gray-600">
                        Find relevant jobs in your field across Canadian provinces
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Qualification Guidance</h4>
                      <p className="text-sm text-gray-600">
                        Step-by-step pathways to become qualified in your profession
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Progress Tracking</h4>
                      <p className="text-sm text-gray-600">
                        Track your progress toward Canadian certification
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-primary-50 border border-primary-200">
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  Get Started Today
                </h3>
                <p className="text-primary-700 text-sm">
                  Join thousands of immigrants who have successfully found jobs and become qualified in Canada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 