import PyPDF2
import re
from typing import Dict, List, Optional, Union, Any
import io

class ResumeParser:
    """Parse PDF resumes and extract structured text content."""
    
    def __init__(self):
        self.sections = {
            'experience': ['experience', 'work history', 'employment', 'work experience', 'professional experience'],
            'education': ['education', 'academic', 'degree', 'university', 'college', 'school'],
            'skills': ['skills', 'competencies', 'technologies', 'technical skills', 'programming languages']
        }
    
    def extract_text_from_pdf(self, pdf_content: bytes) -> Dict[str, Union[str, Dict[str, str], bool]]:
        """
        Extract structured text from PDF content.
        
        Args:
            pdf_content: PDF file content as bytes
            
        Returns:
            Dictionary with structured resume sections
        """
        try:
            # Open PDF from bytes
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            
            # Extract all text
            full_text = ""
            for page in pdf_reader.pages:
                full_text += page.extract_text()
            
            # Parse into sections
            structured_content = self._parse_sections(full_text)
            
            return {
                'full_text': full_text,
                'structured_content': structured_content,
                'parsed_successfully': True
            }
            
        except Exception as e:
            return {
                'full_text': '',
                'structured_content': {},
                'parsed_successfully': False,
                'error': str(e)
            }
    
    def _parse_sections(self, text: str) -> Dict[str, str]:
        """Parse text into resume sections based on headers."""
        sections = {
            'general': [],
            'experience': [],
            'education': [],
            'skills': []
        }
        
        lines = text.split('\n')
        current_section = 'general'
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if line is a section header
            section_found = self._identify_section_header(line.lower())
            
            if section_found:
                # Switch to new section
                current_section = section_found
            else:
                # Add line to current section
                sections[current_section].append(line)
        
        # Convert lists to strings
        return {
            section: '\n'.join(content).strip() 
            for section, content in sections.items() 
            if content
        }
    
    def _identify_section_header(self, line: str) -> Optional[str]:
        """Identify if a line is a section header."""
        # Common header patterns for the main sections
        if any(keyword in line for keyword in ['experience', 'work history', 'employment', 'work experience', 'professional experience']):
            return 'experience'
        elif any(keyword in line for keyword in ['education', 'academic', 'degree', 'university', 'college', 'school']):
            return 'education'
        elif any(keyword in line for keyword in ['skills', 'competencies', 'technologies', 'technical skills', 'programming languages']):
            return 'skills'
        
        return None
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract potential keywords from resume text."""
        # Common job-related keywords
        keywords = []
        
        # Technical skills
        tech_keywords = [
            'python', 'javascript', 'java', 'react', 'node.js', 'sql', 'mongodb',
            'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'api',
            'html', 'css', 'typescript', 'angular', 'vue', 'php', 'c++', 'c#',
            'machine learning', 'ai', 'data science', 'excel', 'word', 'powerpoint'
        ]
        
        # Soft skills
        soft_skills = [
            'leadership', 'communication', 'teamwork', 'problem solving',
            'analytical', 'creative', 'organized', 'detail-oriented',
            'project management', 'customer service', 'sales', 'marketing'
        ]
        
        # Check for keywords in text
        text_lower = text.lower()
        for keyword in tech_keywords + soft_skills:
            if keyword in text_lower:
                keywords.append(keyword)
        
        return list(set(keywords))  # Remove duplicates
    
    def get_clean_text(self, text: str) -> str:
        """Clean and normalize resume text."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\(\)]', '', text)
        
        # Normalize line breaks
        text = text.replace('\n', ' ').replace('\r', ' ')
        
        return text.strip()

# Global instance
resume_parser = ResumeParser() 