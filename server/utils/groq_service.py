import os
import requests
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        # Get Groq API key from environment variable
        self.api_key = os.getenv("GROQ_API_KEY")
        self.available = bool(self.api_key)
        
        if self.available:
            self.headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        else:
            logger.warning("GROQ_API_KEY not set. Groq service will not be available.")
    
    def is_available(self) -> bool:
        return self.available

    def generate_text(self, prompt: str, max_length: int = 1000) -> str:
        """
        Generate text using Groq API
        """
        if not self.available:
            return "Groq service is not available. Please set GROQ_API_KEY environment variable."
        
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            data = {
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_length
            }
            
            response = requests.post(url, headers=self.headers, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                logger.error(f"Groq API error: {response.status_code} - {response.text}")
                return f"Error: API returned status {response.status_code}"
                
        except requests.exceptions.Timeout:
            logger.error("Groq API timeout")
            return "Error: Request timed out"
        except requests.exceptions.RequestException as e:
            logger.error(f"Groq API request error: {str(e)}")
            return f"Error: {str(e)}"
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            return f"Error: {str(e)}"
    
    def generate_cover_letter(self, user_info: Dict[str, Any], job_description: str) -> str:
        """
        Generate a tailored cover letter
        """
        if not self.available:
            return "Groq service is not available. Please set GROQ_API_KEY environment variable."
        
        prompt = f"""
        Generate a professional cover letter for a job application. 

        User Information:
        - Name: {user_info.get('name', 'N/A')}
        - Job Preference: {user_info.get('job_preference', 'N/A')}
        - Location: {user_info.get('location', 'N/A')}
        - Origin Country: {user_info.get('origin_country', 'N/A')}
        - Current Resume Keywords: {', '.join(user_info.get('resume_keywords', []))}

        Job Description:
        {job_description}

        Requirements:
        1. Write a professional cover letter (300-400 words)
        2. Tailor it specifically to the job description
        3. Highlight relevant skills and experience
        4. Show enthusiasm for the position
        5. Include relevant keywords from the job description
        6. Make it suitable for Canadian job market
        7. Address it to "Dear Hiring Manager"
        8. End with "Sincerely, [Name]"

        Please generate the cover letter:
        """
        
        return self.generate_text(prompt, max_length=800)
    
    def generate_optimized_resume(self, user_info: Dict[str, Any], job_description: str) -> str:
        """
        Generate an optimized resume
        """
        if not self.available:
            return "Groq service is not available. Please set GROQ_API_KEY environment variable."
        
        prompt = f"""
        Generate an optimized resume for a job application.

        User Information:
        - Name: {user_info.get('name', 'N/A')}
        - Job Preference: {user_info.get('job_preference', 'N/A')}
        - Location: {user_info.get('location', 'N/A')}
        - Origin Country: {user_info.get('origin_country', 'N/A')}
        - Current Resume Keywords: {', '.join(user_info.get('resume_keywords', []))}

        Job Description:
        {job_description}

        Requirements:
        1. Create a professional resume format
        2. Include relevant sections: Summary, Skills, Experience, Education
        3. Tailor content to the job description
        4. Include relevant keywords from the job description
        5. Make it suitable for Canadian job market
        6. Keep it concise and professional
        7. Focus on achievements and quantifiable results

        Please generate the optimized resume:
        """
        
        return self.generate_text(prompt, max_length=1000)

# Global instance
_groq_service = None

def get_groq_service() -> GroqService:
    global _groq_service
    if _groq_service is None:
        try:
            _groq_service = GroqService()
        except Exception as e:
            logger.warning(f"Could not initialize Groq service: {e}")
            _groq_service = GroqService()  # Will be unavailable but won't crash
    return _groq_service 