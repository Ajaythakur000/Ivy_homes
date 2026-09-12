/**
 * Final investigation: Fake listings and project price units
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

const listings = JSON.parse(readFileSync(join(DATA_DIR, 'listings.json'), 'utf-8'));
const projects = JSON.parse(readFileSync(join(DATA_DIR, 'projects.json'), 'utf-8'));

// ============================================================
// FAKE LISTINGS — Final identification
// ============================================================
console.log('=== FAKE LISTING IDENTIFICATION ===\n');

// SIGNAL 1: Very low prices that are likely in wrong units
// These listings have prices ~7910-17510 while median is ~11M
// They could be prices in LAKHS (7.91 lakhs = 791000) or just garbage
const suspiciouslyLowPrice = listings.filter(l => l.price > 0 && l.price < 50000);
console.log(`Listings with suspiciously low price (< 50000): ${suspiciouslyLowPrice.length}`);
suspiciouslyLowPrice.forEach(l => {
  console.log(`  ${l.listing_id}: price=${l.price} bed=${l.bedroom} carpet=${l.carpet_area} loc=${l.locality} posted_by=${l.posted_by_name} (${l.posted_by_contact}) type=${l.posted_by} is_live=${l.is_live} verified=${l.is_verified}`);
});

// SIGNAL 2: Same person claiming to be owner, agent, AND builder
const namePhoneTypeMap = {};
for (const l of listings) {
  const key = `${l.posted_by_name}|${l.posted_by_contact}`;
  if (!namePhoneTypeMap[key]) namePhoneTypeMap[key] = { types: new Set(), listings: [] };
  namePhoneTypeMap[key].types.add(l.posted_by);
  namePhoneTypeMap[key].listings.push(l);
}
const multiTypePersons = Object.entries(namePhoneTypeMap)
  .filter(([, v]) => v.types.size >= 3) // owner + agent + builder
  .sort((a, b) => b[1].listings.length - a[1].listings.length);

console.log(`\nPersons claiming 3 different types (owner+agent+builder): ${multiTypePersons.length}`);
const multiTypeFakeIds = [];
multiTypePersons.forEach(([key, v]) => {
  console.log(`  ${key}: types=[${[...v.types]}], listings=${v.listings.length}`);
  v.listings.forEach(l => {
    multiTypeFakeIds.push(l.listing_id);
    console.log(`    ${l.listing_id}: type=${l.posted_by}, price=${l.price}, loc=${l.locality}, apt=${l.apartment_name}`);
  });
});

// SIGNAL 3: Listings that appear on same building coordinates with wildly different prices/configs
// (already explored — different units in same building, not necessarily fake)

// SIGNAL 4: Check "title" field in rentals for locality mismatch
// (already explored — no mismatches found in listings)

// SIGNAL 5: Look at the 6 very low price listings — are they all from same source?
console.log('\n\nLow-price listing analysis:');
const lowPriceIds = suspiciouslyLowPrice.map(l => l.listing_id);
console.log(`Low price IDs: [${lowPriceIds.sort().join(', ')}]`);

// Are these the same as negative-price listings? (They'd be in corrupt)
const negPriceIds = listings.filter(l => l.price < 0).map(l => l.listing_id);
console.log(`Negative price IDs: [${negPriceIds.sort().join(', ')}]`);

// SIGNAL 6: Carpet area anomalies — impossibly small
const tinyCarpet = listings.filter(l => l.carpet_area > 0 && l.carpet_area < 100 && l.bedroom > 0);
console.log(`\nTiny carpet area (< 100 sqft, non-plot): ${tinyCarpet.length}`);
tinyCarpet.forEach(l => {
  console.log(`  ${l.listing_id}: carpet=${l.carpet_area} sba=${l.super_built_up_area} bed=${l.bedroom} price=${l.price} loc=${l.locality}`);
});

// SIGNAL 7: Listings with negative/zero areas (additional corrupt check)
const badArea = listings.filter(l => l.carpet_area <= 0 || l.super_built_up_area <= 0);
console.log(`\nBad area (carpet<=0 or sba<=0): ${badArea.length}`);
badArea.forEach(l => {
  console.log(`  ${l.listing_id}: carpet=${l.carpet_area} sba=${l.super_built_up_area} bed=${l.bedroom} price=${l.price}`);
});

// Let me also check for very suspicious price-per-sqft outliers
console.log('\n\nPrice-per-sqft outlier analysis:');
const ppsfData = listings
  .filter(l => l.price > 0 && l.carpet_area > 0)
  .map(l => ({ id: l.listing_id, ppsf: l.price / l.carpet_area, price: l.price, carpet: l.carpet_area }))
  .sort((a, b) => a.ppsf - b.ppsf);

console.log('Lowest PPSF:');
ppsfData.slice(0, 20).forEach(d => console.log(`  ${d.id}: ppsf=${d.ppsf.toFixed(2)} (price=${d.price}, carpet=${d.carpet})`));
console.log('\nHighest PPSF:');
ppsfData.slice(-20).forEach(d => console.log(`  ${d.id}: ppsf=${d.ppsf.toFixed(2)} (price=${d.price}, carpet=${d.carpet})`));

// ============================================================
// PROJECT PRICE UNITS — Final determination
// ============================================================
console.log('\n\n=== PROJECT PRICE UNIT FINAL ===');
// Cross-reference ALL projects that have listings
const projWithListings = {};
for (const l of listings) {
  if (l.project_id) {
    if (!projWithListings[l.project_id]) projWithListings[l.project_id] = [];
    projWithListings[l.project_id].push(l);
  }
}

let lakhsMatch = 0, croresMatch = 0, rupeesMatch = 0;
for (const p of projects) {
  const pListings = projWithListings[p.project_id];
  if (!pListings || pListings.length === 0) continue;
  
  const listingPrices = pListings.map(l => l.price).filter(p => p > 0);
  if (listingPrices.length === 0) continue;
  
  const listMin = Math.min(...listingPrices);
  const listMax = Math.max(...listingPrices);
  
  // Test lakhs hypothesis
  const projMinL = p.price_min * 100000;
  const projMaxL = p.price_max * 100000;
  if (listMin >= projMinL * 0.5 && listMax <= projMaxL * 2) lakhsMatch++;
  
  // Test crores hypothesis
  const projMinC = p.price_min * 10000000;
  const projMaxC = p.price_max * 10000000;
  if (listMin >= projMinC * 0.5 && listMax <= projMaxC * 2) croresMatch++;
  
  // Test rupees hypothesis (project prices already in rupees)
  if (listMin >= p.price_min * 0.5 && listMax <= p.price_max * 2) rupeesMatch++;
}

console.log(`Lakhs match: ${lakhsMatch}`);
console.log(`Crores match: ${croresMatch}`);
console.log(`Rupees match: ${rupeesMatch}`);

// Show specific examples
console.log('\nDetailed cross-reference (first 15 with listings):');
let shown = 0;
for (const p of projects) {
  const pListings = projWithListings[p.project_id];
  if (!pListings || pListings.length === 0) continue;
  if (shown++ >= 15) break;
  
  const listPrices = pListings.map(l => l.price).filter(p => p > 0).sort((a, b) => a - b);
  console.log(`  ${p.project_id} (${p.apartment_name}):`);
  console.log(`    Project: min=${p.price_min}, max=${p.price_max}`);
  console.log(`    Listings: ${listPrices[0]} - ${listPrices[listPrices.length - 1]} (${pListings.length} listings)`);
  console.log(`    In lakhs: ${p.price_min * 100000} - ${p.price_max * 100000}`);
}

// ============================================================
// ============================================================
// COMPILE FINAL FAKE LIST
// ============================================================
console.log('\n\n=== COMPILING FAKE LISTING IDS ===');

// Based on evidence:
// 1. Identical duplicate descriptions are a strong sign of spam/fake listings
const descCount = {};
listings.forEach(l => { 
  if (l.description) { 
    const d = l.description.toLowerCase().trim(); 
    descCount[d] = (descCount[d] || 0) + 1; 
  } 
});
const fakeSet = new Set();
listings.forEach(l => {
  if (l.description) {
    const d = l.description.toLowerCase().trim();
    if (descCount[d] > 1) fakeSet.add(l.listing_id);
  }
});

console.log(`Fake candidates:`);
console.log(`  Total unique fake: ${fakeSet.size}`);
console.log(`  IDs: [${[...fakeSet].sort().join(', ')}]`);

// ============================================================
// SAVE FINAL ANSWERS
// ============================================================
const corruptIds = [];
for (const l of listings) {
  const isCorrupt = 
    l.price < 0 ||
    (l.price > 0 && l.price < 50000) || // Low price = wrong unit (corrupt, not fake)
    (l.carpet_area !== undefined && l.carpet_area < 0) ||
    (l.super_built_up_area !== undefined && l.super_built_up_area < 0) ||
    (l.floor > l.total_floors && l.total_floors > 0) ||
    (l.bedroom < 0) ||
    (l.bathroom < 0) ||
    (l.carpet_area > 0 && l.super_built_up_area > 0 && l.carpet_area > l.super_built_up_area);
  if (isCorrupt) corruptIds.push(l.listing_id);
}

const fakeIds = [...fakeSet].sort();
// Remove any overlap between corrupt and fake
const fakeOnly = fakeIds.filter(id => !corruptIds.includes(id));

// Q6: recalculate excluding both corrupt and fake
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

// Determine costliest project
// Normalizing mixed units before comparison
let costliest = { project_id: '', price_max_inr: 0 };
projects.forEach(p => {
  let valInr = 0;
  if (p.price_max < 100) { valInr = p.price_max * 10000000; } // Crores
  else { valInr = p.price_max * 100000; } // Lakhs
  
  if (valInr > costliest.price_max_inr) { 
    costliest = { project_id: p.project_id, price_max_inr: valInr, raw: p.price_max }; 
  }
});

console.log(`\nQ7: ${costliest.project_id}, raw=${costliest.raw}, INR=${costliest.price_max_inr}`);

// Save comprehensive output
const finalAnswers = {
  total_listing_records: listings.length,
  unique_properties: listings.length, // All 3800 are unique physical properties
  active_listings: listings.filter(l => l.is_live === true).length,
  corrupt_listing_ids: corruptIds.sort(),
  total_monthly_rent: (() => {
    const rentals = JSON.parse(readFileSync(join(DATA_DIR, 'rentals.json'), 'utf-8'));
    return rentals.filter(r => r.locality === 'balewadi').reduce((s, r) => s + r.price, 0);
  })(),
  avg_price_per_sqft_2bhk: parseFloat(avgPpsf.toFixed(2)),
  costliest_project: { project_id: costliest.project_id, price_max_inr: costliestInr },
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
};

console.log('\n\n========== FINAL ANSWERS ==========');
console.log(JSON.stringify(finalAnswers, null, 2));

writeFileSync(join(DATA_DIR, 'final-answers.json'), JSON.stringify(finalAnswers, null, 2));
console.log('\nSaved to data/final-answers.json');
