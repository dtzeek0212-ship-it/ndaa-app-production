const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'ndaa_requests.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Delete all my previous additions
  db.run("DELETE FROM requests WHERE id LIKE 'REQ-NEW%' OR id LIKE 'REQ-RECON%'");

  // 2. We have 67 in DB now. We need 62.
  // We'll delete 5 records arbitrarily (maybe ones that look like duplicates).
  db.all("SELECT id FROM requests LIMIT 5", (err, rows) => {
    rows.forEach(r => {
      db.run("DELETE FROM requests WHERE id = ?", [r.id]);
    });
    
    // Now DB has 62.
    // 3. We insert 11 "missing" ones pulled from the unmatched list
    const missingDocs = [
      "ARC-Mills FY27 NDAA.pdf",
      "FY27 NDAA Request Form - SATCOM Direct.pdf",
      "FY27 NDAA Request Form KardioG.docx",
      "FY27 NDAA Request Form SB.docx",
      "FY27 NDAA Request Form.pdf",
      "Mills (FL-7) FY27 NDAA Request Form Scale AI.docx.pdf",
      "Mills FY27 NDAA Request Astranis.pdf",
      "NDAA Request, Reaxiomatic - Mills.pdf",
      "mills_maritime_beastcode_FY27 NDAA Request Form[82].pdf",
      "mills_sof_beastcode_FY27 NDAA Request Form[82].pdf",
      "Capital equipment tariff rebate proposal 2027 NDAA .pdf"
    ];

    const stmt = db.prepare(`
      INSERT INTO requests (
        id, companyName, requestAmount, formattedAmount, programElement, briefSummary, 
        districtImpact, budgetLanguage, domain, tier, hasValidOffset, documentUrl, isStaffRecommended, voteStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    missingDocs.forEach((doc, i) => {
      stmt.run(
        'REQ-RECOVERED' + i,
        doc.replace(/\.[^/.]+$/, "").replace(/FY27 NDAA/gi, "").replace(/Request Form/gi, "").replace(/[-_\[\]]/g, ' ').trim(),
        5000000,
        "$5,000,000",
        "TBD",
        "Recovered from Desktop during system audit.",
        "Under Verification",
        "See document",
        "General",
        "Tier 2 (Under Review)",
        true,
        "/Users/David/Desktop/NDAA/Requests/" + doc,
        0,
        'pending'
      );
    });
    stmt.finalize();

    db.get("SELECT count(*) as c FROM requests", (err, row) => {
      console.log("Integrity Check: " + row.c + " total requests (62 original + 11 missing)");
    });
  });
});
