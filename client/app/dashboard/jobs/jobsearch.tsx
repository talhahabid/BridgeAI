'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Recommendations</h1>
          {profile && (
            <p className="text-gray-600">
              Recommended jobs for you in <span className="font-semibold">{profile.location}</span> as <span className="font-semibold">{profile.job_preference}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Job Listings */}
        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((job, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {job.job_title}
                        </h3>
                        <p className="text-lg text-gray-700 mb-2">
                          {job.company_name}
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            📍 {job.job_city}{job.job_state && `, ${job.job_state}`}{job.job_country && `, ${job.job_country}`}
                          </span>
                          {job.job_employment_type !== 'N/A' && (
                            <span className="flex items-center">
                              💼 {job.job_employment_type}
                            </span>
                          )}
                          {job.job_salary !== 'N/A' && (
                            <span className="flex items-center">
                              💰 {job.job_salary}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed">
                        {truncateText(job.job_description, 300)}
                      </p>
                    </div>

                    {/* Requirements */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      {job.job_required_experience !== 'N/A' && (
                        <div>
                          <span className="font-medium text-gray-700">Experience:</span>
                          <p className="text-gray-600">{job.job_required_experience}</p>
                        </div>
                      )}
                      {job.job_required_education !== 'N/A' && (
                        <div>
                          <span className="font-medium text-gray-700">Education:</span>
                          <p className="text-gray-600">{job.job_required_education}</p>
                        </div>
                      )}
                      {job.job_required_skills && job.job_required_skills.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {job.job_required_skills.slice(0, 5).map((skill, skillIndex) => (
                              <span key={skillIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {skill}
                              </span>
                            ))}
                            {job.job_required_skills.length > 5 && (
                              <span className="text-gray-500 text-xs">+{job.job_required_skills.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:ml-6 lg:flex-shrink-0">
                    {job.job_apply_link && (
                      <a
                        href={job.job_apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                      >
                        Apply Now
                        <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
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
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage}
              </span>
              <button
                onClick={handleNextPage}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && profile && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try updating your profile or check back later for new recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
