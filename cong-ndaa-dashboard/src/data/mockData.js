// Generates 80 realistic NDAA requests based on standard defense program language
const domains = ['Cyber', 'Space', 'Naval', 'Aviation', 'Land', 'Soldier Lethality', 'AI/ML'];
const tiers = ['Tier 1 (Must-Have)', 'Tier 2 (Strong/State-Level)', 'Tier 3 (Pass)'];

// Realistic company prefixes/suffixes for defense contractors
const companyPrefixes = ['Anduril', 'Palantir', 'Lockheed', 'Raytheon', 'Northrop', 'L3', 'BAE', 'General Dynamics', 'Boeing', 'AeroVironment', 'Shield', 'Ghost', 'Rebellion', 'Epirus', 'HawkEye', 'Spartan', 'Valkyrie', 'Kratos', 'Apex', 'Sentinel'];
const companySuffixes = ['Technologies', 'Systems', 'Defense', 'Space', 'Dynamics', 'Aerospace', 'Solutions', 'Corp', 'LLC', 'Networks', 'Analytics'];

// Realistic programmatic summaries
const summaries = [
  "Funding advances rapid prototyping of autonomous drone swarm capabilities for contested logistics in INDOPACOM.",
  "Provides procurement funding for next-generation satellite secure communications resilient against jamming.",
  "Accelerates the development of AI-driven threat detection models for unified command and control networks (JADC2).",
  "Procures advanced night vision and thermal optics to enhance soldier lethality in low-light, dense urban environments.",
  "Sustains operations for shore-based anti-submarine warfare tracking systems protecting strategic naval assets.",
  "Invests in directed energy weapon prototypes (microwaves/lasers) to counter low-cost UAS threats.",
  "Modernizes legacy radar systems with active electronically scanned array (AESA) technology for F-series fighters.",
  "Funds the hardening of critical defense supply chains and rare-earth mineral processing facilities domestically.",
  "Supports the deployment of mobile, tactical micro-grids and battery storage to reduce forward-operating base vulnerability.",
  "Develops an enterprise-wide zero trust architecture layer for classified defense cloud environments."
];

const impacts = [
  "Directly supports 150+ high-tech manufacturing jobs at the facility in the 7th District.",
  "Headquartered in the district; vital to the local aerospace and defense innovation hub.",
  "Supports local university partnerships for engineering and STEM pipelines within the state.",
  "No direct physical footprint in district, but supports broader national security strategy directly benefiting major state bases.",
  "Partners with 5 small business subcontractors located within the state's manufacturing corridor.",
  "Crucial for forces deployed from the state's primary Army/Air Force installations."
];

const budgetLanguages = [
  "Increase PE 0604120A by $5.0M for 'Advanced Autonomous Swarm Development'.",
  "Appropriate $10.5M to PE 0204311N for 'Next-Gen Sensor Integration'.",
  "Add $2.5M to PE 0603114N - Directed Energy Applied Research.",
  "Increase Navy RDT&E line 24 by $15M for 'JADC2 Node Hardening'.",
  "Provide $7.0M in Air Force Procurement, Line 15 for 'Base Defense Micro-grids'.",
  "Increase Defense-Wide RDT&E PE 0303120K by $4.0M for 'AI Threat Detection'."
];

export const generateMockData = () => {
  const data = [];
  
  for (let i = 1; i <= 82; i++) {
    // Randomize data
    const domain = domains[Math.floor(Math.random() * domains.length)];
    // Tiers mapping: 20% Tier 1, 40% Tier 2, 40% Tier 3
    const randTier = Math.random();
    const tier = randTier < 0.2 ? tiers[0] : (randTier < 0.6 ? tiers[1] : tiers[2]);
    
    const company = `${companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)]} ${companySuffixes[Math.floor(Math.random() * companySuffixes.length)]}`;
    
    // Amount between $500k and $25M
    const rawAmount = Math.floor(Math.random() * 24500000) + 500000;
    
    // Program Elements like 'PE 0603789F'
    const letters = ['A', 'N', 'F', 'D', 'K']; // Army, Navy, Air Force, Defense-Wide etc
    const pe = `PE 0${Math.floor(Math.random() * 900000) + 100000}${letters[Math.floor(Math.random() * letters.length)]}`;
    
    data.push({
      id: `REQ-${String(i).padStart(3, '0')}`,
      companyName: company,
      requestAmount: rawAmount,
      formattedAmount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rawAmount),
      programElement: pe,
      briefSummary: summaries[Math.floor(Math.random() * summaries.length)],
      districtImpact: impacts[Math.floor(Math.random() * impacts.length)],
      budgetLanguage: budgetLanguages[Math.floor(Math.random() * budgetLanguages.length)],
      domain: domain,
      tier: tier
    });
  }
  
  // Sort primarily by Tier, then by amount (desc)
  return data.sort((a, b) => {
    if (a.tier < b.tier) return -1;
    if (a.tier > b.tier) return 1;
    return b.requestAmount - a.requestAmount;
  });
};

export const mockRequests = generateMockData();
