const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Setup file uploads
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Initialize SQLite Database
const dbPath = process.env.DATABASE_URL || path.resolve(__dirname, 'ndaa_requests.db');

app.get('/api/document', (req, res) => {
    const docPath = req.query.path;
    if (docPath && fs.existsSync(docPath)) {
        const ext = path.extname(docPath).toLowerCase();
        if (ext === '.pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(docPath) + '"');
        } else if (ext === '.docx' || ext === '.doc') {
            res.setHeader('Content-Disposition', 'attachment; filename="' + path.basename(docPath) + '"');
        }
        res.sendFile(docPath);
    } else {
        res.status(404).send('Document not found');
    }
});
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`
      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        companyName TEXT,
        requestAmount INTEGER,
        formattedAmount TEXT,
        programElement TEXT,
        briefSummary TEXT,
        districtImpact TEXT,
        budgetLanguage TEXT,
        domain TEXT,
        tier TEXT,
        hasValidOffset BOOLEAN DEFAULT 0,
        isHascJurisdiction BOOLEAN DEFAULT 1,
        isStaffRecommended BOOLEAN DEFAULT 0,
        voteStatus TEXT DEFAULT 'pending',
        memberPriority TEXT,
        documentUrl TEXT,
        warfighterImpact TEXT,
        isDrl BOOLEAN DEFAULT 0,
        warfighterService TEXT
      )
    `, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            } else {
                // Ensure new columns exist on older databases
                db.run("ALTER TABLE requests ADD COLUMN documentUrl TEXT", () => { });
                db.run("ALTER TABLE requests ADD COLUMN warfighterImpact TEXT", () => { });
                db.run("ALTER TABLE requests ADD COLUMN isDrl BOOLEAN DEFAULT 0", () => { });
                db.run("ALTER TABLE requests ADD COLUMN warfighterService TEXT", () => { });
                seedDatabase();
            }
        });

        db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requestId TEXT,
        author TEXT,
        text TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requestId) REFERENCES requests (id)
      )
    `);
    }
});

// Seed data if empty
function seedDatabase() {
    db.get('SELECT COUNT(*) AS count FROM requests', (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        if (row.count === 0) {
            console.log('Seeding initial data...');
            try {
                const dataPath = path.resolve(__dirname, '../cong-ndaa-dashboard/src/data/realData.json');
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

                const stmt = db.prepare(`
          INSERT INTO requests (
            id, companyName, requestAmount, formattedAmount, programElement, briefSummary, 
            districtImpact, budgetLanguage, domain, tier, hasValidOffset
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

                data.forEach(req => {
                    // Mock some initial data
                    const hasValidOffset = Math.random() > 0.5;

                    stmt.run(
                        req.id, req.companyName, req.requestAmount, req.formattedAmount, req.programElement, req.briefSummary,
                        req.districtImpact, req.budgetLanguage, req.domain, req.tier, hasValidOffset
                    );
                });
                stmt.finalize();
                console.log('Database seeded successfully.');
            } catch (e) {
                console.error('Error seeding database:', e);
            }
        }
    });
}

// API Endpoints

