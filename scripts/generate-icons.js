// scripts/generate-icons.js
// Script pour générer les icônes PWA à partir du SVG
// Exécuter avec: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Icône SVG de base (copie de favicon.svg)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#grad)"/>
  <path d="M256 96L296 216L416 256L296 296L256 416L216 296L96 256L216 216L256 96Z" fill="white"/>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// Créer le dossier si nécessaire
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Pour chaque taille, créer un SVG redimensionné
// Note: Pour de vraies icônes PNG, utiliser sharp ou canvas
sizes.forEach(size => {
  const svgContent = svgIcon.replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`);
  const filename = path.join(outputDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svgContent);
  console.log(`Created ${filename}`);
});

console.log('\\nIcônes SVG créées!');
console.log('\\nPour convertir en PNG, utilisez:');
console.log('npm install -g pwa-asset-generator');
console.log('pwa-asset-generator public/favicon.svg public/icons --index index.html --manifest public/manifest.json');
