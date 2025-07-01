"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Upload, Search, Target, User, Menu, X, Star, Sparkles, Globe, CheckCircle, TrendingUp, Award, Zap } from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.nextSibling instanceof HTMLElement) {
      target.nextSibling.style.display = 'block';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-white overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-slate-900/95 backdrop-blur-xl border-b border-blue-500/20 shadow-2xl' : 'bg-slate-900/20 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 group">
                <div className="relative">
                  <img
                    src="/images/logo.png"
                    alt="BridgeAI Logo"
                    className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                    onError={handleImageError}
                  />
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg hidden"></div>
                  <div className="absolute inset-0 bg-blue-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  BridgeAI
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-blue-100 hover:text-white transition-all duration-300 font-medium relative group">
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#how-it-works" className="text-blue-100 hover:text-white transition-all duration-300 font-medium relative group">
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#success-stories" className="text-blue-100 hover:text-white transition-all duration-300 font-medium relative group">
                Success Stories
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <div className="flex items-center space-x-4">
                <a href="/login-signup" className="text-blue-100 hover:text-white transition-colors font-medium">Login</a>
                <a href="/login-signup" className="group relative bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2.5 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 overflow-hidden">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </a>
              </div>
            </div>

            <div className="md:hidden">
              <button
                className="text-white hover:text-blue-200 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-blue-500/20">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-blue-100 hover:text-white font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="block text-blue-100 hover:text-white font-medium transition-colors">How It Works</a>
              <a href="#success-stories" className="block text-blue-100 hover:text-white font-medium transition-colors">Success Stories</a>
              <div className="pt-4 border-t border-blue-500/20">
                <a href="/login-signup" className="block text-blue-100 hover:text-white font-medium mb-3">Login</a>
                <a href="/login-signup" className="block w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl text-center font-medium transition-all duration-300">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-32 pb-20 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-600/20 to-blue-400/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-blue-400/30 group hover:border-blue-400/50 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-blue-400 mr-2 animate-pulse" />
              <span className="text-blue-200 text-sm font-medium">AI-Powered Career Transformation</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent animate-pulse">
                Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
                Global Expertise
              </span>
              <br />
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Into Local Success
              </span>
            </h1>

            <p className="text-xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              Bridge the gap between your international qualifications and Canadian career opportunities.
              Our AI analyzes your background and creates personalized pathways to professional success.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              <a href="/login-signup" className="group relative bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-500 flex items-center shadow-2xl hover:shadow-blue-500/30 transform hover:scale-105 overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Start Your Journey
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-300 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </a>
              <Link href="https://devpost.com/software/bridgeai-t4fbej" className="group relative border-2 border-blue-400/50 hover:border-blue-400 text-white hover:bg-blue-400/10 px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-500 flex items-center backdrop-blur-sm">
                <span>Watch Demo</span>
                <div className="ml-3 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </Link>
            </div>

            {/* Achievement Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-2 group-hover:animate-pulse">15,000+</div>
                <div className="text-blue-200 font-medium">Professionals Helped</div>
              </div>
              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-2 group-hover:animate-pulse">800+</div>
                <div className="text-blue-200 font-medium">Career Pathways</div>
              </div>
              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-2 group-hover:animate-pulse">92%</div>
                <div className="text-blue-200 font-medium">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Everything You Need to Succeed
              </span>
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Comprehensive tools designed specifically for internationally trained professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Resume Upload */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-blue-400/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Resume Upload</h3>
              <p className="text-blue-200 leading-relaxed mb-6">
                Upload your resume to get AI-powered analysis and keyword extraction
              </p>
              <div className="text-blue-400 font-semibold flex items-center group-hover:text-blue-300 transition-colors">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>

            {/* Job Search */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-blue-400/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Job Search</h3>
              <p className="text-blue-200 leading-relaxed mb-6">
                Search for jobs in your field across Canadian provinces
              </p>
              <div className="text-blue-400 font-semibold flex items-center group-hover:text-blue-300 transition-colors">
                Browse Jobs
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>

            {/* Qualification Pathway */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-blue-400/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Qualification Pathway</h3>
              <p className="text-blue-200 leading-relaxed mb-6">
                Get step-by-step guidance to become qualified in your profession
              </p>
              <div className="text-blue-400 font-semibold flex items-center group-hover:text-blue-300 transition-colors">
                View Pathway
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>

            {/* Profile Management */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-blue-400/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Profile</h3>
              <p className="text-blue-200 leading-relaxed mb-6">
                Update your personal information and preferences
              </p>
              <div className="text-blue-400 font-semibold flex items-center group-hover:text-blue-300 transition-colors">
                Edit Profile
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/50 to-slate-900/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Your Path to Professional Success
              </span>
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              From assessment to certification, we guide you every step of the way
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transform -translate-y-1/2"></div>
            <div className="hidden md:block absolute top-1/2 right-1/3 w-1/3 h-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transform -translate-y-1/2"></div>

            <div className="text-center relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-4xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-300 relative">
                <span className="relative z-10">1</span>
                <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-6">Upload & Analyze</h3>
              <p className="text-blue-200 leading-relaxed text-lg">
                Upload your resume and credentials. Our AI analyzes your background, identifies transferable skills, and highlights gaps in your professional journey.
              </p>
            </div>

            <div className="text-center relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-4xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-300 relative">
                <span className="relative z-10">2</span>
                <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-6">Get Your Roadmap</h3>
              <p className="text-blue-200 leading-relaxed text-lg">
                Receive a personalized qualification pathway with specific certifications, timeline, costs, and requirements tailored to the Canadian market.
              </p>
            </div>

            <div className="text-center relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-4xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-300 relative">
                <span className="relative z-10">3</span>
                <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-6">Launch Your Career</h3>
              <p className="text-blue-200 leading-relaxed text-lg">
                Follow your roadmap, complete certifications, and access our job board to find opportunities that match your newly validated qualifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success-stories" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Success Stories
              </span>
            </h2>
            <p className="text-xl text-blue-200 italic">
            Illustrative journeys based on real challenges faced by internationally trained professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-blue-100 mb-8 text-lg italic leading-relaxed">
                "My engineering degree felt worthless in Canada. BridgeAI showed me exactly which P.Eng certifications I needed. Now I'm leading infrastructure projects!"
              </p>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  S
                </div>
                <div className="ml-4">
                  <div className="text-white font-bold text-lg">Sarah Chen</div>
                  <div className="text-blue-200">Professional Engineer</div>
                </div>
              </div>
            </div>

            <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-blue-100 mb-8 text-lg italic leading-relaxed">
                "As a doctor from India, I thought I'd have to start over. BridgeAI guided me through the medical licensing process and I'm now practicing in Toronto."
              </p>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  R
                </div>
                <div className="ml-4">
                  <div className="text-white font-bold text-lg">Dr. Raj Patel</div>
                  <div className="text-blue-200">Family Physician</div>
                </div>
              </div>
            </div>

            <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:bg-white/10 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-blue-100 mb-8 text-lg italic leading-relaxed">
                "My business degree from Nigeria wasn't recognized. With BridgeAI's guidance on CPA certification, I landed a senior finance role at a major bank."
              </p>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  A
                </div>
                <div className="ml-4">
                  <div className="text-white font-bold text-lg">Amara Okafor</div>
                  <div className="text-blue-200">Senior Financial Analyst</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-slate-900"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-16 border border-blue-400/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <div className="relative">
              <Globe className="w-20 h-20 text-blue-400 mx-auto mb-8 animate-pulse" />
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  Ready to Bridge Your Future?
                </span>
              </h2>
              <p className="text-xl text-blue-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of internationally trained professionals who have successfully transitioned their careers in Canada.
                Your expertise deserves recognition – let us help you achieve it.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <a href="/login-signup" className="group relative bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-500 flex items-center shadow-2xl hover:shadow-blue-500/30 transform hover:scale-105 overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Start Your Transformation
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-300 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                </a>
                <div className="flex items-center space-x-4 text-blue-200">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-lg font-medium">Free consultation included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-16 border-t border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <img
                  src="/images/logo.png"
                  alt="BridgeAI Logo"
                  className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                  onError={handleImageError}
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  BridgeAI
                </span>
              </div>
              <p className="text-blue-200 leading-relaxed">
                Empowering internationally trained professionals to achieve their career goals in Canada through AI-powered guidance.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center hover:bg-blue-600/30 transition-colors cursor-pointer">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center hover:bg-blue-600/30 transition-colors cursor-pointer">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center hover:bg-blue-600/30 transition-colors cursor-pointer">
                  <Award className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg mb-6">Platform</h3>
              <ul className="space-y-4">
                <li><a href="#features" className="text-blue-200 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-blue-200 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="/login-signup" className="text-blue-200 hover:text-white transition-colors">Get Started</a></li>
                <li><a href="/pricing" className="text-blue-200 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg mb-6">Resources</h3>
              <ul className="space-y-4">
                <li><a href="/blog" className="text-blue-200 hover:text-white transition-colors">Blog</a></li>
                <li><a href="/guides" className="text-blue-200 hover:text-white transition-colors">Career Guides</a></li>
                <li><a href="/webinars" className="text-blue-200 hover:text-white transition-colors">Webinars</a></li>
                <li><a href="/faq" className="text-blue-200 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg mb-6">Support</h3>
              <ul className="space-y-4">
                <li><a href="/contact" className="text-blue-200 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/help" className="text-blue-200 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/privacy" className="text-blue-200 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-blue-200 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-500/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-300 text-sm">
              © 2025 BridgeAI. All rights reserved. Built with ❤️ for international professionals.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-blue-300 text-sm">🇨🇦 Proudly Canadian</span>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="text-blue-300 text-sm">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