// Get all requests
app.get('/api/requests', (req, res) => {
    db.all('SELECT * FROM requests', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Bulk Delete
app.post('/api/requests/bulk-delete', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No IDs provided" });
    }
    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM requests WHERE id IN (${placeholders})`, ids, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deletedCount: this.changes });
    });
});

// Delete a request by ID
app.delete('/api/requests/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM requests WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: `Deleted request ${id}` });
    });
});

// Export CSV of Authorized Requests
app.get('/api/export/csv', (req, res) => {
    db.all("SELECT id, companyName, requestAmount, formattedAmount, programElement, briefSummary, domain, districtImpact, isHascJurisdiction FROM requests WHERE voteStatus = 'yes'", (err, rows) => {
        if (err) return res.status(500).send(err.message);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const csvPath = path.join(__dirname, `HASC_Submission_${timestamp}.csv`);

        const csvWriter = createObjectCsvWriter({
            path: csvPath,
            header: [
                { id: 'id', title: 'Request ID' },
                { id: 'companyName', title: 'Organization' },
                { id: 'requestAmount', title: 'Amount Requested ($)' },
                { id: 'formattedAmount', title: 'Formatted Amount' },
                { id: 'programElement', title: 'Program Element (PE)' },
                { id: 'domain', title: 'Domain' },
                { id: 'districtImpact', title: 'District Impact' },
                { id: 'isHascJurisdiction', title: 'Jurisdiction' },
                { id: 'briefSummary', title: 'Technical Specification / Summary' }
            ]
        });

        csvWriter.writeRecords(rows)
            .then(() => {
                res.download(csvPath, `HASC_Submission_${timestamp}.csv`, (err) => {
                    if (err) console.error("Error sending CSV:", err);
                    fs.unlink(csvPath, () => { }); // Cleanup after sending
                });
            })
            .catch(err => res.status(500).send(err.message));
    });
});

// Export PDF Briefing Book of Authorized Requests
app.get('/api/export/pdf', (req, res) => {
    db.all("SELECT * FROM requests WHERE voteStatus = 'yes' ORDER BY domain ASC", (err, rows) => {
        if (err) return res.status(500).send(err.message);

        const doc = new PDFDocument({ margin: 50 });
        let filename = `Authorized_Briefing_Book_${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Title Page
        doc.fontSize(24).font('Helvetica-Bold').text('FY27 NDAA Authorized Requests', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).font('Helvetica').text('Office of Representative Cory Mills (FL-07)', { align: 'center' });
        doc.moveDown(3);

        const totalAmount = rows.reduce((sum, row) => sum + row.requestAmount, 0);
        doc.fontSize(14).text(`Total Authorized Submissions: ${rows.length}`, { align: 'center' });
        doc.text(`Total Authorized Value: $${(totalAmount / 1000000).toFixed(2)} Million`, { align: 'center' });

        doc.addPage();

        let currentDomain = '';

        rows.forEach((req) => {
            if (req.domain !== currentDomain) {
                if (currentDomain !== '') doc.addPage();
                currentDomain = req.domain;
                doc.fontSize(20).font('Helvetica-Bold').fillColor('#003366').text(`${currentDomain.toUpperCase()} PORTFOLIO`, { underline: true });
                doc.moveDown();
            } else {
                doc.moveDown(2);
                doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cccccc').stroke();
                doc.moveDown();
            }

            doc.fontSize(16).font('Helvetica-Bold').fillColor('black').text(req.companyName);
            doc.fontSize(12).font('Helvetica').fillColor('#555555').text(`Amount: ${req.formattedAmount} | PE: ${req.programElement}`);
            doc.moveDown(0.5);

            if (req.warfighterImpact) {
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#3b82f6').text('Direct Warfighter Impact (BLUF):');
                doc.fontSize(11).font('Helvetica').fillColor('black').text(req.warfighterImpact);
                doc.moveDown(0.5);
            }

            doc.fontSize(11).font('Helvetica-Bold').fillColor('black').text('Technical Specification / Justification:');
            doc.fontSize(10).font('Helvetica').text(req.briefSummary, { align: 'justify' });
            doc.moveDown(0.5);

            doc.fontSize(10).font('Helvetica-Oblique').fillColor('#777777').text(`Impact: ${req.districtImpact}`);
        });

        doc.end();
    });
});

