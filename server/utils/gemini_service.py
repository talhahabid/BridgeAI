import google.generativeai as genai
import os
from typing import Dict, List, Any
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GeminiService:
    def __init__(self):
        # Configure Gemini API only if API key is available
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-1.5-pro')
                self.is_configured = True
            except Exception as e:
                print(f"Failed to configure Gemini API: {e}")
                self.is_configured = False
        else:
            print("GEMINI_API_KEY not found in environment variables")
            self.is_configured = False
    
    async def generate_qualification_path(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a qualification path for an immigrant based on their profile and resume.
        
        Args:
            user_data: Dictionary containing user profile and resume data
            
        Returns:
            Dictionary containing the generated qualification path
        """
        
        # Check if Gemini is properly configured
        if not self.is_configured:
            return {
                "success": False,
                "error": "Gemini API is not properly configured. Please set GEMINI_API_KEY environment variable.",
                "generated_at": datetime.utcnow().isoformat()
            }
        
        # Extract user information
        job_preference = user_data.get('job_preference', '')
        origin_country = user_data.get('origin_country', '')
        location = user_data.get('location', '')  # Canadian province
        resume_text = user_data.get('resume_text', '')
        resume_keywords = user_data.get('resume_keywords', [])
        
        # Create the prompt for Gemini
        prompt = self._create_qualification_prompt(
            job_preference, origin_country, location, resume_text, resume_keywords
        )
        
        try:
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            
            # Parse the response
            qualification_path = self._parse_gemini_response(response.text)
            
            return {
                "success": True,
                "qualification_path": qualification_path,
                "generated_at": datetime.utcnow().isoformat(),
                "raw_response": response.text
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Gemini API error: {str(e)}",
                "generated_at": datetime.utcnow().isoformat()
            }
    
    def _create_qualification_prompt(self, job_preference: str, origin_country: str, 
                                   location: str, resume_text: str, resume_keywords: List[str]) -> str:
        """Create a detailed prompt for Gemini to generate qualification path."""
        
        prompt = f"""
You are an expert immigration consultant specializing in helping immigrants qualify for their desired professions in Canada. 

Generate a detailed, step-by-step qualification path for the following immigrant:

**Target Job**: {job_preference}
**Origin Country**: {origin_country}
**Destination Province**: {location}, Canada
**Current Qualifications** (from resume): {resume_text[:1000]}...
**Key Skills Identified**: {', '.join(resume_keywords) if resume_keywords else 'Not specified'}

Please provide a structured qualification path in the following JSON format:

{{
    "job_title": "Exact job title",
    "province": "Province name",
    "estimated_total_time": "X years",
    "steps": [
        {{
            "step_number": 1,
            "title": "Step title",
            "description": "Detailed description of what needs to be done",
            "estimated_duration": "X months",
            "requirements": ["requirement1", "requirement2"],
            "cost_estimate": "CAD $X",
            "resources": ["resource1", "resource2"],
            "notes": "Additional important information"
        }}
    ],
    "summary": "Brief summary of the overall process",
    "important_notes": ["note1", "note2"],
    "regulatory_bodies": ["body1", "body2"]
}}

**Important Guidelines:**
1. Be specific to the Canadian province mentioned
2. Include credential evaluation steps (WES, ICAS, etc.)
3. Include any required exams or certifications
4. Include licensing requirements
5. Provide realistic time estimates
6. Include cost estimates where possible
7. Mention relevant regulatory bodies
8. Consider the immigrant's origin country and existing qualifications
9. Make steps actionable and specific

**Example for a Doctor from India to Ontario:**
- Step 1: Credential Evaluation (WES/Medical Council of Canada)
- Step 2: MCCQE1 Exam Preparation and Registration
- Step 3: Take MCCQE1 Exam
- Step 4: NAC OSCE Exam Preparation
- Step 5: Take NAC OSCE Exam
- Step 6: Apply for Residency Match (CaRMS)
- Step 7: Complete Residency Program
- Step 8: Apply for Medical License

Please generate a similar detailed path for the specified job and province.
"""
        
        return prompt
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the Gemini response and extract the qualification path."""
        
        try:
            # Try to extract JSON from the response
            import json
            import re
            
            # Look for JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            else:
                # If no JSON found, create a structured response
                return self._create_fallback_response(response_text)
                
        except Exception as e:
            # If parsing fails, create a fallback response
            return self._create_fallback_response(response_text)
    
    def _create_fallback_response(self, response_text: str) -> Dict[str, Any]:
        """Create a fallback response if JSON parsing fails."""
        
        return {
            "job_title": "Target Job",
            "province": "Canada",
            "estimated_total_time": "2-3 years",
            "steps": [
                {
                    "step_number": 1,
                    "title": "Credential Evaluation",
                    "description": "Get your foreign credentials evaluated by a recognized Canadian organization",
                    "estimated_duration": "2-3 months",
                    "requirements": ["Original documents", "Translation if needed"],
                    "cost_estimate": "CAD $200-400",
                    "resources": ["WES Canada", "ICAS"],
                    "notes": "Start this process early as it's required for most professions"
                },
                {
                    "step_number": 2,
                    "title": "Language Proficiency",
                    "description": "Take required language tests (IELTS, CELPIP, or French tests)",
                    "estimated_duration": "1-2 months",
                    "requirements": ["Study materials", "Test registration"],
                    "cost_estimate": "CAD $300-400",
                    "resources": ["IELTS", "CELPIP"],
                    "notes": "Most professions require CLB 7 or higher"
                }
            ],
            "summary": "Basic qualification path for Canadian certification",
            "important_notes": ["Start early", "Keep all documents organized"],
            "regulatory_bodies": ["Check provincial regulatory body for your profession"],
            "raw_response": response_text
        } 