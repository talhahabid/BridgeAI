'use client'

import React, { useState } from 'react'
import { Mail, Lock, User, MapPin, Briefcase, Globe, Upload, ArrowRight, Sparkles, CheckCircle, Star, Award } from 'lucide-react'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
      const data = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (result.access_token) {
        localStorage.setItem('token', result.access_token)
        localStorage.setItem('userId', result.user_id)
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof AuthForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-white overflow-x-hidden relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-600/20 to-blue-400/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-blue-400/30">
              <Sparkles className="w-5 h-5 text-blue-400 mr-2 animate-pulse" />
              <span className="text-blue-200 text-sm font-medium">Join the BridgeAI Community</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                BridgeAI
              </span>
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Transform your international expertise into Canadian career success
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Auth Form */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/20 shadow-2xl hover:border-blue-400/40 transition-all duration-500">
              {/* Toggle Buttons */}
              <div className="flex mb-8 bg-slate-800/50 rounded-2xl p-1.5 backdrop-blur-sm">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    isLogin 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-blue-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    !isLogin 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-blue-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-blue-100 mb-2">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-300" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-blue-400/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                        placeholder="Enter your full name"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-blue-100 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-300" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-blue-400/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-100 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-300" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-blue-400/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter your password"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-blue-100 mb-2">
                        Canadian Province
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-300" />
                        <select
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                          required={!isLogin}
                        >
                          <option value="" className="bg-slate-800">Select a province</option>
                          <option value="ontario" className="bg-slate-800">Ontario</option>
                          <option value="quebec" className="bg-slate-800">Quebec</option>
                          <option value="british_columbia" className="bg-slate-800">British Columbia</option>
                          <option value="alberta" className="bg-slate-800">Alberta</option>
                          <option value="manitoba" className="bg-slate-800">Manitoba</option>
                          <option value="saskatchewan" className="bg-slate-800">Saskatchewan</option>
                          <option value="nova_scotia" className="bg-slate-800">Nova Scotia</option>
                          <option value="new_brunswick" className="bg-slate-800">New Brunswick</option>
                          <option value="newfoundland" className="bg-slate-800">Newfoundland and Labrador</option>
                          <option value="pei" className="bg-slate-800">Prince Edward Island</option>
                          <option value="northwest_territories" className="bg-slate-800">Northwest Territories</option>
                          <option value="nunavut" className="bg-slate-800">Nunavut</option>
                          <option value="yukon" className="bg-slate-800">Yukon</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-100 mb-2">
                        Job Preference
                      </label>
                      <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-300" />
                        <input
                          type="text"
                          value={formData.job_preference}
                          onChange={(e) => handleInputChange('job_preference', e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-blue-400/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                          placeholder="e.g., Software Engineer, Doctor, Teacher"
                          required={!isLogin}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-100 mb-2">
                        Country of Origin
                      </label>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-300" />
                        <input
                          type="text"
                          value={formData.origin_country}
                          onChange={(e) => handleInputChange('origin_country', e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-blue-400/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
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
                  className="group relative w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-4 rounded-xl text-lg font-bold transition-all duration-500 flex items-center justify-center shadow-2xl hover:shadow-blue-500/30 transform hover:scale-[1.02] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <span className="relative z-10 flex items-center">
                      {isLogin ? 'Sign In to BridgeAI' : 'Create Your Account'}
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-300 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                </button>
              </form>
            </div>

            {/* Features Section */}
            <div className="space-y-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/20 shadow-2xl hover:border-blue-400/40 transition-all duration-500">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Why Choose BridgeAI?
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 group">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/30 transition-colors duration-300">
                      <Upload className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors duration-300">AI Resume Analysis</h4>
                      <p className="text-blue-200 text-sm leading-relaxed">
                        Advanced AI parsing extracts skills, experience, and qualifications from your resume with precision
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 group">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/30 transition-colors duration-300">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors duration-300">Smart Job Matching</h4>
                      <p className="text-blue-200 text-sm leading-relaxed">
                        Find opportunities that match your skills across all Canadian provinces and territories
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 group">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/30 transition-colors duration-300">
                      <Award className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors duration-300">Certification Pathways</h4>
                      <p className="text-blue-200 text-sm leading-relaxed">
                        Step-by-step guidance to achieve Canadian professional certification in your field
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 group">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/30 transition-colors duration-300">
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors duration-300">Progress Tracking</h4>
                      <p className="text-blue-200 text-sm leading-relaxed">
                        Monitor your journey toward Canadian certification with detailed milestone tracking
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Stats */}
              <div className="bg-gradient-to-r from-blue-600/20 to-blue-400/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 text-center">
                  Join Thousands of Success Stories
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-1">15K+</div>
                    <div className="text-blue-200 text-sm">Professionals Helped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-1">92%</div>
                    <div className="text-blue-200 text-sm">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}