// Helper for extraction
function extractHeuristics(text, originalFilename) {
    let amount = 0;
    let formattedAmount = "$0";

    // Naive regex to grab largest dollar amount
    const amtMatches = text.match(/\$[\d,]+(?:\.\d+)?(?:[ ]?(?:MILLION|BILLION|M|B))?/gi);
    if (amtMatches && amtMatches.length > 0) {
        // Just take the first substantial hit or try parsing
        let rawStr = amtMatches[0].replace(/[$,]/g, '').toUpperCase();
        let multiplier = 1;
        if (rawStr.includes('MILLION') || rawStr.includes('M')) multiplier = 1000000;
        if (rawStr.includes('BILLION') || rawStr.includes('B')) multiplier = 1000000000;
        rawStr = rawStr.replace(/MILLION|BILLION|M|B/g, '').trim();

        const floatVal = parseFloat(rawStr);
        if (!isNaN(floatVal)) {
            amount = floatVal * multiplier;
            if (amount >= 1000000) {
                formattedAmount = `$${(amount / 1000000).toFixed(1).replace('.0', '')} MILLION`;
            } else {
                formattedAmount = `$${amount.toLocaleString()}`;
            }
        }
    }

    // Intelligent summary grabbing (Maps to Proposed Title)
    let briefSummary = "Pending Title Extraction...";

    // Capture a large chunk of text after the heading to reliably grab a few sentences
    const descMatch = text.match(/(?:Proposal Summary|Project Overview|Project Title|Proposal Title|Program Name|Project Name)[\s\n:]+([\s\S]{50,1000})/i);
    if (descMatch && descMatch[1].trim() !== "") {
        let extractedBlock = descMatch[1].trim();

        // Match up to 3 sentences using common punctuation. 
        // [^.!?]+ matches non-punctuation, [.!?]+ matches the punctuation, (?:\s|$) checks for trailing space or end
        const sentences = extractedBlock.match(/[^.!?]+[.!?]+(?:\s|$)/g);

        if (sentences && sentences.length > 0) {
            // Take the first 3 sentences, join them, and collapse any line breaks/extra spaces
            briefSummary = sentences.slice(0, 3).join('').replace(/\s+/g, ' ').trim();
        } else {
            // Fallback if no clean punctuation is found
            briefSummary = extractedBlock.substring(0, 200).replace(/\s+/g, ' ').trim() + "...";
        }
    }

    // Default company name to the filename (without truncating abruptly if the regex fails)
    let companyName = originalFilename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');

    // Explicitly grab "Requesting Organization" or similar permutations, handling newline jumps
    const orgMatch = text.match(/(?:Requesting Organization|Organization Name|Name of Organization|Entity Name|Requesting Entity|Company Name|Organization)[\s\n:]+([A-Za-z0-9][^\n]+)/i);
    if (orgMatch && orgMatch[1].trim() !== "") {
        companyName = orgMatch[1].trim();
    }

    // Impact logic
    let districtImpact = "Statewide Florida Consideration";
    if (text.toLowerCase().includes('orlando') || text.toLowerCase().includes('district 7') || text.toLowerCase().includes('fl-07')) {
        districtImpact = "District 07 (Orlando Region)";
    }

    let warfighterImpact = "Flag as 'Needs Clarification' if no direct impact to the warfighter can be identified in the text.";
    if (text.toLowerCase().includes('lethality') || text.toLowerCase().includes('survivability') || text.toLowerCase().includes('readiness')) {
        warfighterImpact = "Enhances operational readiness directly by modernizing key logistics nodes. This directly reduces time-on-target bottlenecks for deployed service members.";
    }

    let isDrl = false;
    if (text.match(/Direct Report Language|Report Language|\bDRL\b/i)) {
        isDrl = true;
    }

    // Warfighter Service Extraction
    let services = [];
    if (text.match(/\bArmy\b/i)) services.push("Army");
    if (text.match(/\bNavy\b/i)) services.push("Navy");
    if (text.match(/\bMarines|Marine Corps\b/i)) services.push("Marines");
    if (text.match(/\bAir Force\b/i)) services.push("Air Force");
    if (text.match(/\bSpace Force\b/i)) services.push("Space Force");

    let warfighterService = services.length > 0 ? services.join(", ") : "Joint / Unknown";

    return {
        companyName,
        requestAmount: isDrl && !amount ? 0 : (amount || 5000000),
        formattedAmount: isDrl && !amount ? "$0" : (formattedAmount === "$0" ? "$5 MILLION" : formattedAmount),
        programElement: "Pending PE Assignment",
        briefSummary,
        domain: "HASC",
        districtImpact,
        warfighterImpact,
        isDrl,
        warfighterService
    };
}

