import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../data');

const listings = JSON.parse(readFileSync(join(DATA_DIR, 'listings.json'), 'utf-8'));
const projects = JSON.parse(readFileSync(join(DATA_DIR, 'projects.json'), 'utf-8'));

// ============================================================
// Q9 FAKE LISTINGS
// ============================================================
console.log('\n\n=== COMPILING FAKE LISTING IDS ===');
const descMap = {};
listings.forEach(l => { 
  if (l.description && l.description.length > 20) { 
    const d = l.description.toLowerCase().trim(); 
    if (!descMap[d]) descMap[d] = [];
    descMap[d].push(l);
  } 
});

const fakeSet = new Set();
Object.values(descMap).forEach(group => {
  if (group.length > 1) {
    const uniqueNames = new Set(group.map(l => l.apartment_name?.toLowerCase()));
    const uniqueLocalities = new Set(group.map(l => l.locality?.toLowerCase()));
    // Fraud signal: identical descriptions but claiming to be distinct properties/localities
    if (uniqueNames.size > 1 || uniqueLocalities.size > 1) {
      group.forEach(l => fakeSet.add(l.listing_id));
    }
  }
});
const fakeIds = [...fakeSet].sort();
console.log(`Fake candidates:`);
console.log(`  Total unique fake: ${fakeSet.size}`);
console.log(`  IDs: [${fakeIds.join(', ')}]`);

// ============================================================
// CORRUPT LISTINGS
// ============================================================
const corruptIds = [];
for (const l of listings) {
  const isCorrupt = 
    l.price < 0 ||
    (l.carpet_area !== undefined && l.carpet_area < 0) ||
    (l.super_built_up_area !== undefined && l.super_built_up_area < 0) ||
    (l.floor > l.total_floors && l.total_floors > 0) ||
    (l.bedroom < 0) ||
    (l.bathroom < 0) ||
    (l.carpet_area > 0 && l.super_built_up_area > 0 && l.carpet_area > l.super_built_up_area);
  if (isCorrupt) corruptIds.push(l.listing_id);
}
const fakeOnly = fakeIds.filter(id => !corruptIds.includes(id));

// ============================================================
// Q6: AVG PRICE PER SQFT 2BHK
// ============================================================
const excludeIds = new Set([...corruptIds, ...fakeIds]);
const eligible2bhk = listings.filter(l =>
  l.is_live === true &&
  l.bedroom === 2 &&
  !excludeIds.has(l.listing_id) &&
  l.price > 0 &&
  l.carpet_area > 0
);
const ppsfVals = eligible2bhk.map(l => l.price / l.carpet_area);
const avgPpsf = ppsfVals.reduce((a, b) => a + b, 0) / ppsfVals.length;
console.log(`\nQ6 recalculated: ${eligible2bhk.length} eligible, avg=${avgPpsf.toFixed(2)}`);

// ============================================================
// BUG #2: Q7 COSTLIEST PROJECT
// ============================================================
let costliest = { project_id: '', price_max_inr: 0, raw: 0 };
projects.forEach(p => {
  // Find listings for this project to determine unit context
  const pListings = listings.filter(l => l.project_id === p.project_id && l.is_live && l.price > 0);
  let valInr = 0;

  if (pListings.length > 0) {
    const maxListingPrice = Math.max(...pListings.map(l => l.price));
    // Test both hypotheses against the actual highest listing price
    const asCrores = p.price_max * 10000000;
    const asLakhs = p.price_max * 100000;
    
    // Choose the unit that places price_max closest to the maximum listing price for that project
    if (Math.abs(asCrores - maxListingPrice) < Math.abs(asLakhs - maxListingPrice)) {
      valInr = asCrores;
    } else {
      valInr = asLakhs;
    }
  } else {
    // Fallback if no listings exist to compare against
    if (p.price_max < 100) { valInr = p.price_max * 10000000; } // < 100 likely Crores
    else { valInr = p.price_max * 100000; } // likely Lakhs
  }
  
  if (valInr > costliest.price_max_inr) { 
    costliest = { project_id: p.project_id, price_max_inr: valInr, raw: p.price_max }; 
  }
});
console.log(`\nQ7: ${costliest.project_id}, raw=${costliest.raw}, INR=${costliest.price_max_inr}`);

// ============================================================
// FINAL ANSWERS SAVE
// ============================================================
// BUG #1: Fixed reference to use costliest.price_max_inr instead of undefined costliestInr

// Calculate unique properties by physical attributes
// Identity: Since lat/lng are perturbed, same physical unit = locality + apartment_name + carpet_area + floor
const uniquePhysicalProps = new Set();
listings.forEach(l => {
  const hash = `${l.locality}|${l.apartment_name?.toLowerCase()}|${l.carpet_area}|${l.floor}`;
  uniquePhysicalProps.add(hash);
});

const finalAnswers = {
  total_listing_records: listings.length,
  unique_properties: uniquePhysicalProps.size,
  active_listings: listings.filter(l => l.is_live === true).length,
  corrupt_listing_ids: corruptIds.sort(),
  total_monthly_rent: (() => {
    const rentals = JSON.parse(readFileSync(join(DATA_DIR, 'rentals.json'), 'utf-8'));
    return rentals.filter(r => r.locality === 'balewadi').reduce((s, r) => s + r.price, 0);
  })(),
  avg_price_per_sqft_2bhk: parseFloat(avgPpsf.toFixed(2)),
  costliest_project: { project_id: costliest.project_id, price_max_inr: costliest.price_max_inr },
  listings_last_7_days: listings.filter(l => {
    const d = new Date(l.posted_at + '+05:30');
    return d.getTime() >= new Date('2026-09-03T00:00:00+05:30').getTime() && d.getTime() < new Date('2026-09-10T00:00:00+05:30').getTime();
  }).length,
  fake_listing_ids: fakeOnly.sort(),
  projects_with_wrong_listing_count: (() => {
    const projListingMap = {};
    for (const l of listings) {
      if (l.project_id) projListingMap[l.project_id] = (projListingMap[l.project_id] || 0) + 1;
    }
    return projects.filter(p => (projListingMap[p.project_id] || 0) !== p.total_listings).length;
  })(),
  dataset_audit_ref: "ivy-audit-2cd71bcd"
};

console.log('\n\n========== FINAL ANSWERS ==========');
console.log(JSON.stringify(finalAnswers, null, 2));

writeFileSync(join(DATA_DIR, 'final-answers.json'), JSON.stringify(finalAnswers, null, 2));
console.log('\nSaved to data/final-answers.json');

// Sync to submission.json and frontend/public/analysis-data.json
let subData = JSON.parse(readFileSync(join(__dirname, '../../submission.json'), 'utf8'));
subData.answers = finalAnswers;
writeFileSync(join(__dirname, '../../submission.json'), JSON.stringify(subData, null, 2));

let anData = JSON.parse(readFileSync(join(__dirname, '../../frontend/public/analysis-data.json'), 'utf8'));
anData.answers = finalAnswers;
anData.findings = subData.findings; // Sync findings array to analysis-data.json
writeFileSync(join(__dirname, '../../frontend/public/analysis-data.json'), JSON.stringify(anData, null, 2));
console.log('Synced answers to submission.json and frontend/public/analysis-data.json');
