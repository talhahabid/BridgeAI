'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, ExternalLink, Star } from 'lucide-react';

interface Job {
  job_title: string;
  company_name: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_apply_link: string;
  job_description: string;
  job_employment_type: string;
  job_salary: string;
  job_posted_at: string;
  job_required_skills: string[];
  job_required_experience: string;
  job_required_education: string;
}

interface UserProfile {
  name: string;
  email: string;
  location: string;
  job_preference: string;
  origin_country?: string;
}

interface SearchResponse {
  results: Job[];
  total_results: number;
  search_query: string;
  page: number;
}

export default function JobRecommendations() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [results, setResults] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedCount, setAppliedCount] = useState(0);
  const router = useRouter();

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfileAndJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('User not authenticated.');
          setLoading(false);
          return;
        }
        // Fetch user profile
        const profileRes = await axios.get<UserProfile>(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data);
        // Fetch jobs based on profile
        await fetchJobs(profileRes.data.job_preference, profileRes.data.location, 1);
      } catch (err: any) {
        setError('Failed to load profile or jobs.');
        setLoading(false);
      }
    };
    fetchProfileAndJobs();
    // Sync appliedCount from localStorage
    const storedApplied = parseInt(localStorage.getItem('appliedCount') || '0', 10);
    setAppliedCount(storedApplied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch jobs function
  const fetchJobs = async (title: string, location: string, page: number) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get<SearchResponse>(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/search`, {
        params: { title, location, page },
      });
      setResults(res.data.results);
      setTotalResults(res.data.total_results);
      setSearchQuery(res.data.search_query);
      setCurrentPage(page);
    } catch (err: any) {
      setError('Failed to fetch jobs.');
      setResults([]);
    }
    setLoading(false);
  };

  const handleNextPage = () => {
    if (profile) fetchJobs(profile.job_preference, profile.location, currentPage + 1);
  };

  const handlePrevPage = () => {
    if (profile && currentPage > 1) fetchJobs(profile.job_preference, profile.location, currentPage - 1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) return 'Unknown';
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-400/20 border-b-purple-400 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
                  Job Recommendations
                </h1>
                {profile && (
                  <div className="flex items-center space-x-6 text-slate-300">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <span className="font-medium">{profile.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5 text-purple-400" />
                      <span className="font-medium">{profile.job_preference}</span>
                    </div>
                    {totalResults > 0 && (
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span className="font-medium">{totalResults} opportunities found</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl mb-8 backdrop-blur-xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Job Listings */}
        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((job, index) => (
              <div
                key={index}
                className="group bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:bg-slate-800/70"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1 space-y-6">
                    {/* Job Header */}
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {job.job_title}
                      </h2>
                      <h3 className="text-xl text-slate-300 mb-4 font-medium">
                        {job.company_name}
                      </h3>

                      {/* Job Meta */}
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2 text-slate-400">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          <span>
                            {job.job_city}{job.job_state && `, ${job.job_state}`}{job.job_country && `, ${job.job_country}`}
                          </span>
                        </div>
                        {job.job_employment_type !== 'N/A' && (
                          <div className="flex items-center space-x-2 text-slate-400">
                            <Briefcase className="w-4 h-4 text-purple-400" />
                            <span>{job.job_employment_type}</span>
                          </div>
                        )}
                        {job.job_salary !== 'N/A' && (
                          <div className="flex items-center space-x-2 text-slate-400">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span>{job.job_salary}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Clock className="w-4 h-4 text-orange-400" />
                          <span>Posted {formatDate(job.job_posted_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Job Description */}
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                      <p className="text-slate-300 leading-relaxed">
                        {truncateText(job.job_description, 300)}
                      </p>
                    </div>

                    {/* Requirements Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {job.job_required_experience !== 'N/A' && (
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                          <h4 className="font-semibold text-blue-400 mb-2">Experience</h4>
                          <p className="text-slate-300 text-sm">{job.job_required_experience}</p>
                        </div>
                      )}
                      {job.job_required_education !== 'N/A' && (
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                          <h4 className="font-semibold text-purple-400 mb-2">Education</h4>
                          <p className="text-slate-300 text-sm">{job.job_required_education}</p>
                        </div>
                      )}
                      {job.job_required_skills && job.job_required_skills.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                          <h4 className="font-semibold text-green-400 mb-3">Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {job.job_required_skills.slice(0, 4).map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-500/30"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.job_required_skills.length > 4 && (
                              <span className="text-slate-400 text-xs px-3 py-1">
                                +{job.job_required_skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="lg:flex-shrink-0">
                    {job.job_apply_link && (
                      <a
                        href={job.job_apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 shadow-lg hover:shadow-green-500/25 group"
                        onClick={() => {
                          setAppliedCount((count) => {
                            const newCount = count + 1;
                            localStorage.setItem('appliedCount', newCount.toString());
                            return newCount;
                          });
                        }}
                      >
                        <span>Apply Now</span>
                        <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {results.length > 0 && (
          <div className="flex items-center justify-center mt-12">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loading}
                  className="px-6 py-3 bg-slate-700/50 text-slate-300 font-medium rounded-xl hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-slate-600/30"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-2 px-4">
                  <span className="text-slate-400">Page</span>
                  <span className="text-white font-bold text-lg">{currentPage}</span>
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && profile && (
          <div className="text-center py-16">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Jobs Found</h3>
              <p className="text-slate-400 mb-6">
                We couldn't find any jobs matching your preferences in {profile.location} for {profile.job_preference}.
              </p>
              <button
                onClick={() => router.push('/dashboard/profile')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Update Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
