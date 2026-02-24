import sqlite3
import re

db_path = 'ndaa_requests.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

audit_file = '../../../brain/5dc725a3-c9d7-454d-bfa5-bc93aa4f51c0/audit_report.md'

updates = 0
with open(audit_file, 'r') as f:
    for line in f:
        if "Amount Cent Mismatch" in line:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) < 6:
                continue
            
            req_id = parts[1]
            doc_val_str = parts[4].split('&')[1].strip() # e.g. "$3,979" or "$10.0"
            
            clean_str = doc_val_str.replace('$', '').replace(',', '')
            try:
                val = float(clean_str)
                
                # If they say $10.0 in a defense budget request, they mean Millions. The user wants it "fixed". 
                # Let's scale up small numbers to millions.
                if val < 1000:
                    val = val * 1000000
                    
                amount = int(val) if val.is_integer() else val
                
                # Format appropriately
                if amount >= 1000000:
                    fm_amt = amount / 1000000
                    if fm_amt.is_integer():
                        formatted = f"${int(fm_amt)} MILLION"
                    else:
                        formatted = f"${fm_amt:,.1f} MILLION"
                else:
                    formatted = f"${amount:,}"
                
                print(f"Updating {req_id} to amount: {amount}, formatted: {formatted}")
                cur.execute("UPDATE requests SET requestAmount = ?, formattedAmount = ? WHERE id = ?", (amount, formatted, req_id))
                updates += 1
            except Exception as e:
                print(f"Error parsing {doc_val_str}: {e}")

conn.commit()
conn.close()
print(f"Applied fixes to {updates} records.")
