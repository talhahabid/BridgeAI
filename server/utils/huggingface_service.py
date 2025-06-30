import os
import requests
import json
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class HuggingFaceService:
    def __init__(self):
        # Get Hugging Face API token from environment variable
        self.api_token = os.getenv("HUGGINGFACE_API_TOKEN")
        self.available = bool(self.api_token)
        
        if self.available:
            self.base_url = "https://api-inference.huggingface.co/models"
            # Using Mistral-7B-Instruct-v0.2 for good instruction following
            self.model = "mistralai/Mistral-7B-Instruct-v0.2"
            self.api_url = f"{self.base_url}/{self.model}"
            self.headers = {"Authorization": f"Bearer {self.api_token}"}
        else:
            print("Warning: HUGGINGFACE_API_TOKEN not set. Hugging Face service will not be available.")
    
    async def generate_text(self, prompt: str, max_length: int = 2048) -> str:
        """
        Generate text using Hugging Face Inference API
        """
        if not self.available:
            return "Hugging Face service is not available. Please set HUGGINGFACE_API_TOKEN environment variable."
        
        try:
            # Format prompt for Mistral instruction following
            formatted_prompt = f"<s>[INST] {prompt} [/INST]"
            
            payload = {
                "inputs": formatted_prompt,
                "parameters": {
                    "max_new_tokens": max_length,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "do_sample": True,
                    "return_full_text": False
                }
            }
            
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get("generated_text", "")
                    # Remove the instruction part from the response
                    if "[/INST]" in generated_text:
                        generated_text = generated_text.split("[/INST]")[-1].strip()
                    return generated_text
                else:
                    return "Failed to generate content"
            else:
                print(f"Hugging Face API error: {response.status_code} - {response.text}")
                return "Error generating content"
                
        except requests.exceptions.Timeout:
            print("Hugging Face API timeout")
            return "Timeout error - please try again"
        except requests.exceptions.RequestException as e:
            print(f"Hugging Face API request error: {str(e)}")
            return "Network error - please try again"
        except Exception as e:
            print(f"Hugging Face API error: {str(e)}")
            return "Error generating content"
    
    async def generate_cover_letter(self, user_info: dict, job_description: str) -> str:
        """
        Generate a tailored cover letter
        """
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
huggingface_service = HuggingFaceService() 