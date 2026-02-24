import sys
from pypdf import PdfReader
from docx import Document
import os

files_to_check = [
    '/Users/David/Desktop/NDAA/Requests/21Feb Request/ARC-Mills FY27 NDAA.pdf',
    '/Users/David/Desktop/NDAA/Requests/20Feb Request /FY27 NDAA Request Form 1DS.docx'
]

for file_path in files_to_check:
    print(f"--- Checking {file_path} ---")
    if file_path.endswith('.pdf'):
        try:
            reader = PdfReader(file_path)
            text = ""
            for i in range(min(2, len(reader.pages))): # just first 2 pages
                text += reader.pages[i].extract_text() + "\n"
            print(text[:1000])
        except Exception as e:
            print(f"Error reading PDF: {e}")
    elif file_path.endswith('.docx'):
        try:
            doc = Document(file_path)
            text = "\n".join([p.text for p in doc.paragraphs])
            print(text[:1000])
        except Exception as e:
            print(f"Error reading DOCX: {e}")
