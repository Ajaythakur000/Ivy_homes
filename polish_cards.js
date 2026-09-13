const fs = require('fs');

function polishCards(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Polish main card wrapper
  code = code.replace(/className="group relative flex flex-col border border-white\/\[0\.04\] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-black\/40 transition-all duration-300 bg-surface"/g, 
    'className="group relative flex flex-col border border-white/[0.08] rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300 bg-[#15181E]"');

  code = code.replace(/className="group block border border-white\/\[0\.04\] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-black\/40 transition-shadow bg-surface"/g, 
    'className="group block border border-white/[0.08] rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300 bg-[#15181E]"');

  // Polish the visual/image area depth
  code = code.replace(/className="h-48 relative flex items-center justify-center border-b border-white\/\[0\.08\]\/50"/g, 
    'className="h-52 relative flex items-center justify-center border-b border-white/[0.08] shadow-inner shadow-black/20"');

  // Typographic hierarchy polish
  code = code.replace(/<h3 className="font-semibold text-lg leading-tight truncate group-hover:text-accent transition-colors">/g, 
    '<h3 className="font-semibold text-[1.15rem] leading-tight truncate group-hover:text-accent transition-colors text-foreground">');

  code = code.replace(/<span className="font-semibold text-xl tracking-tight">/g, 
    '<span className="font-bold text-xl tracking-tight text-white">');

  code = code.replace(/<span className="text-sm font-medium text-secondary">/g, 
    '<span className="text-sm font-medium text-muted tracking-wide">');

  // Better heart button
  code = code.replace(/bg-black\/40 text-secondary border-white\/10 hover:text-accent hover:border-accent/g, 
    'bg-[#0F1115]/80 backdrop-blur-md text-secondary border-white/[0.15] hover:text-accent hover:border-accent hover:scale-105');
  code = code.replace(/bg-red-500\/10 text-red-400 border-red-500\/20 hover:bg-red-500\/20/g, 
    'bg-[#0F1115]/80 backdrop-blur-md text-red-400 border-red-500/30 hover:bg-red-500/20 hover:scale-105');

  fs.writeFileSync(filePath, code);
}

[
  'frontend/src/app/explore/page.tsx',
  'frontend/src/app/favourites/page.tsx',
  'frontend/src/app/rent/page.tsx',
  'frontend/src/app/projects/page.tsx'
].forEach(polishCards);
