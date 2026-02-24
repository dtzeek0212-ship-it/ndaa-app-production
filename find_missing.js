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

const dbPath = path.resolve(__dirname, 'cong-ndaa-server/ndaa_requests.db');
const db = new sqlite3.Database(dbPath);

console.log(`Found ${allLocalFiles.length} local files.`);

db.all("SELECT companyName FROM requests", (err, rows) => {
  if (err) throw err;
  const dbCompanyNames = rows.map(r => r.companyName.toLowerCase());
  console.log(`Found ${dbCompanyNames.length} DB records.`);
  
  const missingFiles = [];
  allLocalFiles.forEach(file => {
    const fileName = path.basename(file).toLowerCase();
    // Rough match: see if any word in the filename is in the DB, or vice versa
    // This isn't perfect, so let's just print the filenames for now.
    missingFiles.push(file);
  });
  
  // For the sake of matching, let's just create 11 new records from the files not easily matched, or just add all files as "documentUrl" to existing records.
  
});
