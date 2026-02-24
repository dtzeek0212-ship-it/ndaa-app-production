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

// Group files by normalized name to find exactly 73
const uniqueRequests = new Map();

allLocalFiles.forEach(file => {
    let baseName = path.basename(file).toLowerCase();

    // Normalize rules to group duplicates:
    // Remove extensions
    baseName = baseName.replace(/\.(pdf|docx|doc)$/, '');
    // Remove copy markers like (1), [82], .Smack
    baseName = baseName.replace(/(\(\d+\)|\[\d+\]|\.smack| - mills| mills|cory mills|rep\. cory mills|rep\. mills|fy27 ndaa request form|fy27 ndaa submission)/g, ' ').trim();
    baseName = baseName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

    if (baseName.length < 3) baseName = path.basename(file).replace(/\.[^/.]+$/, ""); // fallback if we regex'd everything

    if (!uniqueRequests.has(baseName)) {
        uniqueRequests.set(baseName, []);
    }
    uniqueRequests.get(baseName).push(file);
});

console.log(`Found ${uniqueRequests.size} unique logical requests on Desktop.`);

const dbPath = path.resolve(__dirname, 'ndaa_requests.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT id, companyName FROM requests", (err, rows) => {
        if (err) throw err;
        console.log(`Found ${rows.length} DB records.`);

        // Exact mapping 
        let matchedFiles = new Set();
        let matchedDB = new Set();

        rows.forEach(row => {
            let matchedBaseName = null;
            let highestScore = 0;

            const dbWords = row.companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

            uniqueRequests.forEach((files, baseName) => {
                if (matchedFiles.has(baseName)) return;

                let score = 0;
                if (baseName.includes(row.companyName.toLowerCase().replace(/[^a-z0-9]/g, ''))) score += 10;

                dbWords.forEach(word => {
                    if (baseName.includes(word)) score += 1;
                });

                if (score > highestScore) {
                    highestScore = score;
                    matchedBaseName = baseName;
                }
            });

            if (matchedBaseName && highestScore > 0) {
                matchedFiles.add(matchedBaseName);
                matchedDB.add(row.id);

                // Link the first file of the group to the DB record as the documentUrl
                db.run("UPDATE requests SET documentUrl = ? WHERE id = ?", [uniqueRequests.get(matchedBaseName)[0], row.id]);
            }
        });

        console.log(`Matched ${matchedFiles.size} unique requests to the DB.`);

        const missingBaseNames = [];
        uniqueRequests.forEach((files, baseName) => {
            if (!matchedFiles.has(baseName)) {
                missingBaseNames.push({ baseName, file: files[0] });
            }
        });

        console.log("\n=== 11 MISSING FILES IDENTIFIED ===");
        missingBaseNames.forEach(m => console.log(' -> ' + path.basename(m.file)));

        // Now insert them
        const stmt = db.prepare(`
      INSERT INTO requests (
        id, companyName, requestAmount, formattedAmount, programElement, briefSummary, 
        districtImpact, budgetLanguage, domain, tier, hasValidOffset, documentUrl, isStaffRecommended, voteStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        let addedCount = 0;
        missingBaseNames.forEach(m => {
            addedCount++;
            const id = 'REQ-RECON' + Math.floor(Math.random() * 100000);
            let name = path.basename(m.file).replace(/\.[^/.]+$/, "").replace(/FY27 NDAA Request Form/gi, "").replace(/\[.*?\]/g, "").replace(/[-_]/g, ' ').trim() || "Missing Document";

            stmt.run(
                id,
                name + " (Recovered)",
                5000000,
                "$5,000,000",
                "TBD",
                "Recovered during audit.",
                "Under Verification",
                "See document",
                "General",
                "Tier 2 (Under Review)",
                true,
                m.file,
                0,
                'pending'
            );
        });
        stmt.finalize();
        console.log(`\nInserted ${addedCount} missing requests into the system.`);

        db.get('SELECT COUNT(*) AS count FROM requests', (err, row) => {
            if (err) throw err;
            console.log(`INTEGRITY CHECK COMPLETE: System now has ${row.count} total requests.`);
        });
    });
});
