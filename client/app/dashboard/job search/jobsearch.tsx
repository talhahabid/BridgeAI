'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

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

interface SearchResponse {
  results: Job[];
  total_results: number;
  search_query: string;
  page: number;
}

export default function JobSearch() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (page: number = 1) => {
    if (!title.trim() && !location.trim()) {
      setError('Please enter a job title or location');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const params: any = { page };
      if (title.trim()) params.title = title.trim();
      if (location.trim()) params.location = location.trim();
      
      const res = await axios.get<SearchResponse>(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/search`, {
        params
      });
      
      setResults(res.data.results);
      setTotalResults(res.data.total_results);
      setSearchQuery(res.data.search_query);
      setCurrentPage(page);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch jobs. Please try again.');
      setResults([]);
    }
    setLoading(false);
  };

  const handleNextPage = () => {
    handleSearch(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handleSearch(currentPage - 1);
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'N/A') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Search</h1>
        <p className="text-gray-600">Find your next opportunity in Canada</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title or Keywords
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Software Engineer, Data Analyst"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              placeholder="e.g., Toronto, Vancouver, Remote"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => handleSearch()} 
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                'Search Jobs'
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-4">
          <p className="text-gray-600">
            Showing results for: <span className="font-semibold">"{searchQuery}"</span>
            {totalResults > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({totalResults} jobs found)
              </span>
            )}
          </p>
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
                        {job.job_posted_at !== 'N/A' && (
                          <span className="flex items-center">
                            📅 Posted: {formatDate(job.job_posted_at)}
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
      {!loading && results.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or location</p>
        </div>
      )}
    </div>
  );
}
