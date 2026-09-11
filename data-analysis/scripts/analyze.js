/**
 * IVY HOMES — Complete Data Analysis
 * Answers Q1–Q10 and identifies data patterns
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

const listings = JSON.parse(readFileSync(join(DATA_DIR, 'listings.json'), 'utf-8'));
const rentals = JSON.parse(readFileSync(join(DATA_DIR, 'rentals.json'), 'utf-8'));
const projects = JSON.parse(readFileSync(join(DATA_DIR, 'projects.json'), 'utf-8'));
const metadata = JSON.parse(readFileSync(join(DATA_DIR, 'metadata.json'), 'utf-8'));

const REFERENCE = new Date('2026-09-10T00:00:00+05:30');
const REFERENCE_MINUS_7 = new Date(REFERENCE.getTime() - 7 * 24 * 60 * 60 * 1000);
const ASSIGNED_LOCALITY = 'balewadi';

console.log('=== IVY HOMES DATA ANALYSIS ===');
console.log(`Listings: ${listings.length} (API total: ${metadata.listings_total})`);
console.log(`Rentals: ${rentals.length} (API total: ${metadata.rentals_total})`);
console.log(`Projects: ${projects.length} (API total: ${metadata.projects_total})`);
console.log(`Reference: ${REFERENCE.toISOString()}`);

// ========== Q1 ==========
console.log('\n\n========== Q1: TOTAL LISTING RECORDS ==========');
const listingIds = listings.map(l => l.listing_id);
const uniqueListingIds = new Set(listingIds);
console.log(`Total records fetched: ${listings.length}`);
console.log(`Unique listing_ids: ${uniqueListingIds.size}`);
console.log(`Duplicates: ${listings.length - uniqueListingIds.size}`);

const idCounts = {};
for (const id of listingIds) idCounts[id] = (idCounts[id] || 0) + 1;
const dupeIds = Object.entries(idCounts).filter(([, c]) => c > 1);
if (dupeIds.length > 0) {
  console.log(`Duplicate IDs (${dupeIds.length}):`);
  dupeIds.slice(0, 30).forEach(([id, count]) => console.log(`  ${id}: ${count}x`));
}

// Deduplicate
const uniqueListings = [];
const seen = new Set();
for (const l of listings) {
  if (!seen.has(l.listing_id)) {
    seen.add(l.listing_id);
    uniqueListings.push(l);
  }
}
console.log(`Unique listing records: ${uniqueListings.length}`);
console.log(`>>> Q1: ${listings.length} raw, ${uniqueListings.length} unique IDs`);

// ========== Q2 ==========
console.log('\n\n========== Q2: UNIQUE PROPERTIES ==========');

// Try several identity combinations
const identityTests = [
  { name: 'lat+lng', fn: l => `${l.latitude}|${l.longitude}` },
  { name: 'lat+lng+floor', fn: l => `${l.latitude}|${l.longitude}|${l.floor}` },
  { name: 'lat+lng+floor+bed', fn: l => `${l.latitude}|${l.longitude}|${l.floor}|${l.bedroom}` },
  { name: 'lat+lng+floor+bed+carpet', fn: l => `${l.latitude}|${l.longitude}|${l.floor}|${l.bedroom}|${l.carpet_area}` },
  { name: 'apt+loc+floor+bed+carpet', fn: l => `${l.apartment_name}|${l.locality}|${l.floor}|${l.bedroom}|${l.carpet_area}` },
  { name: 'apt+loc+floor+bed+bath+carpet', fn: l => `${l.apartment_name}|${l.locality}|${l.floor}|${l.bedroom}|${l.bathroom}|${l.carpet_area}` },
];

for (const test of identityTests) {
  const map = {};
  for (const l of uniqueListings) {
    const key = test.fn(l);
    if (!map[key]) map[key] = [];
    map[key].push(l);
  }
  const multiGroups = Object.values(map).filter(g => g.length > 1);
  const totalMulti = multiGroups.reduce((s, g) => s + g.length, 0);
  console.log(`  ${test.name}: ${Object.keys(map).length} unique (${multiGroups.length} groups with ${totalMulti} records)`);
}

// Deep dive: show groups for most promising identity
const bestIdentity = l => `${l.latitude}|${l.longitude}|${l.floor}|${l.bedroom}|${l.carpet_area}`;
const propGroups = {};
for (const l of uniqueListings) {
  const key = bestIdentity(l);
  if (!propGroups[key]) propGroups[key] = [];
  propGroups[key].push(l);
}
const multiGroups = Object.entries(propGroups).filter(([, g]) => g.length > 1).sort((a, b) => b[1].length - a[1].length);
console.log(`\nSample duplicate property groups (lat+lng+floor+bed+carpet):`);
multiGroups.slice(0, 10).forEach(([key, group]) => {
  console.log(`\n  Key: ${key}`);
  group.forEach(l => {
    console.log(`    ${l.listing_id} | ${l.apartment_name} | price=${l.price} | website=${l.website} | posted=${l.posted_at}`);
  });
});

// ========== Q3 ==========
console.log('\n\n========== Q3: ACTIVE LISTINGS ==========');
const liveTrue = uniqueListings.filter(l => l.is_live === true).length;
const liveFalse = uniqueListings.filter(l => l.is_live === false).length;
console.log(`is_live true: ${liveTrue}`);
console.log(`is_live false: ${liveFalse}`);
console.log(`>>> Q3: ${liveTrue}`);

// ========== Q4 ==========
console.log('\n\n========== Q4: CORRUPT LISTING IDS ==========');
const corrupt = [];
for (const l of uniqueListings) {
  const reasons = [];
  if (l.price < 0) reasons.push(`negative price: ${l.price}`);
  if (l.carpet_area < 0) reasons.push(`negative carpet_area: ${l.carpet_area}`);
  if (l.super_built_up_area < 0) reasons.push(`negative super_built_up_area: ${l.super_built_up_area}`);
  if (l.floor > l.total_floors && l.total_floors > 0) reasons.push(`floor(${l.floor}) > total_floors(${l.total_floors})`);
  if (l.bedroom < 0) reasons.push(`negative bedroom: ${l.bedroom}`);
  if (l.bathroom < 0) reasons.push(`negative bathroom: ${l.bathroom}`);
  if (l.bedroom === 0 && l.property_type !== 'plot') reasons.push(`zero bedrooms for ${l.property_type}`);
  if (l.carpet_area > 0 && l.super_built_up_area > 0 && l.carpet_area > l.super_built_up_area * 1.5) {
    reasons.push(`carpet_area(${l.carpet_area}) >> super_built_up_area(${l.super_built_up_area})`);
  }
  if (reasons.length > 0) {
    corrupt.push({ id: l.listing_id, reasons, price: l.price, carpet: l.carpet_area, sba: l.super_built_up_area, floor: l.floor, total_floors: l.total_floors, bed: l.bedroom, bath: l.bathroom });
  }
}
console.log(`Corrupt records: ${corrupt.length}`);
corrupt.forEach(c => console.log(`  ${c.id}: ${c.reasons.join('; ')} | p=${c.price} ca=${c.carpet} sba=${c.sba} fl=${c.floor}/${c.total_floors} bed=${c.bed} bath=${c.bath}`));
const corruptIds = corrupt.map(c => c.id).sort();
console.log(`>>> Q4: [${corruptIds.join(', ')}]`);

// Explore price distribution more
console.log('\n--- Price distribution ---');
const allPrices = uniqueListings.map(l => l.price).sort((a, b) => a - b);
console.log(`Min: ${allPrices[0]}, Max: ${allPrices[allPrices.length-1]}`);
console.log(`Bottom 30:`, allPrices.slice(0, 30));
console.log(`Top 10:`, allPrices.slice(-10));

// Check very low prices that might indicate wrong units
const veryLow = uniqueListings.filter(l => l.price > 0 && l.price < 50000);
console.log(`\nPrices 0-50000 (${veryLow.length}):`);
veryLow.forEach(l => console.log(`  ${l.listing_id}: price=${l.price} bed=${l.bedroom} carpet=${l.carpet_area} type=${l.property_type} loc=${l.locality}`));

// ========== Q5 ==========
console.log('\n\n========== Q5: TOTAL MONTHLY RENT ==========');
// Check for rental duplicates
const rentalIdCounts = {};
for (const r of rentals) rentalIdCounts[r.listing_id] = (rentalIdCounts[r.listing_id] || 0) + 1;
const rentalDupes = Object.entries(rentalIdCounts).filter(([, c]) => c > 1);
console.log(`Total rental records: ${rentals.length}, unique IDs: ${Object.keys(rentalIdCounts).length}, dupes: ${rentalDupes.length}`);

const balewadiRentals = rentals.filter(r => r.locality === ASSIGNED_LOCALITY);
console.log(`Rentals in ${ASSIGNED_LOCALITY}: ${balewadiRentals.length}`);
const totalRent = balewadiRentals.reduce((sum, r) => sum + (r.price || 0), 0);
console.log(`Total monthly rent: ${totalRent}`);
console.log(`>>> Q5: ${totalRent}`);

// ========== Q7 ==========
console.log('\n\n========== Q7: COSTLIEST PROJECT ==========');
projects.sort((a, b) => b.price_max - a.price_max);
console.log('Top 10 projects by price_max:');
projects.slice(0, 10).forEach(p => console.log(`  ${p.project_id}: max=${p.price_max} min=${p.price_min} name=${p.apartment_name}`));

console.log('\nBottom 5 projects by price_max:');
const projSorted = [...projects].sort((a, b) => a.price_max - b.price_max);
projSorted.slice(0, 5).forEach(p => console.log(`  ${p.project_id}: max=${p.price_max} min=${p.price_min}`));

// Determine unit: if max=3.22 and listing prices are ~3220000, then projects are in crores
// Let's cross-reference a project with its listings
const testProj = projects[0];
const testProjListings = uniqueListings.filter(l => l.project_id === testProj.project_id);
console.log(`\nCross-reference: Project ${testProj.project_id} (${testProj.apartment_name})`);
console.log(`  Project price_min=${testProj.price_min}, price_max=${testProj.price_max}`);
console.log(`  Listing prices:`, testProjListings.map(l => l.price));
if (testProjListings.length > 0) {
  const avgListingPrice = testProjListings.reduce((s, l) => s + l.price, 0) / testProjListings.length;
  console.log(`  Avg listing price: ${avgListingPrice}`);
  console.log(`  Ratio avg/max: ${(avgListingPrice / testProj.price_max).toFixed(0)}`);
  console.log(`  If project in crores: max=${testProj.price_max * 10000000}`);
  console.log(`  If project in lakhs: max=${testProj.price_max * 100000}`);
}

const costliest = projects[0];
console.log(`\n>>> Q7 (raw): ${costliest.project_id}, price_max=${costliest.price_max}`);

// ========== Q8 ==========
console.log('\n\n========== Q8: LISTINGS LAST 7 DAYS ==========');
// Listings posted_at has no timezone suffix
// Test both interpretations
const refMs = REFERENCE.getTime();
const ref7Ms = REFERENCE_MINUS_7.getTime();

const countIST = uniqueListings.filter(l => {
  const d = new Date(l.posted_at + '+05:30');
  return d.getTime() >= ref7Ms && d.getTime() < refMs;
}).length;

const countUTC = uniqueListings.filter(l => {
  const d = new Date(l.posted_at + 'Z');
  return d.getTime() >= ref7Ms && d.getTime() < refMs;
}).length;

const countRaw = uniqueListings.filter(l => {
  const d = new Date(l.posted_at);
  return d.getTime() >= ref7Ms && d.getTime() < refMs;
}).length;

console.log(`posted_at treated as IST: ${countIST}`);
console.log(`posted_at treated as UTC: ${countUTC}`);
console.log(`posted_at raw: ${countRaw}`);

// Show listings near boundary
const nearBoundary = uniqueListings
  .map(l => ({ id: l.listing_id, raw: l.posted_at, ist: new Date(l.posted_at + '+05:30').getTime() }))
  .filter(x => Math.abs(x.ist - refMs) < 2 * 24 * 3600 * 1000)
  .sort((a, b) => b.ist - a.ist);
console.log(`\nListings near reference boundary (IST):`);
nearBoundary.slice(0, 15).forEach(x => console.log(`  ${x.id}: ${x.raw}`));

console.log(`\n>>> Q8: IST=${countIST}, UTC=${countUTC}, raw=${countRaw}`);

// ========== Q9 ==========
console.log('\n\n========== Q9: FAKE LISTING IDS ==========');

// Investigation 1: Phone frequency
const phoneFreq = {};
for (const l of uniqueListings) {
  const p = l.posted_by_contact;
  if (!phoneFreq[p]) phoneFreq[p] = [];
  phoneFreq[p].push(l);
}
const topPhones = Object.entries(phoneFreq).sort((a, b) => b[1].length - a[1].length);
console.log('Top 20 phones by listing count:');
topPhones.slice(0, 20).forEach(([phone, ls]) => {
  const names = [...new Set(ls.map(l => l.posted_by_name))];
  const locs = [...new Set(ls.map(l => l.locality))];
  const types = [...new Set(ls.map(l => l.posted_by))];
  console.log(`  ${phone}: ${ls.length} listings, names=[${names.join(',')}], locs=[${locs.join(',')}], type=[${types.join(',')}]`);
});

// Investigation 2: Unverified listings analysis
const unverified = uniqueListings.filter(l => l.is_verified === false);
console.log(`\nUnverified listings: ${unverified.length}`);
if (unverified.length > 0 && unverified.length < 100) {
  console.log('Unverified listing details:');
  unverified.forEach(l => {
    console.log(`  ${l.listing_id}: ${l.posted_by_name} (${l.posted_by_contact}), ${l.apartment_name}, ${l.locality}, price=${l.price}, posted_by=${l.posted_by}`);
  });
}

// Investigation 3: Same contact info across listings in different projects/localities
// A real seller usually has 1-2 properties; someone with 20 is likely an agent/fake
const suspiciousThreshold = 8;
const suspiciousPhones = topPhones.filter(([, ls]) => ls.length >= suspiciousThreshold);
console.log(`\nPhones with >= ${suspiciousThreshold} listings (potential lead gen):`);
let fakeIds = [];
suspiciousPhones.forEach(([phone, ls]) => {
  const names = [...new Set(ls.map(l => l.posted_by_name))];
  const types = [...new Set(ls.map(l => l.posted_by))];
  console.log(`  ${phone} (${names.join(', ')}) [${types.join(',')}]: ${ls.length} listings`);
});

// Investigation 4: Posted_by type distribution
const byType = {};
for (const l of uniqueListings) {
  byType[l.posted_by] = (byType[l.posted_by] || 0) + 1;
}
console.log(`\nPosted by distribution:`, byType);

// Investigation 5: Title/description patterns - "urgent", "below market"
const urgentKeywords = ['urgent', 'below market', 'distress', 'must sell', 'immediate'];
const urgentListings = uniqueListings.filter(l => {
  const desc = (l.description || '').toLowerCase();
  return urgentKeywords.some(k => desc.includes(k));
});
console.log(`\nListings with urgent keywords: ${urgentListings.length}`);
urgentListings.slice(0, 10).forEach(l => {
  console.log(`  ${l.listing_id}: "${l.description?.slice(0, 100)}"`);
});

// Investigation 6: Future dates (posted in future)
const futureListings = uniqueListings.filter(l => {
  const d = new Date(l.posted_at + '+05:30');
  return d > REFERENCE;
});
console.log(`\nListings posted after reference date: ${futureListings.length}`);
futureListings.slice(0, 20).forEach(l => console.log(`  ${l.listing_id}: posted=${l.posted_at}`));

// ========== Q10 ==========
console.log('\n\n========== Q10: PROJECTS WITH WRONG LISTING COUNT ==========');
// Need to check: for each project, does total_listings match count of listings with that project_id?
// But wait - the API's project_id filter on listings might not work (from investigation we saw it returned all 3684)
// So we need to count from our data

const projectListingMap = {};
for (const l of uniqueListings) {
  if (l.project_id) {
    projectListingMap[l.project_id] = (projectListingMap[l.project_id] || 0) + 1;
  }
}

// Deduplicate projects
const projIdSet = new Set();
const uniqueProjects = [];
for (const p of projects) {
  if (!projIdSet.has(p.project_id)) {
    projIdSet.add(p.project_id);
    uniqueProjects.push(p);
  }
}
console.log(`Total projects: ${projects.length}, unique: ${uniqueProjects.length}`);

let wrongCount = 0;
const wrongProjects = [];
const rightProjects = [];
for (const p of uniqueProjects) {
  const actual = projectListingMap[p.project_id] || 0;
  if (actual !== p.total_listings) {
    wrongCount++;
    wrongProjects.push({ id: p.project_id, reported: p.total_listings, actual });
  } else {
    rightProjects.push({ id: p.project_id, reported: p.total_listings, actual });
  }
}
console.log(`Wrong: ${wrongCount}, Correct: ${rightProjects.length}`);
console.log('\nSample wrong:');
wrongProjects.slice(0, 20).forEach(p => console.log(`  ${p.id}: reported=${p.reported}, actual=${p.actual}`));
console.log('\nSample correct:');
rightProjects.slice(0, 10).forEach(p => console.log(`  ${p.id}: reported=${p.reported}, actual=${p.actual}`));
console.log(`\n>>> Q10: ${wrongCount}`);

// ========== SUMMARY ==========
console.log('\n\n========================================');
console.log('           ANSWERS SUMMARY');
console.log('========================================');
console.log(`Q1  total_listing_records:            ${listings.length} fetched, ${uniqueListings.length} unique IDs`);
console.log(`Q2  unique_properties:                See identity analysis above`);
console.log(`Q3  active_listings (is_live=true):    ${liveTrue}`);
console.log(`Q4  corrupt_listing_ids:              [${corruptIds.join(', ')}]`);
console.log(`Q5  total_monthly_rent (balewadi):    ${totalRent}`);
console.log(`Q6  avg_price_per_sqft_2bhk:          preliminary (needs fake exclusion)`);
console.log(`Q7  costliest_project:                ${costliest.project_id} max=${costliest.price_max}`);
console.log(`Q8  listings_last_7_days:             IST=${countIST}`);
console.log(`Q9  fake_listing_ids:                 Needs further investigation`);
console.log(`Q10 projects_with_wrong_listing_count: ${wrongCount}`);

writeFileSync(join(DATA_DIR, 'analysis-output.json'), JSON.stringify({
  q1: { fetched: listings.length, unique_ids: uniqueListings.length },
  q3: liveTrue,
  q4: corruptIds,
  q5: totalRent,
  q7_raw: { project_id: costliest.project_id, price_max: costliest.price_max },
  q8: { ist: countIST, utc: countUTC, raw: countRaw },
  q10: wrongCount,
  corrupt_details: corrupt,
  duplicate_listing_ids: dupeIds.map(([id]) => id),
}, null, 2));
