import os
import tempfile
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib.colors import black, white
from io import BytesIO

class PDFEditor:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
    def create_cover_letter_pdf(self, content: str, user_name: str, filename: str) -> str:
        """
        Create a professional cover letter PDF
        """
        # Create temporary PDF file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_path = temp_file.name
        
        # Create PDF with ReportLab
        doc = SimpleDocTemplate(temp_path, pagesize=letter)
        story = []
        
        # Add content
        # Split content into paragraphs
        paragraphs = content.split('\n\n')
        
        for para in paragraphs:
            if para.strip():
                # Create paragraph with proper styling
                p = Paragraph(para.strip(), self.styles['Normal'])
                story.append(p)
                story.append(Spacer(1, 12))
        
        # Build PDF
        doc.build(story)
        
        return temp_path
    
    def create_resume_pdf(self, content: str, user_name: str, filename: str) -> str:
        """
        Create a professional resume PDF
        """
        # Create temporary PDF file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_path = temp_file.name
        
        # Create PDF with ReportLab
        doc = SimpleDocTemplate(temp_path, pagesize=letter)
        story = []
        
        # Add header with user name
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        story.append(Paragraph(user_name.upper(), header_style))
        story.append(Spacer(1, 20))
        
        # Add content
        # Split content into sections
        sections = content.split('\n\n')
        
        for section in sections:
            if section.strip():
                # Check if it's a section header (all caps)
                lines = section.strip().split('\n')
                if lines[0].isupper() and len(lines[0]) > 3:
                    # It's a section header
                    header_style = ParagraphStyle(
                        'SectionHeader',
                        parent=self.styles['Heading2'],
                        fontSize=14,
                        spaceAfter=12,
                        spaceBefore=20
                    )
                    story.append(Paragraph(lines[0], header_style))
                    
                    # Add section content
                    if len(lines) > 1:
                        content_text = '\n'.join(lines[1:])
                        p = Paragraph(content_text, self.styles['Normal'])
                        story.append(p)
                        story.append(Spacer(1, 12))
                else:
                    # Regular content
                    p = Paragraph(section.strip(), self.styles['Normal'])
                    story.append(p)
                    story.append(Spacer(1, 12))
        
        # Build PDF
        doc.build(story)
        
        return temp_path
    
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
            print(f"Error overlaying text on PDF: {str(e)}")
            # Fallback to creating new PDF
            return self.create_cover_letter_pdf(text_content, "User", "cover_letter.pdf")

# Create a global instance
pdf_editor = PDFEditor() 