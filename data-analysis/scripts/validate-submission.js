import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SUBMISSION_PATH = path.join(__dirname, '../../submission.json');

const ALLOWED_CATEGORIES = new Set([
  'auth', 'pagination', 'units', 'filters', 'sorting', 'timestamps', 
  'duplicates', 'completeness', 'data_quality', 'fraud', 'consistency', 
  'missing_endpoint', 'undocumented_endpoint'
]);

function validate() {
  if (!fs.existsSync(SUBMISSION_PATH)) {
    console.error('ERROR: submission.json not found at ' + SUBMISSION_PATH);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(SUBMISSION_PATH, 'utf8'));
  } catch (err) {
    console.error('ERROR: submission.json is not valid JSON');
    process.exit(1);
  }

  const { answers, findings, candidate } = data;
  
  let errors = 0;

  if (!candidate || !candidate.demo_url || candidate.demo_url.trim() === '') {
    console.error('ERROR: candidate.demo_url is missing or empty');
    errors++;
  }

  if (!answers) {
    console.error('ERROR: Missing answers object');
    process.exit(1);
  }

  const requiredFields = [
    'total_listing_records', 'unique_properties', 'active_listings', 
    'total_monthly_rent', 'avg_price_per_sqft_2bhk', 'listings_last_7_days', 
    'projects_with_wrong_listing_count'
  ];

  requiredFields.forEach(f => {
    if (answers[f] === undefined) {
      console.error('ERROR: answers.' + f + ' is missing');
      errors++;
    }
  });

  if (!Array.isArray(answers.corrupt_listing_ids)) {
    console.error('ERROR: answers.corrupt_listing_ids must be an array');
    errors++;
  }

  if (!Array.isArray(answers.fake_listing_ids)) {
    console.error('ERROR: answers.fake_listing_ids must be an array');
    errors++;
  }

  if (!answers.costliest_project || !answers.costliest_project.project_id || answers.costliest_project.price_max_inr === undefined) {
    console.error('ERROR: answers.costliest_project is missing or malformed');
    errors++;
  }

  if (!Array.isArray(findings)) {
    console.error('ERROR: findings must be an array');
    errors++;
  } else {
    findings.forEach((f, i) => {
      if (!ALLOWED_CATEGORIES.has(f.category)) {
        console.error('ERROR: finding[' + i + '] has invalid category ' + f.category);
        errors++;
      }
    });
  }

  if (errors > 0) {
    console.error('Validation FAILED with ' + errors + ' errors.');
    process.exit(1);
  }

  console.log('? Validation PASSED! submission.json is ready.');
}

validate();
