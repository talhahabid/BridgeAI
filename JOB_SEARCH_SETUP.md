# Job Search Setup Guide

## RapidAPI Configuration

To use the job search functionality, you need to set up your RapidAPI key:

### 1. Get a RapidAPI Key
1. Go to [RapidAPI](https://rapidapi.com/)
2. Sign up for a free account
3. Subscribe to the [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/)
4. Copy your API key from the dashboard

### 2. Set Environment Variable
Create a `.env` file in the `server` directory with:

```env
RAPIDAPI_KEY=your_rapidapi_key_here
```

### 3. Install Dependencies
In the `server` directory, install the new dependency:

```bash
pip install httpx==0.25.2
```

Or update all dependencies:

```bash
pip install -r requirements.txt
```

## Features

The enhanced job search includes:

- **Advanced Search**: Search by job title/keywords and location
- **Rich Job Details**: 
  - Company information
  - Location (city, state, country)
  - Employment type
  - Salary information
  - Posted date
  - Required skills
  - Experience requirements
  - Education requirements
- **Pagination**: Navigate through multiple pages of results
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Proper error messages and loading states
- **Direct Apply Links**: Click to apply directly to jobs

## API Endpoints

- `GET /api/jobs/search` - Search for jobs
  - Query parameters:
    - `title` (optional): Job title or keywords
    - `location` (optional): Job location
    - `page` (optional): Page number (default: 1)
    - `num_pages` (optional): Number of pages to fetch (default: 1, max: 10)

- `GET /api/jobs/health` - Check API health and RapidAPI configuration

## Usage

1. Start your server: `cd server && python -m uvicorn main:app --reload`
2. Start your client: `cd client && npm run dev`
3. Navigate to the dashboard and use the job search feature
4. Enter job title/keywords and location
5. Click "Search Jobs" to find opportunities

## Troubleshooting

- **"RapidAPI key not configured"**: Make sure your `.env` file has the `RAPIDAPI_KEY` variable set
- **"Request timeout"**: The API might be slow, try again
- **"No jobs found"**: Try different search terms or locations
- **CORS errors**: Make sure your server is running on the correct port and CORS is configured

## Rate Limits

The free RapidAPI plan has rate limits. Check your RapidAPI dashboard for current usage and limits. 