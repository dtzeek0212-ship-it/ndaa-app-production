const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'ndaa_requests.db');
const db = new sqlite3.Database(dbPath);

const realisticImpacts = [
    "Enhances lethality by accelerating target acquisition and providing real-time situational awareness in contested environments. This capability directly reduces the time-on-target required for precision strikes.",
    "Modernizes aging fleet logistics, ensuring forward-deployed Marines maintain uninterrupted supply lines during sustained operations. It significantly reduces the administrative burden on maintainers.",
    "Improves battlefield medical readiness by delivering critical blood supplies via autonomous unmanned systems to distributed forces. This directly increases the survivability rate of wounded combatants.",
    "Fortifies cyber-resilience of frontline command networks against near-peer adversaries. It ensures continuous operational capability and protects troop movement data from interception.",
    "Replaces legacy communication nodes with secure, high-bandwidth satellite links, increasing command and control effectiveness. Soldiers will experience fewer signal drops in austere environments.",
    "Provides next-generation kinetic effectors that extend the engagement range of ground forces beyond enemy counter-battery fire. This modernization ensures overmatch and enhanced troop safety.",
    "Automates intelligence processing at the tactical edge, reducing the time required to identify emerging threats. Commanders can execute operational decisions faster, minimizing unit vulnerability.",
    "Upgrades soldier-worn power management systems to reduce physical load and extend mission duration without resupply. It directly impacts the physical readiness and mobility of dismounted infantry."
];

const vagueImpact = "Flag as 'Needs Clarification' if no direct impact to the warfighter can be identified in the text.";

db.serialize(() => {
    // Add column if not exists
    db.run("ALTER TABLE requests ADD COLUMN warfighterImpact TEXT", (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error(err.message);
        }
    });

    db.all("SELECT id, briefSummary FROM requests", (err, rows) => {
        if (err) throw err;

        const stmt = db.prepare("UPDATE requests SET warfighterImpact = ? WHERE id = ?");

        let count = 0;
        rows.forEach((row, i) => {
            let impactText = "";

            // Determine if it should be vague (about 15-20% chance)
            if (i % 6 === 0) {
                impactText = vagueImpact;
            } else {
                // Pick a realistic impact based on the row ID or index
                impactText = realisticImpacts[i % realisticImpacts.length];
            }

            stmt.run(impactText, row.id);
            count++;
        });

        stmt.finalize();
        console.log(`Updated ${count} records with Warfighter Impact BLUFs.`);
    });
});
