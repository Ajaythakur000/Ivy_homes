const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/explore/page.tsx', 'utf8');

// Add import
if (!code.includes('import CustomSelect')) {
  code = code.replace(/import Link from 'next\/link';/, "import Link from 'next/link';\nimport CustomSelect from '@/components/CustomSelect';");
}

// 1. Sort Order
code = code.replace(
  /<select[\s\S]*?value={sortBy \? `\$\{sortBy\}-\$\{sortOrder\}` : ''}[\s\S]*?onChange={e => \{[\s\S]*?const \[s, o\] = e\.target\.value\.split\('-');[\s\S]*?setSortBy\(s \|\| ''\); setSortOrder\(o \|\| 'desc'\);[\s\S]*?resetAndReload\(\);[\s\S]*?\}}[\s\S]*?className="[^"]*"[\s\S]*?>[\s\S]*?<option value="">Default Order<\/option>[\s\S]*?<option value="price-asc">Price: Low to High<\/option>[\s\S]*?<option value="price-desc">Price: High to Low<\/option>[\s\S]*?<option value="posted_at-desc\">Newest First<\/option>[\s\S]*?<option value="posted_at-asc">Oldest First<\/option>[\s\S]*?<\/select>/,
  `<CustomSelect 
              value={sortBy ? \`\${sortBy}-\${sortOrder}\` : ''} 
              onChange={val => {
                const [s, o] = val.split('-');
                setSortBy(s || ''); setSortOrder(o || 'desc');
                resetAndReload();
              }}
              options={[
                { value: '', label: 'Default Order' },
                { value: 'price-asc', label: 'Price: Low to High' },
                { value: 'price-desc', label: 'Price: High to Low' },
                { value: 'posted_at-desc', label: 'Newest First' },
                { value: 'posted_at-asc', label: 'Oldest First' }
              ]}
              className="w-48"
            />`
);

// 2. Locality
code = code.replace(
  /<select[\s\S]*?value={locality}[\s\S]*?onChange={e => \{ setLocality\(e\.target\.value\); resetAndReload\(\); \}}[\s\S]*?className="[^"]*"[\s\S]*?>[\s\S]*?<option value="">All Localities<\/option>[\s\S]*?<option value="hadapsar">Hadapsar<\/option>[\s\S]*?<option value="wakad">Wakad<\/option>[\s\S]*?<option value="hinjewadi">Hinjewadi<\/option>[\s\S]*?<option value="aundh">Aundh<\/option>[\s\S]*?<option value="kothrud">Kothrud<\/option>[\s\S]*?<option value="balewadi">Balewadi<\/option>[\s\S]*?<\/select>/,
  `<CustomSelect
            value={locality}
            onChange={val => { setLocality(val); resetAndReload(); }}
            options={[
              { value: '', label: 'All Localities' },
              { value: 'hadapsar', label: 'Hadapsar' },
              { value: 'wakad', label: 'Wakad' },
              { value: 'hinjewadi', label: 'Hinjewadi' },
              { value: 'aundh', label: 'Aundh' },
              { value: 'kothrud', label: 'Kothrud' },
              { value: 'balewadi', label: 'Balewadi' }
            ]}
          />`
);

// 3. BHK
code = code.replace(
  /<select[\s\S]*?value={bhk}[\s\S]*?onChange={e => \{ setBhk\(e\.target\.value\); resetAndReload\(\); \}}[\s\S]*?className="[^"]*"[\s\S]*?>[\s\S]*?<option value="">All BHK<\/option>[\s\S]*?<option value="1">1 BHK<\/option>[\s\S]*?<option value="2">2 BHK<\/option>[\s\S]*?<option value="3">3 BHK<\/option>[\s\S]*?<option value="4">4 BHK<\/option>[\s\S]*?<option value="5">5 BHK<\/option>[\s\S]*?<\/select>/,
  `<CustomSelect
            value={bhk}
            onChange={val => { setBhk(val); resetAndReload(); }}
            options={[
              { value: '', label: 'All BHK' },
              { value: '1', label: '1 BHK' },
              { value: '2', label: '2 BHK' },
              { value: '3', label: '3 BHK' },
              { value: '4', label: '4 BHK' },
              { value: '5', label: '5 BHK' }
            ]}
          />`
);

// 4. Property Type
code = code.replace(
  /<select[\s\S]*?value={propertyType}[\s\S]*?onChange={e => \{ setPropertyType\(e\.target\.value\); resetAndReload\(\); \}}[\s\S]*?className="[^"]*"[\s\S]*?>[\s\S]*?<option value="">All Types<\/option>[\s\S]*?<option value="apartment">Apartment<\/option>[\s\S]*?<option value="villa">Villa<\/option>[\s\S]*?<option value="builder floor">Builder Floor<\/option>[\s\S]*?<option value="penthouse">Penthouse<\/option>[\s\S]*?<\/select>/,
  `<CustomSelect
            value={propertyType}
            onChange={val => { setPropertyType(val); resetAndReload(); }}
            options={[
              { value: '', label: 'All Types' },
              { value: 'apartment', label: 'Apartment' },
              { value: 'villa', label: 'Villa' },
              { value: 'builder floor', label: 'Builder Floor' },
              { value: 'penthouse', label: 'Penthouse' }
            ]}
          />`
);

// 5. Furnishing
code = code.replace(
  /<select[\s\S]*?value={furnishing}[\s\S]*?onChange={e => \{ setFurnishing\(e\.target\.value\); resetAndReload\(\); \}}[\s\S]*?className="[^"]*"[\s\S]*?>[\s\S]*?<option value="">Any Furnishing<\/option>[\s\S]*?<option value="fully-furnished">Fully Furnished<\/option>[\s\S]*?<option value="semi-furnished">Semi Furnished<\/option>[\s\S]*?<option value="unfurnished\">Unfurnished<\/option>[\s\S]*?<\/select>/,
  `<CustomSelect
            value={furnishing}
            onChange={val => { setFurnishing(val); resetAndReload(); }}
            options={[
              { value: '', label: 'Any Furnishing' },
              { value: 'fully-furnished', label: 'Fully Furnished' },
              { value: 'semi-furnished', label: 'Semi Furnished' },
              { value: 'unfurnished', label: 'Unfurnished' }
            ]}
          />`
);

fs.writeFileSync('frontend/src/app/explore/page.tsx', code);
