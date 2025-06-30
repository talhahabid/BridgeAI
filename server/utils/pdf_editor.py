import os
import logging
import tempfile
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import black, white
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from io import BytesIO
from typing import List, Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

class PDFEditor:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for professional documents"""
        # Custom styles for different document types
        self.styles.add(ParagraphStyle(
            name='CoverLetterTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        self.styles.add(ParagraphStyle(
            name='CoverLetterBody',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=12,
            alignment=TA_LEFT,
            leading=14
        ))
        
        self.styles.add(ParagraphStyle(
            name='ResumeTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=15,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        self.styles.add(ParagraphStyle(
            name='ResumeSection',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
            spaceBefore=15,
            textColor=colors.darkblue
        ))
        
        self.styles.add(ParagraphStyle(
            name='ResumeBody',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            leading=12
        ))
    
    def create_cover_letter_pdf(self, content: str, user_name: str, filename: str) -> str:
        """
        Create a professional cover letter PDF
        """
        try:
            # Create output directory if it doesn't exist
            output_dir = os.path.join(os.getcwd(), "server", "resumes")
            os.makedirs(output_dir, exist_ok=True)
            
            filepath = os.path.join(output_dir, filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(filepath, pagesize=letter)
            story = []
            
            # Add title
            story.append(Paragraph("COVER LETTER", self.styles['CoverLetterTitle']))
            story.append(Spacer(1, 20))
            
            # Add date
            from datetime import datetime
            current_date = datetime.now().strftime("%B %d, %Y")
            story.append(Paragraph(current_date, self.styles['CoverLetterBody']))
            story.append(Spacer(1, 20))
            
            # Add content
            paragraphs = content.split('\n\n')
            for paragraph in paragraphs:
                if paragraph.strip():
                    story.append(Paragraph(paragraph.strip(), self.styles['CoverLetterBody']))
                    story.append(Spacer(1, 12))
            
            # Build PDF
            doc.build(story)
            
            return filepath
            
        except Exception as e:
            logger.error(f"Error creating cover letter PDF: {str(e)}")
            raise
    
    def create_resume_pdf(self, content: str, user_name: str, filename: str) -> str:
        """
        Create a professional resume PDF
        """
        try:
            # Create output directory if it doesn't exist
            output_dir = os.path.join(os.getcwd(), "server", "resumes")
            os.makedirs(output_dir, exist_ok=True)
            
            filepath = os.path.join(output_dir, filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(filepath, pagesize=letter)
            story = []
            
            # Add title
            story.append(Paragraph(user_name.upper(), self.styles['ResumeTitle']))
            story.append(Spacer(1, 15))
            
            # Parse content and create sections
            sections = self._parse_resume_content(content)
            
            for section_title, section_content in sections.items():
                # Add section header
                story.append(Paragraph(section_title.upper(), self.styles['ResumeSection']))
                story.append(Spacer(1, 8))
                
                # Add section content
                if isinstance(section_content, list):
                    # Handle bullet points
                    for item in section_content:
                        if item.strip():
                            story.append(Paragraph(f"• {item.strip()}", self.styles['ResumeBody']))
                else:
                    # Handle paragraph content
                    paragraphs = section_content.split('\n')
                    for paragraph in paragraphs:
                        if paragraph.strip():
                            story.append(Paragraph(paragraph.strip(), self.styles['ResumeBody']))
                
                story.append(Spacer(1, 12))
            
            # Build PDF
            doc.build(story)
            
            return filepath
            
        except Exception as e:
            logger.error(f"Error creating resume PDF: {str(e)}")
            raise
    
    def _parse_resume_content(self, content: str) -> Dict[str, Any]:
        """Parse resume content into sections"""
        sections = {}
        current_section = "Summary"
        current_content = []
        
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if this is a section header
            if line.isupper() or line.endswith(':') or any(keyword in line.lower() for keyword in ['summary', 'experience', 'education', 'skills', 'contact']):
                # Save previous section
                if current_content:
                    sections[current_section] = current_content if len(current_content) > 1 else current_content[0]
                
                # Start new section
                current_section = line.replace(':', '').strip()
                current_content = []
            else:
                current_content.append(line)
        
        # Save last section
        if current_content:
            sections[current_section] = current_content if len(current_content) > 1 else current_content[0]
        
        return sections
    
    def overlay_text_on_pdf(self, original_pdf_path: str, text_content: str, output_path: str) -> str:
        """
        Overlay text content on an existing PDF template
        """
        try:
            # Read original PDF
            reader = PdfReader(original_pdf_path)
            writer = PdfWriter()
            
            # Get first page
            page = reader.pages[0]
            
            # Create a new PDF with the text overlay
            packet = BytesIO()
            can = canvas.Canvas(packet, pagesize=letter)
            
            # Add text content
            y_position = 750  # Start from top
            lines = text_content.split('\n')
            
            for line in lines:
                if line.strip():
                    can.drawString(72, y_position, line.strip())  # 72 points = 1 inch margin
                    y_position -= 14  # Line spacing
            
            can.save()
            
            # Move to the beginning of the StringIO buffer
            packet.seek(0)
            
            # Create a new PDF with the overlay
            overlay = PdfReader(packet)
            overlay_page = overlay.pages[0]
            
            # Merge the overlay with the original page
            page.merge_page(overlay_page)
            
            # Add the merged page to the writer
            writer.add_page(page)
            
            # Write the result to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                writer.write(temp_file)
                temp_path = temp_file.name
            
            return temp_path
            
        except Exception as e:
            logger.error(f"Error overlaying text on PDF: {str(e)}")
            # Fallback to creating new PDF
            return self.create_cover_letter_pdf(text_content, "User", "cover_letter.pdf")

# Create a global instance
pdf_editor = PDFEditor() 