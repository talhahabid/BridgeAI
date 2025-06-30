import os
import requests
import json
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GroqService:
    def __init__(self):
        # Get Groq API key from environment variable
        self.api_key = os.getenv("GROQ_API_KEY")
        self.available = bool(self.api_key)
        
        if self.available:
            self.base_url = "https://api.groq.com/openai/v1/chat/completions"
            self.headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        else:
            print("Warning: GROQ_API_KEY not set. Groq service will not be available.")
    
    async def generate_text(self, prompt: str, max_length: int = 2048) -> str:
        """
        Generate text using Groq API
        """
        if not self.available:
            return "Groq service is not available. Please set GROQ_API_KEY environment variable."
        
        try:
            payload = {
                "model": "llama3-8b-8192",  # Fast and free model
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": max_length
            }
            
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                print(f"Groq API error: {response.status_code} - {response.text}")
                return "Error generating content"
                
        except requests.exceptions.Timeout:
            print("Groq API timeout")
            return "Timeout error - please try again"
        except requests.exceptions.RequestException as e:
            print(f"Groq API request error: {str(e)}")
            return "Network error - please try again"
        except Exception as e:
            print(f"Groq API error: {str(e)}")
            return "Error generating content"
    
    async def generate_cover_letter(self, user_info: dict, job_description: str) -> str:
        """
        Generate a tailored cover letter
        """
        if not self.available:
            return "Groq service is not available. Please set GROQ_API_KEY environment variable."
        
        prompt = f"""
You are an expert Canadian resume writer specializing in creating compelling cover letters for immigrants and newcomers to Canada.

Create a professional cover letter for the following candidate applying for a job in Canada:

**Candidate Information:**
- Name: {user_info.get('name', '')}
- Location: {user_info.get('location', '')}, Canada
- Origin Country: {user_info.get('origin_country', '')}
- Current Resume Keywords: {', '.join(user_info.get('resume_keywords', []))}

**Job Description:**
{job_description}

**Requirements:**
1. Follow Canadian business writing standards
2. Address the candidate's immigrant background positively
3. Highlight relevant skills from their resume
4. Show enthusiasm for the Canadian job market
5. Keep it professional but warm
6. Include specific references to the job description
7. Format as plain text (no markdown)

**Cover Letter Structure:**
- Professional greeting
- Opening paragraph (why you're interested)
- Body paragraphs (relevant experience and skills)
- Closing paragraph (enthusiasm and call to action)
- Professional closing

Make it compelling and tailored specifically to this job and candidate. Keep it concise but impactful.
"""
        
        return await self.generate_text(prompt, max_length=1500)
    
    async def generate_optimized_resume(self, user_info: dict, job_description: str) -> str:
        """
        Generate an optimized resume
        """
        if not self.available:
            return "Groq service is not available. Please set GROQ_API_KEY environment variable."
        
        prompt = f"""
You are an expert Canadian resume writer specializing in optimizing resumes for the Canadian job market, particularly for immigrants and newcomers.

Create an optimized resume for the following candidate based on their current resume and the specific job they're applying for:

**Candidate Information:**
- Name: {user_info.get('name', '')}
- Location: {user_info.get('location', '')}, Canada
- Origin Country: {user_info.get('origin_country', '')}
- Current Resume: {user_info.get('resume_text', '')[:2000]}...

**Job Description:**
{job_description}

**Requirements:**
1. Follow Canadian resume standards and formatting
2. Optimize for ATS (Applicant Tracking Systems)
3. Include relevant keywords from the job description
4. Highlight transferable skills and Canadian experience
5. Use action verbs and quantifiable achievements
6. Format as plain text with clear sections
7. Keep it concise and professional

**Resume Sections to Include:**
- Contact Information
- Professional Summary
- Work Experience
- Education
- Skills
- Additional Information (if relevant)

Make it compelling and specifically tailored to this job while maintaining the candidate's authentic experience. Format it clearly with section headers.
"""
        
        return await self.generate_text(prompt, max_length=2000)

# Create a global instance
try:
    groq_service = GroqService()
except Exception as e:
    print(f"Warning: Could not initialize Groq service: {e}")
    groq_service = None 