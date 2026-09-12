/**
 * Determine costliest project by converting all price_max to INR
 * Hypothesis: price_max > 10 → lakhs, price_max <= 10 → crores
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const projects = JSON.parse(readFileSync(join(DATA_DIR, 'projects.json'), 'utf-8'));
const listings = JSON.parse(readFileSync(join(DATA_DIR, 'listings.json'), 'utf-8'));

// Build project→listings map for validation
const projListings = {};
for (const l of listings) {
  if (l.project_id && l.price > 0) {
    if (!projListings[l.project_id]) projListings[l.project_id] = [];
    projListings[l.project_id].push(l);
  }
}

function toInr(val) {
  if (val > 10) return val * 100000; // lakhs
  return val * 10000000; // crores
}

const withInr = projects.map(p => ({
  project_id: p.project_id,
  name: p.apartment_name,
  price_max_raw: p.price_max,
  price_min_raw: p.price_min,
  price_max_inr: toInr(p.price_max),
  price_min_inr: toInr(p.price_min),
  listing_count: (projListings[p.project_id] || []).length,
}));

withInr.sort((a, b) => b.price_max_inr - a.price_max_inr);

console.log('Top 20 by price_max_inr:');
withInr.slice(0, 20).forEach(p => {
  const ls = projListings[p.project_id] || [];
  const maxListingPrice = ls.length > 0 ? Math.max(...ls.map(l => l.price)) : 'N/A';
  console.log(`  ${p.project_id}: raw_max=${p.price_max_raw} → ₹${p.price_max_inr.toLocaleString()}, listings=${p.listing_count}, max_listing_price=${typeof maxListingPrice === 'number' ? maxListingPrice.toLocaleString() : maxListingPrice}`);
});

// Also just check: maybe all prices are in lakhs regardless of value
console.log('\n\nIf ALL prices are in LAKHS:');
const allLakhs = projects.map(p => ({
  ...p,
  max_inr: p.price_max * 100000,
})).sort((a, b) => b.max_inr - a.max_inr);
allLakhs.slice(0, 10).forEach(p => {
  console.log(`  ${p.project_id}: ${p.price_max}L = ₹${p.max_inr.toLocaleString()} (${p.apartment_name})`);
});

// And if ALL in crores
console.log('\nIf ALL prices are in CRORES:');
const allCrores = projects.map(p => ({
  ...p,
  max_inr: p.price_max * 10000000,
})).sort((a, b) => b.max_inr - a.max_inr);
allCrores.slice(0, 10).forEach(p => {
  console.log(`  ${p.project_id}: ${p.price_max}Cr = ₹${p.max_inr.toLocaleString()} (${p.apartment_name})`);
});

// The safest interpretation: take price_max at face value
// Given that listing prices are 3M-25M (30L-250L), and project price_max ranges from 1.2 to 99.9:
// - 99.9 as lakhs = 99.9L = ₹99,90,000 ≈ ₹1Cr (reasonable for a project)
// - 3.22 as crores = ₹3.22Cr = ₹3,22,00,000 (also reasonable)
// - 99.9 as crores = ₹99.9Cr = ₹99,90,00,000 (not reasonable for Pune apartments)
//
// CONCLUSION: ALL price_max values are in LAKHS.
// When price_min > price_max (e.g. min=80, max=3.22), price_min is in LAKHS
// and price_max is in CRORES — MIXED UNITS! This is a documentation discrepancy.
//
// For Q7: costliest = highest price_max converted to INR
// Since we don't know the unit for sure, let's go with lakhs for values > 10, crores for < 10

const costliest = withInr[0];
console.log(`\n\nFINAL ANSWER: ${costliest.project_id} (${costliest.name})`);
console.log(`  raw price_max: ${costliest.price_max_raw}`);
console.log(`  price_max_inr: ${costliest.price_max_inr}`);
