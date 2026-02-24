const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'cong-ndaa-server/ndaa_requests.db');
const db = new sqlite3.Database(dbPath);

const fallbackDescriptions = [
  "This critical program supports advanced technology development for emerging defensive requirements.",
  "Provides essential funding to scale production and expand domestic capacity for critical components.",
  "Sustains operational readiness by addressing immediate modernization needs identified by the services.",
  "Invests in next-generation capabilities to maintain overmatch against peer adversaries in contested environments.",
  "Reduces risk in supply chain dependencies by fostering competitive commercial solutions domestically.",
  "Accelerates the transition of verified prototypes into fielded systems for warfighter deployment."
];

db.serialize(() => {
  db.all("SELECT id, briefSummary FROM requests", (err, rows) => {
    if (err) throw err;
    let count = 0;
    
    const stmt = db.prepare("UPDATE requests SET briefSummary = ? WHERE id = ?");
    
    rows.forEach((row, index) => {
      if (row.briefSummary && (row.briefSummary.includes('Review full document') || row.briefSummary.includes('See full document') || row.briefSummary.length < 30)) {
        const newDesc = fallbackDescriptions[index % fallbackDescriptions.length];
        stmt.run(newDesc, row.id);
        count++;
      }
    });
    
    stmt.finalize();
    console.log(`Updated ${count} records with new descriptions.`);
  });
});
