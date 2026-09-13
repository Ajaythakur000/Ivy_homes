/**
 * IVY HOMES — Complete Data Analysis v2
 * Using correctly fetched data (offset-based pagination)
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

console.log('=== IVY HOMES DATA ANALYSIS v2 ===');
console.log(`Listings: ${listings.length} (API reported: ${metadata.listings.reported_total})`);
console.log(`Rentals: ${rentals.length} (API reported: ${metadata.rentals.reported_total})`);
console.log(`Projects: ${projects.length} (API reported: ${metadata.projects.reported_total})`);

// ========== Q1: total_listing_records ==========
console.log('\n========== Q1: TOTAL LISTING RECORDS ==========');
console.log(`Retrievable listing records: ${listings.length}`);
console.log(`API reported total: ${metadata.listings.reported_total}`);
console.log(`>>> Q1: ${listings.length}`);

// ========== Q2: unique_properties ==========
console.log('\n========== Q2: UNIQUE PROPERTIES ==========');

// Test multiple identity keys to find duplicates
const identityTests = [
  { name: 'listing_id', fn: l => l.listing_id },
  { name: 'lat+lng', fn: l => `${l.latitude}|${l.longitude}` },
  { name: 'lat+lng+floor', fn: l => `${l.latitude}|${l.longitude}|${l.floor}` },
  { name: 'lat+lng+floor+bed', fn: l => `${l.latitude}|${l.longitude}|${l.floor}|${l.bedroom}` },
  { name: 'lat+lng+floor+bed+carpet', fn: l => `${l.latitude}|${l.longitude}|${l.floor}|${l.bedroom}|${l.carpet_area}` },
  { name: 'apt+loc+floor+bed+carpet', fn: l => `${l.apartment_name}|${l.locality}|${l.floor}|${l.bedroom}|${l.carpet_area}` },
  { name: 'apt+loc+floor+bed+bath+carpet+sba', fn: l => `${l.apartment_name}|${l.locality}|${l.floor}|${l.bedroom}|${l.bathroom}|${l.carpet_area}|${l.super_built_up_area}` },
];

for (const test of identityTests) {
  const groups = {};
  for (const l of listings) {
    const key = test.fn(l);
    if (!groups[key]) groups[key] = [];
    groups[key].push(l);
  }
  const uniqueCount = Object.keys(groups).length;
  const dupeGroups = Object.values(groups).filter(g => g.length > 1);
  console.log(`  ${test.name}: ${uniqueCount} unique, ${dupeGroups.length} dupe groups`);
}

// Deep analysis of lat+lng duplicates - most likely property identity
const coordGroups = {};
for (const l of listings) {
  const key = `${l.latitude}|${l.longitude}`;
  if (!coordGroups[key]) coordGroups[key] = [];
  coordGroups[key].push(l);
}
const coordDupes = Object.entries(coordGroups).filter(([, g]) => g.length > 1).sort((a, b) => b[1].length - a[1].length);
console.log(`\nCoord-based duplicate groups: ${coordDupes.length}`);
console.log('Largest groups:');
coordDupes.slice(0, 5).forEach(([key, group]) => {
  console.log(`  ${key}: ${group.length} records`);
  group.forEach(l => {
    console.log(`    ${l.listing_id} | ${l.apartment_name} | ${l.locality} | bed=${l.bedroom} | floor=${l.floor} | carpet=${l.carpet_area} | price=${l.price} | web=${l.website}`);
  });
});

// Check if duplicate properties have different BHK/floor - if so they're different units
// True property identity should be coords + floor + BHK (same apartment, same floor, same config = same unit)
const unitGroups = {};
for (const l of listings) {
  const key = `${l.locality}|${l.apartment_name?.toLowerCase()}|${l.carpet_area}|${l.floor}`;
  if (!unitGroups[key]) unitGroups[key] = [];
  unitGroups[key].push(l);
}
const unitDupes = Object.entries(unitGroups).filter(([, g]) => g.length > 1).sort((a, b) => b[1].length - a[1].length);
console.log(`\nUnit-level duplicates (locality+apartment+carpet+floor): ${unitDupes.length} groups`);
unitDupes.slice(0, 10).forEach(([key, group]) => {
  console.log(`  ${key}: ${group.length} listings`);
  group.forEach(l => {
    console.log(`    ${l.listing_id} | web=${l.website} | price=${l.price} | posted_by=${l.posted_by_name}`);
  });
});

// The question says "A property described by several records counts once"
const uniqueProperties = Object.keys(unitGroups).length;
console.log(`\n>>> Q2: ${uniqueProperties} unique properties (using locality+apartment_name+carpet_area+floor)`);

// ========== Q3: active_listings ==========
console.log('\n========== Q3: ACTIVE LISTINGS ==========');
const liveTrue = listings.filter(l => l.is_live === true).length;
const liveFalse = listings.filter(l => l.is_live === false).length;
console.log(`is_live true: ${liveTrue}`);
console.log(`is_live false: ${liveFalse}`);
console.log(`>>> Q3: ${liveTrue}`);

// ========== Q4: corrupt_listing_ids ==========
console.log('\n========== Q4: CORRUPT LISTING IDS ==========');
const corrupt = [];
for (const l of listings) {
  const reasons = [];
  if (l.price < 0) reasons.push(`negative price: ${l.price}`);
  if (l.carpet_area !== undefined && l.carpet_area < 0) reasons.push(`negative carpet_area: ${l.carpet_area}`);
  if (l.super_built_up_area !== undefined && l.super_built_up_area < 0) reasons.push(`negative super_built_up_area: ${l.super_built_up_area}`);
  if (l.floor !== undefined && l.total_floors !== undefined && l.floor > l.total_floors && l.total_floors > 0) {
    reasons.push(`floor(${l.floor}) > total_floors(${l.total_floors})`);
  }
  if (l.bedroom !== undefined && l.bedroom < 0) reasons.push(`negative bedroom: ${l.bedroom}`);
  if (l.bathroom !== undefined && l.bathroom < 0) reasons.push(`negative bathroom: ${l.bathroom}`);
  if (l.carpet_area > 0 && l.super_built_up_area > 0 && l.carpet_area > l.super_built_up_area) {
    reasons.push(`carpet(${l.carpet_area}) > sba(${l.super_built_up_area})`);
  }
  if (reasons.length > 0) {
    corrupt.push({ id: l.listing_id, reasons });
    console.log(`  ${l.listing_id}: ${reasons.join('; ')}`);
  }
}
const corruptIds = corrupt.map(c => c.id).sort();
console.log(`Total corrupt: ${corrupt.length}`);
console.log(`>>> Q4: [${corruptIds.join(', ')}]`);

// Price distribution analysis
console.log('\n--- Price Distribution ---');
const prices = listings.map(l => l.price).sort((a, b) => a - b);
console.log(`Min: ${prices[0]}, P5: ${prices[Math.floor(prices.length * 0.05)]}, Median: ${prices[Math.floor(prices.length * 0.5)]}, P95: ${prices[Math.floor(prices.length * 0.95)]}, Max: ${prices[prices.length - 1]}`);

const negPrices = listings.filter(l => l.price < 0);
console.log(`Negative prices: ${negPrices.length}`);
negPrices.forEach(l => console.log(`  ${l.listing_id}: price=${l.price}, bed=${l.bedroom}, carpet=${l.carpet_area}, loc=${l.locality}, type=${l.property_type}`));

const veryLow = listings.filter(l => l.price > 0 && l.price < 100000);
console.log(`\nPrices < 1 lakh: ${veryLow.length}`);
veryLow.forEach(l => console.log(`  ${l.listing_id}: price=${l.price}, bed=${l.bedroom}, carpet=${l.carpet_area}, loc=${l.locality}`));

// ========== Q5: total_monthly_rent ==========
console.log('\n========== Q5: TOTAL MONTHLY RENT ==========');
const balewadiRentals = rentals.filter(r => r.locality === ASSIGNED_LOCALITY);
console.log(`Total rentals: ${rentals.length}`);
console.log(`Rentals in ${ASSIGNED_LOCALITY}: ${balewadiRentals.length}`);
const totalRent = balewadiRentals.reduce((sum, r) => sum + (r.price || 0), 0);
console.log(`Total monthly rent: ${totalRent}`);

// Check rental price distribution for Balewadi
const rentalPrices = balewadiRentals.map(r => r.price).sort((a, b) => a - b);
console.log(`Rental price range: ${rentalPrices[0]} - ${rentalPrices[rentalPrices.length - 1]}`);
console.log(`>>> Q5: ${totalRent}`);

// ========== Q7: costliest_project ==========
console.log('\n========== Q7: COSTLIEST PROJECT ==========');
// Determine unit of project prices
// Cross-reference with listing prices
for (const p of projects.slice(0, 3)) {
  const projListings = listings.filter(l => l.project_id === p.project_id);
  console.log(`Project ${p.project_id} (${p.apartment_name}): price_min=${p.price_min}, price_max=${p.price_max}`);
  if (projListings.length > 0) {
    const listPrices = projListings.map(l => l.price);
    console.log(`  Listing prices: ${listPrices.join(', ')}`);
    console.log(`  If proj in lakhs: min=${p.price_min * 100000}, max=${p.price_max * 100000}`);
    console.log(`  If proj in crores: min=${p.price_min * 10000000}, max=${p.price_max * 10000000}`);
  } else {
    console.log('  No matching listings found');
  }
}

const projByMax = [...projects].sort((a, b) => b.price_max - a.price_max);
console.log('\nTop 10 by price_max:');
projByMax.slice(0, 10).forEach(p => console.log(`  ${p.project_id}: max=${p.price_max}, min=${p.price_min}, name=${p.apartment_name}`));

const costliest = projByMax[0];
// Need to determine if price is in lakhs or crores
// If price_max = 97.8 and this is in lakhs, that's 97.8 lakhs = 9,780,000 INR
// If in crores, that's 97.8 crores = 978,000,000 INR
// Listing prices are ~4M-21M (40L-210L range), so project prices around 40-97 make sense as LAKHS
console.log(`\nCostliest raw: ${costliest.project_id}, max=${costliest.price_max}`);
console.log(`If lakhs: ${costliest.price_max * 100000}`);
console.log(`If crores: ${costliest.price_max * 10000000}`);

// But wait - Q7 asks for price_max_inr. Let me check ALL project price ranges
const allProjMaxes = projects.map(p => p.price_max).sort((a, b) => a - b);
console.log(`\nProject price_max range: ${allProjMaxes[0]} - ${allProjMaxes[allProjMaxes.length - 1]}`);
console.log(`Project price_min range: ${projects.map(p => p.price_min).sort((a, b) => a - b)[0]} - ${projects.map(p => p.price_min).sort((a, b) => b - a)[0]}`);

// Check: P30031 has max=1.22, min=52.4 — that's WEIRD. min > max!
// This means units might be different for min and max, OR they're in different units entirely
const weirdProjects = projects.filter(p => p.price_min > p.price_max);
console.log(`\nProjects where price_min > price_max: ${weirdProjects.length}`);
weirdProjects.slice(0, 10).forEach(p => console.log(`  ${p.project_id}: min=${p.price_min}, max=${p.price_max}, name=${p.apartment_name}`));

console.log(`>>> Q7: { project_id: "${costliest.project_id}", price_max_inr: ${costliest.price_max} } (raw, need unit conversion)`);

// ========== Q8: listings_last_7_days ==========
console.log('\n========== Q8: LISTINGS LAST 7 DAYS ==========');
const refMs = REFERENCE.getTime();
const ref7Ms = REFERENCE_MINUS_7.getTime();

// Listings have no timezone in posted_at. Server is IST. Assume IST.
const countIST = listings.filter(l => {
  const d = new Date(l.posted_at + '+05:30');
  return d.getTime() >= ref7Ms && d.getTime() < refMs;
}).length;

const countUTC = listings.filter(l => {
  const d = new Date(l.posted_at + 'Z');
  return d.getTime() >= ref7Ms && d.getTime() < refMs;
}).length;

console.log(`IST interpretation: ${countIST}`);
console.log(`UTC interpretation: ${countUTC}`);

// Show dates near reference
const nearRef = listings
  .map(l => ({ id: l.listing_id, ts: l.posted_at, ms: new Date(l.posted_at + '+05:30').getTime() }))
  .filter(x => Math.abs(x.ms - refMs) < 10 * 24 * 3600 * 1000)
  .sort((a, b) => b.ms - a.ms);
console.log(`\nListings near reference (IST):`);
nearRef.slice(0, 30).forEach(x => console.log(`  ${x.id}: ${x.ts} ${x.ms >= ref7Ms && x.ms < refMs ? '✓ IN RANGE' : ''}`));

console.log(`>>> Q8: ${countIST} (IST)`);

// ========== Q9: fake_listing_ids ==========
console.log('\n========== Q9: FAKE LISTING IDS ==========');
const descMap2 = {};
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
    if (uniqueNames.size > 1 || uniqueLocalities.size > 1) {
      group.forEach(l => fakeSet.add(l.listing_id));
    }
  }
});
const fakeIds = [...fakeSet].sort();
console.log(`Fake listings found: ${fakeIds.length}`);
const topNames = Object.entries(nameMap).sort((a, b) => b[1].length - a[1].length);
console.log('\nName frequency (top 20):');
topNames.slice(0, 20).forEach(([name, ls]) => {
  const phones = [...new Set(ls.map(l => l.posted_by_contact))];
  console.log(`  ${name}: ${ls.length} listings, phones=[${phones.join(',')}]`);
});

// Strategy 3: is_verified analysis
const verifiedCounts = { true: 0, false: 0 };
for (const l of listings) verifiedCounts[l.is_verified]++;
console.log(`\nVerified: ${verifiedCounts.true}, Unverified: ${verifiedCounts.false}`);

const unverified = listings.filter(l => l.is_verified === false);
console.log(`Unverified listing IDs (${unverified.length}):`);
unverified.forEach(l => {
  console.log(`  ${l.listing_id}: ${l.posted_by_name} (${l.posted_by_contact}), ${l.apartment_name}, ${l.locality}, price=${l.price}, is_live=${l.is_live}`);
});

// Strategy 4: Description analysis - same description across multiple listings
const descMap2 = {};
for (const l of listings) {
  const desc = l.description?.toLowerCase().trim();
  if (!descMap2[desc]) descMap2[desc] = [];
  descMap2[desc].push(l);
}
const repeatDescs = Object.entries(descMap2).filter(([, ls]) => ls.length > 1).sort((a, b) => b[1].length - a[1].length);
console.log(`\nRepeated descriptions: ${repeatDescs.length}`);
repeatDescs.slice(0, 10).forEach(([desc, ls]) => {
  console.log(`  "${desc.slice(0, 80)}...": ${ls.length} listings`);
  ls.forEach(l => console.log(`    ${l.listing_id} | ${l.apartment_name} | ${l.locality} | price=${l.price}`));
});

// Strategy 5: website analysis
const websiteStats = {};
for (const l of listings) {
  if (!websiteStats[l.website]) websiteStats[l.website] = { count: 0, verified: 0, live: 0, dead: 0 };
  websiteStats[l.website].count++;
  if (l.is_verified) websiteStats[l.website].verified++;
  if (l.is_live) websiteStats[l.website].live++;
  else websiteStats[l.website].dead++;
}
console.log('\nWebsite breakdown:');
Object.entries(websiteStats).sort((a, b) => b[1].count - a[1].count).forEach(([w, s]) => {
  console.log(`  ${w}: ${s.count} total, ${s.verified} verified, ${s.live} live, ${s.dead} dead`);
});

// Strategy 6: posted_by analysis
const postedByStats = {};
for (const l of listings) {
  if (!postedByStats[l.posted_by]) postedByStats[l.posted_by] = { count: 0, verified: 0, unverified: 0 };
  postedByStats[l.posted_by].count++;
  if (l.is_verified) postedByStats[l.posted_by].verified++;
  else postedByStats[l.posted_by].unverified++;
}
console.log('\nPosted_by breakdown:');
Object.entries(postedByStats).forEach(([t, s]) => console.log(`  ${t}: ${s.count} (${s.verified} verified, ${s.unverified} unverified)`));

// Strategy 7: Look for listings where the description doesn't match the data
// e.g., "3 BHK" in description but bedroom=2
const mismatchBhk = listings.filter(l => {
  const desc = l.description?.toLowerCase() || '';
  const bhkMatch = desc.match(/(\d+)\s*bhk/);
  if (bhkMatch) {
    const descBhk = parseInt(bhkMatch[1]);
    return descBhk !== l.bedroom;
  }
  return false;
});
console.log(`\nDescription BHK mismatches: ${mismatchBhk.length}`);
mismatchBhk.slice(0, 20).forEach(l => {
  const bhkInDesc = l.description.match(/(\d+)\s*bhk/i)?.[1];
  console.log(`  ${l.listing_id}: desc says ${bhkInDesc}BHK, data says ${l.bedroom}BHK | "${l.description.slice(0, 80)}"`);
});

// Strategy 8: Look for listings with title/apartment_name mismatching locality
const localityMismatch = listings.filter(l => {
  const desc = (l.description || '').toLowerCase();
  const title = (l.apartment_name || '').toLowerCase();
  // Check if description mentions a different locality
  const allLocs = ['hadapsar', 'wakad', 'hinjewadi', 'aundh', 'kothrud', 'magarpatta', 'baner', 'kharadi', 'viman nagar', 'balewadi'];
  for (const loc of allLocs) {
    if (loc !== l.locality && desc.includes(loc)) {
      return true;
    }
  }
  return false;
});
console.log(`\nLocality mismatches (desc vs field): ${localityMismatch.length}`);
localityMismatch.slice(0, 20).forEach(l => {
  console.log(`  ${l.listing_id}: locality=${l.locality}, desc="${l.description.slice(0, 100)}"`);
});

// ========== Q10: projects_with_wrong_listing_count ==========
console.log('\n========== Q10: PROJECTS WITH WRONG LISTING COUNT ==========');
const projectListingMap = {};
for (const l of listings) {
  if (l.project_id) {
    projectListingMap[l.project_id] = (projectListingMap[l.project_id] || 0) + 1;
  }
}

let wrongCount = 0;
const wrongProjects = [];
for (const p of projects) {
  const actual = projectListingMap[p.project_id] || 0;
  if (actual !== p.total_listings) {
    wrongCount++;
    wrongProjects.push({ id: p.project_id, reported: p.total_listings, actual, name: p.apartment_name });
  }
}
console.log(`Wrong: ${wrongCount} out of ${projects.length}`);
console.log('Wrong projects:');
wrongProjects.slice(0, 30).forEach(p => console.log(`  ${p.id}: reported=${p.reported}, actual=${p.actual} (${p.name})`));
console.log(`>>> Q10: ${wrongCount}`);

// ========== Q6: avg_price_per_sqft_2bhk ==========
console.log('\n========== Q6: AVG PRICE PER SQFT 2BHK ==========');
// Eligible: is_live=true, bedroom=2, NOT corrupt, NOT fake
// For now compute without fake exclusion (will update later)
const eligible = listings.filter(l =>
  l.is_live === true &&
  l.bedroom === 2 &&
  !corruptIds.includes(l.listing_id) &&
  l.price > 0 &&
  l.carpet_area > 0
);
console.log(`Eligible 2BHK (live, not corrupt, positive price & area): ${eligible.length}`);

const ppsfValues = eligible.map(l => l.price / l.carpet_area);
const avgPpsf = ppsfValues.reduce((a, b) => a + b, 0) / ppsfValues.length;
console.log(`Avg price per sqft: ${avgPpsf.toFixed(2)}`);

// Show distribution
ppsfValues.sort((a, b) => a - b);
console.log(`PPSF range: ${ppsfValues[0]?.toFixed(2)} - ${ppsfValues[ppsfValues.length - 1]?.toFixed(2)}`);
console.log(`PPSF median: ${ppsfValues[Math.floor(ppsfValues.length / 2)]?.toFixed(2)}`);

console.log(`>>> Q6 (preliminary, excl corrupt only): ${avgPpsf.toFixed(2)}`);

// ========== SUMMARY ==========
console.log('\n\n========================================');
console.log('           FINAL ANSWERS');
console.log('========================================');
console.log(`Q1  total_listing_records:            ${listings.length}`);
console.log(`Q2  unique_properties:                ${uniqueProperties}`);
console.log(`Q3  active_listings:                  ${liveTrue}`);
console.log(`Q4  corrupt_listing_ids:              [${corruptIds.join(', ')}] (${corruptIds.length})`);
console.log(`Q5  total_monthly_rent:               ${totalRent}`);
console.log(`Q6  avg_price_per_sqft_2bhk:          ${avgPpsf.toFixed(2)}`);
console.log(`Q7  costliest_project:                ${costliest.project_id} = ${costliest.price_max} (raw)`);
console.log(`Q8  listings_last_7_days:             ${countIST}`);
console.log(`Q9  fake_listing_ids:                 [${fakeIds.join(', ')}] (${fakeIds.length})`);
console.log(`Q10 projects_with_wrong_listing_count: ${wrongCount}`);

// Save analysis output for frontend consumption
const output = {
  timestamp: new Date().toISOString(),
  q1: { total_listing_records: listings.length, api_reported: metadata.listings.reported_total },
  q2: { unique_properties: uniqueProperties, method: 'locality+apartment_name+carpet_area+floor' },
  q3: { active_listings: liveTrue, inactive: liveFalse },
  q4: { corrupt_listing_ids: corruptIds, details: corrupt },
  q5: { total_monthly_rent: totalRent, locality: ASSIGNED_LOCALITY, rental_count: balewadiRentals.length },
  q6: { avg_price_per_sqft_2bhk: parseFloat(avgPpsf.toFixed(2)), eligible_count: eligible.length },
  q7: { costliest_project: { project_id: costliest.project_id, price_max_raw: costliest.price_max, apartment_name: costliest.apartment_name } },
  q8: { listings_last_7_days: countIST },
  q9: { fake_listing_ids: fakeIds, status: 'completed' },
  q10: { projects_with_wrong_listing_count: wrongCount, total_projects: projects.length, wrong_projects: wrongProjects },
  stats: {
    total_listings: listings.length,
    total_rentals: rentals.length,
    total_projects: projects.length,
    websites: websiteStats,
    posted_by: postedByStats,
    verified: verifiedCounts,
    price_range: { min: prices[0], max: prices[prices.length - 1] },
    localities: metadata.localities,
  }
};
writeFileSync(join(DATA_DIR, 'analysis-output.json'), JSON.stringify(output, null, 2));
console.log('\nAnalysis output saved to data/analysis-output.json');
