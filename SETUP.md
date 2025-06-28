# Setup Guide - ImmigrantJobFinder

This guide will help you set up and run the ImmigrantJobFinder application locally.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
- **MongoDB Atlas account** - [Sign up here](https://www.mongodb.com/atlas)

## Step 1: Clone and Setup Project

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd ImmigrantJobFinder
```

## Step 2: Backend Setup

### 2.1 Install Python Dependencies

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2.2 Configure Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Edit .env file with your actual values
```

**Required environment variables:**
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure random string for JWT token signing

### 2.3 MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier is fine)
3. Create a database user with read/write permissions
4. Get your connection string and add it to `.env`
5. Whitelist your IP address in Network Access

### 2.4 Run the Backend

```bash
# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000
API documentation: http://localhost:8000/docs

## Step 3: Frontend Setup

### 3.1 Install Node.js Dependencies

```bash
cd client

# Install dependencies
npm install
```

### 3.2 Configure Environment Variables

```bash
# Copy the example environment file
cp env.example .env.local

# Edit .env.local file
```

**Required environment variables:**
- `NEXT_PUBLIC_API_URL`: Backend API URL (http://localhost:8000)

### 3.3 Run the Frontend

```bash
# Start the Next.js development server
npm run dev
```

The frontend will be available at: http://localhost:3000

## Step 4: Verify Installation

1. **Backend Health Check**: Visit http://localhost:8000/health
2. **Frontend**: Visit http://localhost:3000
3. **API Documentation**: Visit http://localhost:8000/docs

## Step 5: Test the Application

1. Open http://localhost:3000 in your browser
2. Create a new account with your details
3. Upload a PDF resume
4. Explore the job search and qualification pathways

## Troubleshooting

### Common Issues

**Backend Issues:**
- **Import errors**: Make sure you're in the virtual environment and all dependencies are installed
- **MongoDB connection**: Verify your connection string and network access
- **Port already in use**: Change the port in the uvicorn command

**Frontend Issues:**
- **Module not found**: Run `npm install` again
- **API connection**: Check that the backend is running and the API URL is correct
- **Build errors**: Clear `.next` folder and run `npm run dev` again

### Getting Help

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure both backend and frontend are running
4. Check the API documentation at http://localhost:8000/docs

## Development

### Backend Development

- The main FastAPI app is in `server/main.py`
- Routes are organized in `server/routes/`
- Models are in `server/models/`
- Utilities are in `server/utils/`

### Frontend Development

- Pages are in `client/app/`
- Components can be added to `client/components/`
- Styles use Tailwind CSS
- API calls use Axios

### Database Schema

The application uses MongoDB with the following collections:
- `users`: User profiles and authentication data
- `resumes`: Resume data and parsed content
- `jobs`: Job listings (mock data for now)
- `qualifications`: Qualification pathways (mock data for now)

## Production Deployment

For production deployment:

1. **Backend**: Deploy to services like Heroku, Railway, or AWS
2. **Frontend**: Deploy to Vercel, Netlify, or similar
3. **Database**: Use MongoDB Atlas production cluster
4. **Environment**: Set production environment variables
5. **Security**: Use strong JWT secrets and HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 