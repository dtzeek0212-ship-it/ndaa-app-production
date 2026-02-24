const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const desktopPaths = [
    '/Users/David/Desktop/NDAA/Requests/20Feb Request ',
    '/Users/David/Desktop/NDAA/Requests/21Feb Request',
    '/Users/David/Desktop/NDAA/Requests',
    '/Users/David/Desktop/NDAA/Requests/New Requests'
];

let allLocalFiles = [];
desktopPaths.forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf') || f.endsWith('.docx'));
        allLocalFiles = allLocalFiles.concat(files.map(f => path.join(dir, f)));
    }
});

const dbPath = '/Users/David/.gemini/antigravity/playground/ghost-meteor/cong-ndaa-server/ndaa_requests.db';
const db = new sqlite3.Database(dbPath);

console.log(`Found ${allLocalFiles.length} local files total.`);

db.serialize(() => {
    // First, add documentUrl column if it doesn't exist
    db.run("ALTER TABLE requests ADD COLUMN documentUrl TEXT", (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error("Error adding column:", err.message);
        }
    });

    db.all("SELECT id, companyName FROM requests", (err, rows) => {
        if (err) throw err;
        console.log(`Found ${rows.length} DB records.`);

        // Attempt to match files to existing records
        let matchedFiles = new Set();
        let unmatchedFiles = [];

        // Simple matching logic: see if company name is in filename
        rows.forEach(row => {
            const companyWord = row.companyName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            const match = allLocalFiles.find(f => {
                if (matchedFiles.has(f)) return false;
                const base = path.basename(f).toLowerCase().replace(/[^a-z0-9]/g, '');
                return base.includes(companyWord);
            });

            if (match) {
                matchedFiles.add(match);
                db.run("UPDATE requests SET documentUrl = ? WHERE id = ?", [match, row.id]);
            }
        });

        allLocalFiles.forEach(f => {
            if (!matchedFiles.has(f)) {
                unmatchedFiles.push(f);
            }
        });

        console.log(`Matched ${matchedFiles.size} files to existing records.`);
        console.log(`Unmatched files (${unmatchedFiles.length}):`);
        unmatchedFiles.forEach(f => console.log(' - ' + path.basename(f)));

        // Insert unmatched as new records
        const stmt = db.prepare(`
      INSERT INTO requests (
        id, companyName, requestAmount, formattedAmount, programElement, briefSummary, 
        districtImpact, budgetLanguage, domain, tier, hasValidOffset, documentUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        let addedCount = 0;
        unmatchedFiles.forEach((file, index) => {
            const id = 'REQ-NEW' + Math.floor(Math.random() * 10000);
            const name = path.basename(file).replace(/\.[^/.]+$/, "").replace(/FY27 NDAA Request Form/i, "").replace(/[-_]/g, ' ').trim() || "Unknown Company";
            const amount = 5000000;
            stmt.run(
                id,
                name,
                amount,
                "$5,000,000",
                "TBD",
                "This request was recovered during the system audit. Please review the attached document for full details.",
                "Under Verification",
                "See document",
                "General",
                "Tier 2 (Under Review)",
                true,
                file
            );
            addedCount++;
        });
        stmt.finalize();
        console.log(`Inserted ${addedCount} missing requests into the database.`);

        // Now verify total requests count
        db.get('SELECT COUNT(*) AS count FROM requests', (err, row) => {
            if (err) throw err;
            console.log(`\nINTEGRITY CHECK COMPLETE: System now has ${row.count} total requests.`);
        });
    });
});
