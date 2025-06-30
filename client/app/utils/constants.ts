// Application constants

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const APP_NAME = 'BridgeAI';
export const APP_DESCRIPTION = 'Helping Foreign Trained Professional Find Work';

// Navigation
export const NAV_ITEMS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#success-stories', label: 'Success Stories' }
] as const;

// Dashboard navigation
export const DASHBOARD_NAV_ITEMS = [
  { href: '/dashboard/resume', label: 'Resume', icon: 'Upload' },
  { href: '/dashboard/jobs', label: 'Job Search', icon: 'Search' },
  { href: '/dashboard/qualifications', label: 'Qualifications', icon: 'Target' },
  { href: '/dashboard/friends', label: 'Network', icon: 'Users' },
  { href: '/dashboard/profile', label: 'Profile', icon: 'User' }
] as const;

// File upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf']
};

// Form validation
export const PASSWORD_MIN_LENGTH = 8;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 50;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout'
  },
  USERS: {
    PROFILE: '/api/users/profile',
    BY_ID: (id: string) => `/api/users/by-id/${id}`,
    UPDATE: '/api/users/update'
  },
  RESUMES: {
    UPLOAD: '/api/resumes/upload',
    CONTENT: '/api/resumes/content',
    REMOVE: '/api/resumes/remove',
    DOWNLOAD: '/api/resumes/download',
    PREVIEW: '/api/resumes/preview',
    ATS_EVALUATE: '/api/resumes/ats-evaluate',
    GENERATE_DOCUMENTS: '/api/resumes/generate-documents',
    DOWNLOAD_GENERATED: (path: string) => `/api/resumes/download-generated/${path}`,
    PREVIEW_GENERATED: (path: string) => `/api/resumes/preview-generated/${path}`
  },
  JOBS: {
    SEARCH: '/api/jobs/search',
    APPLY: '/api/jobs/apply'
  },
  QUALIFICATIONS: {
    PATHWAYS: '/api/qualifications/pathways',
    JOB_TYPES: '/api/qualifications/job-types'
  },
  FRIENDS: {
    LIST: '/api/friends/friends',
    ADD: '/api/friends/add',
    REMOVE: '/api/friends/remove'
  },
  CHAT: {
    MESSAGES: (userId: string) => `/api/chat/messages/${userId}`,
    SESSIONS: '/api/chat/sessions',
    MARK_READ: (userId: string) => `/api/chat/mark-read/${userId}`,
    UNREAD_COUNT: '/api/chat/unread-count',
    DELETE_MESSAGE: (messageId: string) => `/api/chat/messages/${messageId}`
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB.',
  INVALID_FILE_TYPE: 'Please upload a valid PDF file.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
  EMAIL_EXISTS: 'An account with this email already exists.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful! Redirecting...',
  SIGNUP_SUCCESS: 'Account created successfully! Redirecting...',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  RESUME_UPLOADED: 'Resume uploaded and parsed successfully!',
  RESUME_REMOVED: 'Resume removed successfully',
  DOCUMENT_GENERATED: 'Documents generated successfully!',
  DOCUMENT_DOWNLOADED: 'Document downloaded successfully!',
  FRIEND_ADDED: 'Friend added successfully',
  FRIEND_REMOVED: 'Friend removed successfully',
  MESSAGE_SENT: 'Message sent successfully',
  MESSAGE_DELETED: 'Message deleted successfully'
} as const;

// Loading states
export const LOADING_STATES = {
  UPLOADING: 'Uploading resume...',
  GENERATING: 'Generating documents with AI...',
  EVALUATING: 'Analyzing resume with AI...',
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  SENDING: 'Sending...'
} as const;

// Colors and themes
export const THEME_COLORS = {
  PRIMARY: {
    BLUE: '#3B82F6',
    PURPLE: '#8B5CF6',
    GREEN: '#10B981',
    RED: '#EF4444',
    YELLOW: '#F59E0B'
  },
  BACKGROUND: {
    DARK: '#0F172A',
    DARKER: '#020617',
    LIGHT: '#1E293B'
  },
  TEXT: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#94A3B8',
    ACCENT: '#60A5FA'
  }
} as const; 