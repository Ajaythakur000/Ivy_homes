/**
 * Focused investigation: project price units
 * The question is: are project prices in lakhs, crores, or something else?
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

const listings = JSON.parse(readFileSync(join(DATA_DIR, 'listings.json'), 'utf-8'));
const projects = JSON.parse(readFileSync(join(DATA_DIR, 'projects.json'), 'utf-8'));

// Build project→listings map
const projListings = {};
for (const l of listings) {
  if (l.project_id && l.price > 0) {
    if (!projListings[l.project_id]) projListings[l.project_id] = [];
    projListings[l.project_id].push(l);
  }
}

console.log('=== PROJECT PRICE UNIT ANALYSIS ===\n');
console.log('For each project with listings, compare project prices vs listing price range.\n');

const analysis = [];

for (const p of projects) {
  const ls = projListings[p.project_id];
  if (!ls || ls.length === 0) continue;
  
  const listPrices = ls.map(l => l.price).sort((a, b) => a - b);
  const listMin = listPrices[0];
  const listMax = listPrices[listPrices.length - 1];
  
  // For each project, determine which unit makes price_min and price_max bracket the listings
  // Hypothesis 1: price_min in lakhs, price_max in crores
  const h1_min = p.price_min * 100000;
  const h1_max = p.price_max * 10000000;
  const h1_fits = listMin >= h1_min * 0.7 && listMax <= h1_max * 1.3;
  
  // Hypothesis 2: both in lakhs
  const h2_min = p.price_min * 100000;
  const h2_max = p.price_max * 100000;
  const h2_fits = h2_min <= h2_max && listMin >= h2_min * 0.7 && listMax <= h2_max * 1.3;
  
  // Hypothesis 3: both in crores
  const h3_min = p.price_min * 10000000;
  const h3_max = p.price_max * 10000000;
  const h3_fits = h3_min <= h3_max && listMin >= h3_min * 0.7 && listMax <= h3_max * 1.3;
  
  // Hypothesis 4: price_min in lakhs, price_max in lakhs but labels might be SWAPPED
  // (some projects have price_min > price_max when both in same unit)
  const swapped = p.price_min > p.price_max;
  const actualMin = Math.min(p.price_min, p.price_max);
  const actualMax = Math.max(p.price_min, p.price_max);
  const h4_min = actualMin * 100000;
  const h4_max = actualMax * 100000;
  const h4_fits = listMin >= h4_min * 0.5 && listMax <= h4_max * 1.5;
  
  analysis.push({
    id: p.project_id,
    name: p.apartment_name,
    price_min: p.price_min,
    price_max: p.price_max,
    listing_range: `${listMin}-${listMax}`,
    listing_count: ls.length,
    swapped,
    h1_fits, h2_fits, h3_fits, h4_fits,
  });
  
  console.log(`${p.project_id} (${p.apartment_name}):`);
  console.log(`  Raw: min=${p.price_min}, max=${p.price_max}${swapped ? ' [SWAPPED min>max]' : ''}`);
  console.log(`  Listings: ${listMin} - ${listMax} (${ls.length})`);
  console.log(`  H1(min=lakhs,max=crores): ${h1_fits ? '✓' : '✗'} | min=${h1_min}, max=${h1_max}`);
  console.log(`  H2(both lakhs): ${h2_fits ? '✓' : '✗'} | min=${h2_min}, max=${h2_max}`);
  console.log(`  H3(both crores): ${h3_fits ? '✓' : '✗'} | min=${h3_min}, max=${h3_max}`);
  console.log(`  H4(lakhs, corrected order): ${h4_fits ? '✓' : '✗'} | min=${h4_min}, max=${h4_max}`);
  console.log();
}

console.log('\n=== HYPOTHESIS SUMMARY ===');
console.log(`H1 (min=lakhs, max=crores): ${analysis.filter(a => a.h1_fits).length}/${analysis.length} match`);
console.log(`H2 (both lakhs): ${analysis.filter(a => a.h2_fits).length}/${analysis.length} match`);
console.log(`H3 (both crores): ${analysis.filter(a => a.h3_fits).length}/${analysis.length} match`);
console.log(`H4 (lakhs, corrected order): ${analysis.filter(a => a.h4_fits).length}/${analysis.length} match`);
console.log(`Swapped min>max: ${analysis.filter(a => a.swapped).length}/${analysis.length}`);

// Most likely: prices are in LAKHS. The assignment asks for price_max_inr.
// Let's determine the costliest project
console.log('\n=== COSTLIEST PROJECT ===');
// If price_max is in lakhs: multiply by 100000
// If some have swapped min/max, take max(price_min, price_max)
const withInr = projects.map(p => ({
  ...p,
  effective_max_lakhs: Math.max(p.price_min, p.price_max),
  effective_max_inr: Math.max(p.price_min, p.price_max) * 100000,
}));
withInr.sort((a, b) => b.effective_max_lakhs - a.effective_max_lakhs);

console.log('Top 10 by effective_max (lakhs):');
withInr.slice(0, 10).forEach(p => {
  console.log(`  ${p.project_id}: max(min,max)=${p.effective_max_lakhs}L = ₹${p.effective_max_inr} (${p.apartment_name})`);
  console.log(`    raw: min=${p.price_min}, max=${p.price_max}`);
});

// Also check: the assignment says "highest maximum price"
// If we just take price_max as-is (ignoring that min/max might be swapped)
const byPriceMax = [...projects].sort((a, b) => b.price_max - a.price_max);
console.log('\nTop 10 by raw price_max:');
byPriceMax.slice(0, 10).forEach(p => {
  console.log(`  ${p.project_id}: price_max=${p.price_max} (${p.apartment_name})`);
});

// Also try: maybe the highest price_max in lakhs/crores
const byPriceMin = [...projects].sort((a, b) => b.price_min - a.price_min);
console.log('\nTop 10 by raw price_min:');
byPriceMin.slice(0, 10).forEach(p => {
  console.log(`  ${p.project_id}: price_min=${p.price_min} (${p.apartment_name})`);
});