// File Upload & Scan Endpoint
app.post('/api/extract', upload.array('documents'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded.' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
        const filePath = file.path;
        let extractedText = "";

        try {
            if (file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdfParse(dataBuffer);
                extractedText = data.text;
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ path: filePath });
                extractedText = result.value;
            } else {
                errors.push({ filename: file.originalname, error: 'Unsupported file type. Use .pdf or .docx' });
                continue;
            }

            const heuristics = extractHeuristics(extractedText, file.originalname);
            const newId = 'REQ-SCAN' + Math.floor(Math.random() * 100000);
            const absPath = path.resolve(filePath);

            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO requests (id, companyName, requestAmount, formattedAmount, programElement, briefSummary, domain, districtImpact, isHascJurisdiction, hasValidOffset, isStaffRecommended, voteStatus, documentUrl, warfighterImpact, isDrl, warfighterService)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    newId,
                    heuristics.companyName,
                    heuristics.requestAmount,
                    heuristics.formattedAmount,
                    heuristics.programElement,
                    heuristics.briefSummary,
                    heuristics.domain,
                    heuristics.districtImpact,
                    1, // true 
                    0, // false
                    0, // false
                    'pending',
                    absPath,
                    heuristics.warfighterImpact,
                    heuristics.isDrl,
                    heuristics.warfighterService
                ], function (err) {
                    if (err) {
                        console.error("DB Insert Error", err);
                        reject(err);
                    } else {
                        results.push({ id: newId, data: heuristics });
                        resolve();
                    }
                });
            });

        } catch (e) {
            console.error("Extraction error", e);
            errors.push({ filename: file.originalname, error: e.message });
        }
    }

    res.json({ success: true, message: `Processed ${results.length} files.`, results, errors });
});

// Update vote status
app.post('/api/vote', (req, res) => {
    const { id, vote } = req.body;

    if (!['yes', 'no', 'hold', 'pending'].includes(vote)) {
        return res.status(400).json({ error: 'Invalid vote status' });
    }

    db.run('UPDATE requests SET voteStatus = ? WHERE id = ?', [vote, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, message: `Vote set to ${vote} for ${id}`, changes: this.changes });
    });
});

// Toggle Staff Recommendation
app.post('/api/staff-recommend', (req, res) => {
    const { id, isRecommended } = req.body;

    db.run('UPDATE requests SET isStaffRecommended = ? WHERE id = ?', [isRecommended ? 1 : 0, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, message: `Staff recommendation updated for ${id}` });
    });
});

// Add comment
app.post('/api/comments', (req, res) => {
    const { requestId, author, text } = req.body;
    if (!requestId || !text) {
        return res.status(400).json({ error: 'Missing requestId or text' });
    }

    db.run('INSERT INTO comments (requestId, author, text) VALUES (?, ?, ?)', [requestId, author, text], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, id: this.lastID });
    });
});

// Get comments for a request
app.get('/api/comments/:requestId', (req, res) => {
    db.all('SELECT * FROM comments WHERE requestId = ? ORDER BY timestamp DESC', [req.params.requestId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Mock OCR Extraction Endpoint
app.post('/api/extract', (req, res) => {
    // In a real scenario, this would handle a file upload and parse it.
    // We'll mimic sending back extracted data.
    res.json({
        success: true,
        extractedData: {
            companyName: 'New Vendor Corp',
            requestAmount: 50000000,
            formattedAmount: '$50,000,000',
            programElement: 'PE 0601234F',
            briefSummary: 'Extracted summary from uploaded document...',
            hasValidOffset: true
        }
    });
});

// React SPA fallback
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        next();
    }
});

app.listen(PORT, () => {
    console.log(`NDAA V3 Backend API listening on port ${PORT}`);
});
