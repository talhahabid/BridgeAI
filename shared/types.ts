// User Types
export interface User {
  id: string
  name: string
  email: string
  location: string
  job_preference: string
  origin_country?: string
  resume_text?: string
  resume_filename?: string
  created_at: string
  updated_at: string
}

export interface UserCreate {
  name: string
  email: string
  password: string
  location: string
  job_preference: string
  origin_country?: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface UserUpdate {
  name?: string
  location?: string
  job_preference?: string
  origin_country?: string
}

// Resume Types
export interface ResumeData {
  resume_text: string
  resume_filename: string
  resume_structured: Record<string, string>
  resume_keywords: string[]
  has_resume: boolean
}

export interface ResumeUploadResponse {
  message: string
  filename: string
  text_length: number
  sections_found: string[]
  keywords_extracted: string[]
}

// Job Types
export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  description: string
  requirements: string[]
  posted_date: string
}

export interface JobSearchResponse {
  jobs: Job[]
  total: number
  filters: {
    title?: string
    location?: string
  }
}

// Qualification Types
export interface QualificationStep {
  id: number
  title: string
  description: string
  duration: string
  cost: string
  institution: string
  completed: boolean
}

export interface QualificationPathway {
  job_title: string
  province: string
  steps: QualificationStep[]
  interim_jobs: string[]
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

export interface JobType {
  type: string
  title: string
  available_provinces: string[]
}

// API Response Types
export interface AuthResponse {
  access_token: string
  token_type: string
  user_id: string
  message: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// Form Types
export interface AuthForm {
  name: string
  email: string
  password: string
  location: string
  job_preference: string
  origin_country: string
}

// Canadian Provinces
export const CANADIAN_PROVINCES = [
  { value: 'ontario', label: 'Ontario' },
  { value: 'quebec', label: 'Quebec' },
  { value: 'british_columbia', label: 'British Columbia' },
  { value: 'alberta', label: 'Alberta' },
  { value: 'manitoba', label: 'Manitoba' },
  { value: 'saskatchewan', label: 'Saskatchewan' },
  { value: 'nova_scotia', label: 'Nova Scotia' },
  { value: 'new_brunswick', label: 'New Brunswick' },
  { value: 'newfoundland', label: 'Newfoundland and Labrador' },
  { value: 'pei', label: 'Prince Edward Island' },
  { value: 'northwest_territories', label: 'Northwest Territories' },
  { value: 'nunavut', label: 'Nunavut' },
  { value: 'yukon', label: 'Yukon' }
] as const

export type CanadianProvince = typeof CANADIAN_PROVINCES[number]['value']

// Common Job Types
export const COMMON_JOB_TYPES = [
  'Software Engineer',
  'Data Analyst',
  'Marketing Manager',
  'Sales Representative',
  'Project Manager',
  'Accountant',
  'Teacher',
  'Nurse',
  'Doctor',
  'Engineer',
  'Designer',
  'Consultant',
  'Administrator',
  'Customer Service',
  'Other'
] as const

export type CommonJobType = typeof COMMON_JOB_TYPES[number] 