/**
 * Deep investigation: Fake listings, corrupt records, property units
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

const listings = JSON.parse(readFileSync(join(DATA_DIR, 'listings.json'), 'utf-8'));
const rentals = JSON.parse(readFileSync(join(DATA_DIR, 'rentals.json'), 'utf-8'));
const projects = JSON.parse(readFileSync(join(DATA_DIR, 'projects.json'), 'utf-8'));

// ============================================================
// CORRUPT LISTINGS — detailed analysis
// ============================================================
console.log('=== CORRUPT LISTINGS DEEP DIVE ===');
const corrupt = [];
for (const l of listings) {
  const reasons = [];
  if (l.price < 0) reasons.push(`negative_price=${l.price}`);
  if (l.carpet_area < 0) reasons.push(`negative_carpet=${l.carpet_area}`);
  if (l.super_built_up_area < 0) reasons.push(`negative_sba=${l.super_built_up_area}`);
  if (l.floor > l.total_floors && l.total_floors > 0) reasons.push(`floor(${l.floor})>total_floors(${l.total_floors})`);
  if (l.bedroom < 0) reasons.push(`negative_bed=${l.bedroom}`);
  if (l.bathroom < 0) reasons.push(`negative_bath=${l.bathroom}`);
  if (l.carpet_area > 0 && l.super_built_up_area > 0 && l.carpet_area > l.super_built_up_area) {
    reasons.push(`carpet(${l.carpet_area})>sba(${l.super_built_up_area})`);
  }
  if (reasons.length > 0) corrupt.push({ id: l.listing_id, reasons, l });
}
console.log(`Total corrupt: ${corrupt.length}\n`);
corrupt.forEach(c => {
  const l = c.l;
  console.log(`${c.id}: ${c.reasons.join(', ')}`);
  console.log(`  price=${l.price} carpet=${l.carpet_area} sba=${l.super_built_up_area} floor=${l.floor}/${l.total_floors} bed=${l.bedroom} bath=${l.bathroom} loc=${l.locality} type=${l.property_type} live=${l.is_live}`);
});
console.log(`\nCorrupt IDs sorted: [${corrupt.map(c => c.id).sort().join(', ')}]`);

// ============================================================
// PROJECT PRICE UNITS — Cross-reference
// ============================================================
console.log('\n\n=== PROJECT PRICE UNIT ANALYSIS ===');

// Find projects that have listings - cross-reference to determine unit
const projectsWithListings = [];
for (const p of projects) {
  const pListings = listings.filter(l => l.project_id === p.project_id);
  if (pListings.length > 0) {
    projectsWithListings.push({ project: p, listings: pListings });
  }
}

console.log(`Projects with listings: ${projectsWithListings.length}`);
console.log('\nCross-referencing prices:');
projectsWithListings.slice(0, 20).forEach(({ project: p, listings: ls }) => {
  const listingPrices = ls.map(l => l.price).sort((a, b) => a - b);
  const listMin = listingPrices[0];
  const listMax = listingPrices[listingPrices.length - 1];
  
  // Test: if project price is in lakhs
  const projMinLakhs = p.price_min * 100000;
  const projMaxLakhs = p.price_max * 100000;
  
  // Test: if project price is in crores
  const projMinCrores = p.price_min * 10000000;
  const projMaxCrores = p.price_max * 10000000;
  
  console.log(`\n  ${p.project_id} (${p.apartment_name}):`);
  console.log(`    Project: min=${p.price_min}, max=${p.price_max}`);
  console.log(`    Listing range: ${listMin} - ${listMax} (${ls.length} listings)`);
  console.log(`    If lakhs: proj=${projMinLakhs}-${projMaxLakhs}, match=${listMin >= projMinLakhs*0.7 && listMax <= projMaxLakhs*1.3 ? 'YES' : 'no'}`);
  console.log(`    If crores: proj=${projMinCrores}-${projMaxCrores}, match=${listMin >= projMinCrores*0.7 ? 'maybe' : 'no'}`);
});

// Also check: projects where price_min > price_max
const invertedPrices = projects.filter(p => p.price_min > p.price_max);
console.log(`\nProjects with price_min > price_max: ${invertedPrices.length}`);
invertedPrices.slice(0, 10).forEach(p => {
  console.log(`  ${p.project_id}: min=${p.price_min}, max=${p.price_max}, name=${p.apartment_name}`);
});

// ============================================================
// FAKE LISTINGS — Deeper investigation
// ============================================================
console.log('\n\n=== FAKE LISTINGS DEEP DIVE ===');

// Hypothesis A: Unverified listings are fake
const unverified = listings.filter(l => !l.is_verified);
console.log(`Unverified: ${unverified.length} out of ${listings.length}`);

// Hypothesis B: Look for phone numbers shared across too many listings
const phoneMap = {};
for (const l of listings) {
  if (!phoneMap[l.posted_by_contact]) phoneMap[l.posted_by_contact] = [];
  phoneMap[l.posted_by_contact].push(l);
}
const topPhones = Object.entries(phoneMap).sort((a, b) => b[1].length - a[1].length);
console.log('\nPhones with most listings (top 30):');
topPhones.slice(0, 30).forEach(([phone, ls]) => {
  const names = [...new Set(ls.map(l => l.posted_by_name))];
  const locs = [...new Set(ls.map(l => l.locality))];
  const types = [...new Set(ls.map(l => l.posted_by))];
  const verified = ls.filter(l => l.is_verified).length;
  console.log(`  ${phone}: ${ls.length} listings (${verified} verified) | names=[${names}] | locs=[${locs.join(',')}] | type=[${types}]`);
});

// Hypothesis C: Look at the relationship between phone frequency and is_verified
const phoneVerifiedCorrelation = topPhones.map(([phone, ls]) => ({
  phone,
  count: ls.length,
  verified: ls.filter(l => l.is_verified).length,
  unverified: ls.filter(l => !l.is_verified).length,
}));
console.log('\nPhone verified correlation (phones with >= 5 listings):');
phoneVerifiedCorrelation.filter(p => p.count >= 5).forEach(p => {
  console.log(`  ${p.phone}: ${p.count} listings, ${p.verified} verified, ${p.unverified} unverified`);
});

// Hypothesis D: Look for patterns in listing_id format
const idPrefixes = {};
for (const l of listings) {
  const prefix = l.listing_id.split('-')[0];
  if (!idPrefixes[prefix]) idPrefixes[prefix] = { count: 0, verified: 0, live: 0 };
  idPrefixes[prefix].count++;
  if (l.is_verified) idPrefixes[prefix].verified++;
  if (l.is_live) idPrefixes[prefix].live++;
}
console.log('\nListing ID prefix analysis:');
Object.entries(idPrefixes).forEach(([prefix, stats]) => {
  console.log(`  ${prefix}: ${stats.count} (verified: ${stats.verified}, live: ${stats.live})`);
});

// Hypothesis E: Look for listings with the same posted_by_name across very different localities
const nameLocMap = {};
for (const l of listings) {
  if (!nameLocMap[l.posted_by_name]) nameLocMap[l.posted_by_name] = new Set();
  nameLocMap[l.posted_by_name].add(l.locality);
}
const nameMultiLoc = Object.entries(nameLocMap)
  .filter(([, locs]) => locs.size >= 5)
  .sort((a, b) => b[1].size - a[1].size);
console.log('\nNames appearing in 5+ localities:');
nameMultiLoc.forEach(([name, locs]) => {
  const allListings = listings.filter(l => l.posted_by_name === name);
  const phones = [...new Set(allListings.map(l => l.posted_by_contact))];
  console.log(`  ${name}: ${locs.size} localities (${allListings.length} listings, phones: ${phones.length})`);
});

// Hypothesis F: Same phone, different names = suspicious
const phoneNames = {};
for (const l of listings) {
  if (!phoneNames[l.posted_by_contact]) phoneNames[l.posted_by_contact] = new Set();
  phoneNames[l.posted_by_contact].add(l.posted_by_name);
}
const phoneMultiName = Object.entries(phoneNames).filter(([, names]) => names.size > 1);
console.log(`\nPhones with multiple names: ${phoneMultiName.length}`);
phoneMultiName.slice(0, 20).forEach(([phone, names]) => {
  console.log(`  ${phone}: [${[...names].join(', ')}]`);
});

// Hypothesis G: Same name, same phone, but different posted_by type (owner vs agent vs builder)
const namePhoneTypeMap = {};
for (const l of listings) {
  const key = `${l.posted_by_name}|${l.posted_by_contact}`;
  if (!namePhoneTypeMap[key]) namePhoneTypeMap[key] = new Set();
  namePhoneTypeMap[key].add(l.posted_by);
}
const multiType = Object.entries(namePhoneTypeMap).filter(([, types]) => types.size > 1);
console.log(`\nSame name+phone but different posted_by type: ${multiType.length}`);
multiType.forEach(([key, types]) => {
  console.log(`  ${key}: [${[...types].join(', ')}]`);
});

// Hypothesis H: Look for patterns in posted_at — are fake listings concentrated in time?
const liveListings = listings.filter(l => l.is_live);
const deadListings = listings.filter(l => !l.is_live);
console.log(`\nLive listings: ${liveListings.length}, Dead: ${deadListings.length}`);

// Hypothesis I: Price outliers — fake listings might have abnormally low prices
const priceByLoc = {};
for (const l of listings) {
  if (!priceByLoc[l.locality]) priceByLoc[l.locality] = [];
  priceByLoc[l.locality].push(l.price);
}
console.log('\nPrice stats by locality:');
for (const [loc, prices] of Object.entries(priceByLoc)) {
  prices.sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  const p5 = prices[Math.floor(prices.length * 0.05)];
  const p95 = prices[Math.floor(prices.length * 0.95)];
  console.log(`  ${loc}: n=${prices.length}, p5=${p5}, median=${median}, p95=${p95}`);
}

// Hypothesis J: Look for listings where the price is way below locality median (> 2 stddev)
const localityStats = {};
for (const [loc, prices] of Object.entries(priceByLoc)) {
  const positivePrices = prices.filter(p => p > 0);
  const mean = positivePrices.reduce((a, b) => a + b, 0) / positivePrices.length;
  const stddev = Math.sqrt(positivePrices.reduce((s, p) => s + (p - mean) ** 2, 0) / positivePrices.length);
  localityStats[loc] = { mean, stddev };
}

const priceOutliers = listings.filter(l => {
  if (l.price <= 0) return false;
  const stats = localityStats[l.locality];
  if (!stats) return false;
  return l.price < stats.mean - 2 * stats.stddev;
});
console.log(`\nPrice outliers (> 2 stddev below locality mean): ${priceOutliers.length}`);
priceOutliers.slice(0, 20).forEach(l => {
  const stats = localityStats[l.locality];
  console.log(`  ${l.listing_id}: price=${l.price}, loc=${l.locality}, mean=${Math.round(stats.mean)}, stddev=${Math.round(stats.stddev)}, z=${((l.price - stats.mean) / stats.stddev).toFixed(1)}`);
});

// Hypothesis K: Check if there's a specific "website" that tends to have suspicious listings
console.log('\nUnverified rate by website:');
const webUnverified = {};
for (const l of listings) {
  if (!webUnverified[l.website]) webUnverified[l.website] = { total: 0, unverified: 0 };
  webUnverified[l.website].total++;
  if (!l.is_verified) webUnverified[l.website].unverified++;
}
for (const [w, s] of Object.entries(webUnverified)) {
  console.log(`  ${w}: ${s.unverified}/${s.total} = ${(s.unverified / s.total * 100).toFixed(1)}% unverified`);
}

// ============================================================
// Q2: PROPERTY IDENTITY — Detailed analysis
// ============================================================
console.log('\n\n=== Q2: PROPERTY IDENTITY DEEP DIVE ===');
// With 3800 unique listing_ids and checking all identity combos
// If all 3800 have unique lat+lng+floor+bed+carpet, then there are 3800 unique properties

// But let's also check for near-duplicate coordinates
const coords = listings.map(l => ({ id: l.listing_id, lat: l.latitude, lng: l.longitude }));
const nearDupes = [];
for (let i = 0; i < coords.length; i++) {
  for (let j = i + 1; j < Math.min(i + 100, coords.length); j++) { // check nearby in array
    const dist = Math.sqrt((coords[i].lat - coords[j].lat) ** 2 + (coords[i].lng - coords[j].lng) ** 2);
    if (dist < 0.0001 && dist > 0) { // very close but not exact
      nearDupes.push({ id1: coords[i].id, id2: coords[j].id, dist });
    }
  }
}
console.log(`Near-duplicate coordinates (< 0.0001 deg): ${nearDupes.length}`);
nearDupes.slice(0, 10).forEach(d => console.log(`  ${d.id1} <-> ${d.id2}: dist=${d.dist.toFixed(6)}`));

// Check exact coordinate matches
const exactCoordMap = {};
for (const l of listings) {
  const key = `${l.latitude}|${l.longitude}`;
  if (!exactCoordMap[key]) exactCoordMap[key] = [];
  exactCoordMap[key].push(l);
}
const exactDupes = Object.entries(exactCoordMap).filter(([, g]) => g.length > 1);
console.log(`\nExact coordinate duplicates: ${exactDupes.length} groups`);
exactDupes.slice(0, 10).forEach(([key, group]) => {
  console.log(`  ${key}: ${group.length} listings`);
  group.forEach(l => {
    console.log(`    ${l.listing_id} | ${l.apartment_name} | bed=${l.bedroom} | floor=${l.floor} | carpet=${l.carpet_area} | price=${l.price} | web=${l.website}`);
  });
});

// These same-coord listings could be:
// 1. Same property listed on different websites (duplicates)
// 2. Different units in the same building (different floor/BHK)
// We need to differentiate

// For groups with same coords, check if they also share floor+bedroom+carpet_area
let trueDupes = 0;
let sameBuilding = 0;
for (const [, group] of exactDupes) {
  // Sub-group by floor+bed+carpet
  const subGroups = {};
  for (const l of group) {
    const subKey = `${l.floor}|${l.bedroom}|${l.carpet_area}`;
    if (!subGroups[subKey]) subGroups[subKey] = [];
    subGroups[subKey].push(l);
  }
  for (const [, sg] of Object.entries(subGroups)) {
    if (sg.length > 1) trueDupes++;
  }
  sameBuilding += Object.keys(subGroups).length;
}
console.log(`\nTrue duplicates (same coords + floor + bed + carpet): ${trueDupes} groups`);
console.log(`Same building but different units: need manual check`);

console.log('\n=== INVESTIGATION COMPLETE ===');
