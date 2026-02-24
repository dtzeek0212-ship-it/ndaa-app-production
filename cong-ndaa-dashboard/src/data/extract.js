import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const REQUESTS_DIR = '/Users/David/Desktop/NDAA/Requests';
const OUTPUT_FILE = './src/data/realData.json';

function parseAmount(text) {
    // Look for something like $15,500,000 or $15.5 million or $15M
    const matches = [...text.matchAll(/\$([\d,]+)(?:\.\d+)?\s*(million|M|k|K|billion|B)?/gi)];
    let maxAmount = 2500000; // Default fallback $2.5M

    for (const match of matches) {
        let num = parseFloat(match[1].replace(/,/g, ''));
        const modifier = match[2] ? match[2].toLowerCase() : '';

        if (modifier === 'million' || modifier === 'm') {
            num *= 1000000;
        } else if (modifier === 'billion' || modifier === 'b') {
            num *= 1000000000;
        } else if (modifier === 'k') {
            num *= 1000;
        }

        if (num > 1000 && num < 1000000000) { // arbitrary bounds for reasonability
            if (num > maxAmount || maxAmount === 2500000) {
                maxAmount = num;
            }
        }
    }
    return maxAmount;
}

function extractData(text, filename) {
    // Helper to safely extract via regex
    const extract = (regex, fallback = "") => {
        const match = text.match(regex);
        return match && match[1] ? match[1].trim() : fallback;
    };

    const companyName = extract(/Requesting Organization:\s*([^\n]+)/i, filename.replace(/\.(docx|pdf)$/i, ''));

    const proposalSummaryRegex = /Proposal Summary:\s*([\s\S]*?)(?=\n\s*(?:[•\-\*])\s*Justification:|\n\s*Justification:)/i;
    let briefSummary = extract(proposalSummaryRegex, "Review full document for proposal summary.");
    if (briefSummary.length > 300) briefSummary = briefSummary.substring(0, 300) + "...";

    // justification removed as it's not currently used in the UI, keeping regex clean

    let budgetLanguage = extract(/Exact language being requested:\s*([\s\S]*)/i, "See full document for exact language.");
    if (budgetLanguage.length > 500) budgetLanguage = budgetLanguage.substring(0, 500) + "...";

    const pe = extract(/(?:Line Item\/PE Title:|Appropriations Account:)\s*([^\n]+)/i, "Standard PE");

    const cityOrCounty = extract(/If Yes, City or County:\s*([^\n]+)/i, "Statewide/National Impact");
    const districtImpact = cityOrCounty && cityOrCounty.trim() !== "" ? `Impacts ${cityOrCounty}` : "Statewide/National Impact";

    // Search for the max dollar amount in the whole text to guess the request
    const requestAmount = parseAmount(text);

    // Try to find domain keywords in summary
    let domain = 'General';
    const textLower = text.toLowerCase();
    if (textLower.includes('cyber') || textLower.includes('zero trust')) domain = 'Cyber';
    else if (textLower.includes('space') || textLower.includes('satellite')) domain = 'Space';
    else if (textLower.includes('navy') || textLower.includes('naval') || textLower.includes('submarine')) domain = 'Naval';
    else if (textLower.includes('aviation') || textLower.includes('drone') || textLower.includes('uas')) domain = 'Aviation';
    else if (textLower.includes('ai') || textLower.includes('artificial intelligence') || textLower.includes('machine learning')) domain = 'AI/ML';
    else if (textLower.includes('soldier') || textLower.includes('lethality') || textLower.includes('vision')) domain = 'Soldier Lethality';

    // Tier logic: since they're new, maybe put them all as Tier 2 to start, or randomize for demo
    const tier = "Tier 2 (Under Review)";

    return {
        id: `REQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        companyName,
        requestAmount,
        formattedAmount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(requestAmount),
        programElement: pe,
        briefSummary: briefSummary.trim(),
        districtImpact: districtImpact.trim(),
        budgetLanguage: budgetLanguage.trim(),
        domain,
        tier
    };
}

async function processDirectory(dirPath) {
    let results = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            results = results.concat(await processDirectory(fullPath));
        } else if (entry.isFile() && !entry.name.startsWith('~')) {
            try {
                let text = '';
                if (entry.name.toLowerCase().endsWith('.docx')) {
                    const result = await mammoth.extractRawText({ path: fullPath });
                    text = result.value;
                } else if (entry.name.toLowerCase().endsWith('.pdf')) {
                    const dataBuffer = fs.readFileSync(fullPath);
                    const data = await pdfParse(dataBuffer);
                    text = data.text;
                } else {
                    continue; // skip other files
                }

                console.log(`Parsed: ${entry.name}`);
                const extracted = extractData(text, entry.name);
                results.push(extracted);

            } catch (err) {
                console.error(`Error parsing ${entry.name}: ${err.message}`);
            }
        }
    }
    return results;
}

async function main() {
    console.log('Starting ingestion from:', REQUESTS_DIR);
    if (!fs.existsSync(REQUESTS_DIR)) {
        console.error('Directory not found!');
        return;
    }

    const allRequests = await processDirectory(REQUESTS_DIR);

    // Sort by request amount
    allRequests.sort((a, b) => b.requestAmount - a.requestAmount);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allRequests, null, 2));
    console.log(`\nSuccessfully extracted ${allRequests.length} requests! Saved to ${OUTPUT_FILE}`);
}

main();
