# BridgeAI

A full-stack web application to help immigrants find jobs and understand how to become qualified in Canada.

## 🚀 Features

- **Secure Authentication**: JWT-based auth with bcrypt password hashing
- **Resume Parsing**: PDF upload and text extraction using PyMuPDF
- **Job Qualification Guidance**: Step-by-step plans for Canadian certification
- **Job Search**: LinkedIn-style job search interface
- **Progress Tracking**: Visual progress indicators toward target jobs
- **Profile Management**: Edit personal details and resume
- **Resume Templates**: Canadian job market styled templates

## 🧱 Tech Stack

- **Frontend**: Next.js with TypeScript
- **Backend**: FastAPI (Python)
- **Database**: MongoDB Atlas
- **Authentication**: JWT tokens
- **PDF Processing**: PyMuPDF (fitz)

## 📁 Project Structure

```
ImmigrantJobFinder/
├── client/                 # Next.js frontend
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── utils/             # Frontend utilities
│   └── types/             # TypeScript types
├── server/                # FastAPI backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── models/            # Data models
│   └── utils/             # Backend utilities
└── shared/                # Shared types/interfaces
```

## 🛠 Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB Atlas account

### Backend Setup
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Environment Variables
Create `.env` files in both `client/` and `server/` directories:

**server/.env:**
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```

**client/.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🔐 Authentication Flow

1. User signs up with name, email, password, location, job preference, and resume
2. Password is hashed with bcrypt
3. JWT token is generated and returned
4. User can login with email/password
5. Protected routes require valid JWT token

## 📄 Resume Processing

- PDF uploads are processed using PyMuPDF
- Text is extracted and structured
- Both original PDF and parsed text are stored in MongoDB
- Resume content is displayed for preview and editing

## 🎯 Job Qualification Guidance

- Step-by-step certification plans based on profession and province
- Timeline estimates and progress tracking
- Interim job suggestions while working toward full qualification
- Progress percentage calculation

## 🔍 Job Search

- LinkedIn-style job search interface
- Title and location-based search
- Pre-filled application forms
- Manual submission to avoid API abuse

## 📊 Progress Tracking

- Visual progress indicators
- Step completion tracking
- Percentage readiness calculation
- Goal achievement milestones 
