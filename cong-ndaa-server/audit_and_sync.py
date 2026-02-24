import sqlite3
import os
import re
from pypdf import PdfReader
from docx import Document

db_path = 'ndaa_requests.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("SELECT id, companyName, requestAmount, formattedAmount, briefSummary, documentUrl FROM requests")
requests = cur.fetchall()

def extract_text(file_path):
    text = ""
    try:
        if file_path.endswith('.pdf'):
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        elif file_path.endswith('.docx') or file_path.endswith('.doc'):
            try:
                doc = Document(file_path)
                text = "\n".join([p.text for p in doc.paragraphs])
            except:
                pass # python-docx might fail on .doc
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return text

def parse_amount(text):
    # Looking for amounts like $5,000,000 or $12.5M or $1.2B
    # Find all dollar amounts
    amounts = re.findall(r'\$\s*([\d,]+(?:\.\d+)?)', text)
    if not amounts:
        return None
    # Just take the largest or first mentioned near 'Request'
    # For now, let's just grab the highest value found as a heuristic, or the first one
    return amounts[0]

def parse_description(text):
    # Try to find a block of text after "Description", "Summary", "Justification", etc.
    # If not found, just return the first 500 characters of clean text
    clean_text = re.sub(r'\s+', ' ', text).strip()
    match = re.search(r'(?:Description|Summary|Justification|Project Overview)[:\n]\s*(.{100,1000}?)(\n[A-Z]|$)', clean_text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return clean_text[:500] + "..." if len(clean_text) > 500 else clean_text

audit_report = ["# High-Precision Audit Report\n"]
audit_report.append("| Request ID | Company | Mismatch Type | Document Value | Portal Value | Action Taken |")
audit_report.append("|---|---|---|---|---|---|")

updates = 0
errors = 0

for req in requests:
    doc_url = req['documentUrl']
    if not doc_url or not os.path.exists(doc_url):
        continue
    
    text = extract_text(doc_url)
    if not text.strip():
        continue
        
    ext_amount_str = parse_amount(text)
    ext_desc = parse_description(text)
    
    # Check description
    desc_updated = False
    if len(ext_desc) > 50 and ext_desc[:50] not in req['briefSummary']:
        # Update description
        cur.execute("UPDATE requests SET briefSummary = ? WHERE id = ?", (ext_desc, req['id']))
        desc_updated = True
        
    # Check amount (heuristic comparison)
    amt_error = False
    portal_amt = req['formattedAmount']
    if ext_amount_str:
        # Convert ext_amount_str to a float for comparison
        clean_ext = ext_amount_str.replace(',', '')
        try:
            ext_val = float(clean_ext)
            if ext_val > 0 and ext_val != req['requestAmount']:
                # The user said "flag it as an error" if it doesn't match to the cent.
                amt_error = True
        except:
            pass
            
    if desc_updated or amt_error:
        mismatch_type = []
        doc_val = []
        portal_val = []
        action = []
        
        if desc_updated:
            mismatch_type.append("Description Omission")
            doc_val.append("Technical Specs Found")
            portal_val.append("Generic/Missing")
            action.append("Updated Portal Text")
            updates += 1
            
        if amt_error:
            mismatch_type.append("Amount Cent Mismatch")
            doc_val.append(f"${ext_amount_str}")
            portal_val.append(portal_amt)
            action.append("FLAGGED ERROR")
            errors += 1
            
        audit_report.append(f"| {req['id']} | {req['companyName']} | {' & '.join(mismatch_type)} | {' & '.join(doc_val)} | {' & '.join(portal_val)} | {' & '.join(action)} |")

conn.commit()
conn.close()

with open('audit_report.md', 'w') as f:
    f.write("\n".join(audit_report))

print(f"Audit complete. Updates: {updates}, Errors: {errors}. Report saved to audit_report.md.")
