const fs = require('fs');

function processFile(filePath, objectName) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  if (!code.includes('import { cleanDisplayDescription }')) {
    code = code.replace(/import Link from 'next\/link';/, "import Link from 'next/link';\nimport { cleanDisplayDescription } from '@/lib/formatters';");
  }

  const regex1 = new RegExp('\\{' + objectName + '\\.description\\}', 'g');
  const regex2 = new RegExp('\\{' + objectName + '\\.description \\|\\| \\\'No description available\\.\\\'\\}', 'g');
  
  code = code.replace(regex1, '{cleanDisplayDescription(' + objectName + '.description)}');
  code = code.replace(regex2, '{cleanDisplayDescription(' + objectName + '.description)}');

  fs.writeFileSync(filePath, code);
}

processFile('frontend/src/app/rental/[id]/page.tsx', 'rental');
processFile('frontend/src/app/listing/[id]/page.tsx', 'listing');
