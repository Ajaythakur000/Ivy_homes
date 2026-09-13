# Ivy Homes — Property Intelligence Platform

**Candidate:** Ajay Thakur  
**Email:** ajay.20233033@mnnit.ac.in  
**City:** Pune | **Locality:** Balewadi  
**Reference Date:** 2026-09-10T00:00:00+05:30
**Live Demo:** [https://ivyhomes-tau.vercel.app/](https://ivyhomes-tau.vercel.app/)

---

## 🏗️ Project Overview

A Next.js-based property intelligence platform that consumes the Ivy Homes API, displays sale and rental listings, projects data, and provides data-driven insights based on comprehensive API investigation.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd Ivy_homes

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Install & run data analysis
cd data-analysis
npm install
node --env-file=../.env scripts/fetch-all.js
node scripts/final-answers.js

# Install & run frontend
cd ../frontend
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
IVY_API_KEY=your-api-key
IVY_BASE_URL=https://solve.ivy.homes
IVY_DEMO_PASSWORD=your-password
IVY_CITY=pune
IVY_ASSIGNED_LOCALITY=balewadi
```

## 📁 Project Structure

```
Ivy_homes/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   │   ├── explore/  # Browse listings with filters
│   │   │   ├── listing/  # Listing detail
│   │   │   ├── rent/     # Rental listings
│   │   │   ├── rental/   # Rental detail
│   │   │   ├── projects/ # Projects listing
│   │   │   ├── project/  # Project detail
│   │   │   ├── favourites/ # Saved listings
│   │   │   ├── insights/ # Data intelligence dashboard
│   │   │   └── login/    # Authentication
│   │   ├── components/   # Shared UI components
│   │   └── lib/          # API client, utilities
│   └── public/
│       └── analysis-data.json  # Computed insights data
├── data-analysis/         # Node.js analysis scripts
│   └── scripts/
│       ├── investigate-api.js       # API behavior investigation
│       ├── investigate-pagination.js # Pagination deep-dive
│       ├── investigate-project-prices.js # Price unit analysis
│       ├── fetch-all.js             # Data collection (offset-based)
│       ├── analyze.js               # Q1-Q10 analysis
│       ├── deep-investigate.js      # Fake listing detection
│       ├── final-answers.js         # Final answer compilation
│       └── costliest-project.js     # Project price unit resolution
├── data/                  # Raw API data (gitignored)
├── submission.json        # Assignment submission
└── README.md
```

## 🔍 Methodology

### Phase 1: API Investigation

**Goal:** Determine how the API actually works vs. what the documentation claims.

1. **Auth discovery:** Sent API key as query param per docs → got explicit error message directing to `X-API-Key` header.
2. **Login probing:** Called POST /auth/login, discovered response has `access_token` (not `token`), expires in 900s (not 86400).
3. **Pagination analysis:** Noticed `page=2` returned same data as `page=1`. Tried `offset` parameter → worked correctly. Confirmed page param is silently ignored.
4. **Endpoint validation:** Systematically tested all documented endpoints with both singular/plural paths. Found `/v1/listing/{id}` → 404, `/v1/listings/{id}` → 200.
5. **Filter testing:** Applied each filter independently, compared total counts. Found min_price, max_price, furnishing have zero effect.
6. **Endpoint discovery:** Probed 20+ potential undocumented paths. Found `/v1/saved` (favourites) and `/v1/localities`.
7. **Schema comparison:** Compared listing vs rental JSON schemas side-by-side. Found field name inconsistency (`super_built_up_area` vs `super_builtup_area`).

### Phase 2: Data Collection

Used **offset-based pagination** (the correct method) with `limit=50` to fetch all records:
- Listings: 3800 unique records (API reports 3684)
- Rentals: 1450 unique records (API reports 1406) 
- Projects: 440 unique records (API reports 427)

### Phase 3: Data Analysis

**Q1 (Total Records):** 3800 — paginated until `has_more=false`.

**Q2 (Unique Properties):** 2664 — deduplicated using identity: locality + apartment_name + carpet_area + floor.

**Q3 (Active Listings):** 2998 — filtered `is_live === true`.

**Q4 (Corrupt Listings):** 21 records with structural data violations:
- Negative prices (e.g., -15,890,000)
- Carpet area > super built-up area
- Floor number > total building floors
- Negative bedroom/bathroom/area counts

**Q5 (Total Monthly Rent):** ₹51,84,200 — sum of `price` for all Balewadi rentals.

**Q6 (Avg Price/sqft 2BHK):** ₹18,314.23 — computed as mean of (price/carpet_area) for eligible 2BHK listings (is_live=true, not corrupt, not fake, positive price & area).

**Q7 (Costliest Project):** P30198 (₹3,83,00,000). To normalize mixed project price units (Lakhs vs Crores), the script infers the correct unit by comparing the project's advertised price_max against the absolute highest live individual listing price for that project.

**Q8 (Last 7 Days):** 128 — posted_at between 2026-09-03 and 2026-09-10 IST.

**Q9 (Fake Listings):** 0 listings dynamically identified as fake (spam) by flagging properties where exact duplicated descriptions are posted across completely distinct property names/localities, indicating spam.

**Q10 (Wrong Listing Count):** 317 out of 440 projects — project's `total_listings` doesn't match actual count of listings with that `project_id`.

### Hypotheses Tested (Including False Ones)

| Hypothesis | Result | Detail |
|------------|--------|--------|
| API key goes in query param | ❌ **FALSE** | Must use X-API-Key header |
| Page-based pagination works | ❌ **FALSE** | Only offset-based works |
| Token field is "token" | ❌ **FALSE** | Field is "access_token" |
| Token lasts 24 hours | ❌ **FALSE** | Expires in 15 minutes |
| Limit can go up to 200 | ❌ **FALSE** | Max effective limit is 50 |
| Similar listings endpoint exists | ❌ **FALSE** | Returns 404 |
| /v1/favourites is the saved endpoint | ❌ **FALSE** | It's /v1/saved |
| /v1/analytics/summary exists | ❌ **FALSE** | Returns 404 |
| min_price/max_price filters work | ❌ **FALSE** | Silently ignored |
| furnishing filter works | ❌ **FALSE** | Silently ignored |
| Total count in response is accurate | ❌ **FALSE** | Undercounts by ~3% |
| All timestamps are UTC with Z suffix | ❌ **FALSE** | Mixed: server IST, listings no tz, rentals Z |
| Listings share field names with rentals | ❌ **FALSE** | super_built_up_area vs super_builtup_area |
| Project prices are all in same unit | ❌ **FALSE** | Mixed lakhs/crores |
| Duplicate listings exist at same coords | ❌ **FALSE** | Same-coord listings are different units |
| Unverified = fake | ❌ **FALSE** | 38.5% overall are unverified, uniform across websites |
| Phone reuse indicates fraud | ❌ **FALSE** | Each phone appears max ~10 times (normal for agents) |
| /v1/localities is documented | ❌ **FALSE** | Undocumented but functional |

## 📊 Key Findings Summary

1. **15 documentation discrepancies** identified and documented with evidence
2. **Auth is completely wrong** in docs (header vs query param, field name, expiry)
3. **Pagination is fundamentally different** (offset vs page-based)
4. **3 endpoints missing**, 1 undocumented endpoint discovered
5. **3 filters silently broken** (appear to work but have no effect)
6. **Data quality issues**: 28 corrupt + 4 fake listings, mixed price units in projects

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Analysis:** Node.js, vanilla JavaScript
- **Design:** Warm neutral palette (#F7F6F2), Geist font, editorial aesthetic
- **Authentication:** Bearer token with 15-min refresh cycle

## 📝 License

Assignment submission for Ivy Homes Software Engineering Internship.
