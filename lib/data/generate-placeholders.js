/* eslint-disable */
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', '..', 'public', 'images', 'cards');

// Create directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Helper to create a premium card SVG
function createCardSVG({
  title,
  game,
  bgColor = '#141416',
  borderColor = '#9c7a52',
  accentColor = '#6b4f36',
  glowColor = 'rgba(156,122,82,0.4)',
  holographic = false,
  holoAngle = 0,
}) {
  const isPokemon = game === 'pokemon';

  // Base holographic gradients
  let holoFilter = '';
  let holoOverlay = '';

  if (holographic) {
    // Holographic rainbow gradient shift based on angle
    const angleRad = (holoAngle * Math.PI) / 180;
    const x1 = Math.round(50 - Math.cos(angleRad) * 50);
    const y1 = Math.round(50 - Math.sin(angleRad) * 50);
    const x2 = Math.round(50 + Math.cos(angleRad) * 50);
    const y2 = Math.round(50 + Math.sin(angleRad) * 50);

    holoOverlay = `
      <!-- Holographic Overlay -->
      <linearGradient id="holoGrad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="rgba(255, 0, 128, 0.15)" />
        <stop offset="30%" stop-color="rgba(0, 128, 255, 0.15)" />
        <stop offset="65%" stop-color="rgba(0, 255, 128, 0.15)" />
        <stop offset="100%" stop-color="rgba(255, 255, 0, 0.15)" />
      </linearGradient>
      <rect width="100%" height="100%" fill="url(#holoGrad)" style="mix-blend-mode: color-dodge;" />
    `;
  }

  // Draw some nice abstract shape in the card center (e.g. fire swirl, vortex, manga lines)
  let artwork = '';
  if (title.includes('Charizard')) {
    // Fire swirl
    artwork = `
      <defs>
        <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff4d00" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#ff9900" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#ffcc00" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="175" cy="200" r="100" fill="url(#fireGlow)" />
      <path d="M175 120 C220 120 250 160 210 220 C180 260 130 240 140 200 C150 170 190 180 180 160 C170 140 150 150 150 135 C150 125 165 120 175 120 Z" fill="#ff4d00" opacity="0.3" filter="blur(5px)" />
      <path d="M175 130 C200 130 220 150 200 190 C180 220 150 210 155 185 C160 165 185 170 180 155 C175 140 160 145 160 135 C160 128 170 130 175 130 Z" fill="#ff9900" opacity="0.5" filter="blur(2px)" />
    `;
  } else if (title.includes('Ace')) {
    // Manga flame lines
    artwork = `
      <defs>
        <radialGradient id="aceGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="40%" stop-color="#e6c875" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="175" cy="200" r="110" fill="url(#aceGlow)" />
      <!-- Manga style lines radiating from center -->
      <g stroke="#000000" stroke-width="1.5" opacity="0.4">
        <line x1="175" y1="200" x2="50" y2="80" />
        <line x1="175" y1="200" x2="300" y2="80" />
        <line x1="175" y1="200" x2="50" y2="320" />
        <line x1="175" y1="200" x2="300" y2="320" />
        <line x1="175" y1="200" x2="175" y2="60" />
        <line x1="175" y1="200" x2="175" y2="340" />
        <line x1="175" y1="200" x2="40" y2="200" />
        <line x1="175" y1="200" x2="310" y2="200" />
      </g>
      <!-- Stylized flame -->
      <path d="M175 140 C200 170 200 230 175 260 C150 230 150 170 175 140 Z" fill="#e6c875" opacity="0.8" />
    `;
  } else if (title.includes('Lugia')) {
    // Storm wind vortex
    artwork = `
      <defs>
        <radialGradient id="stormGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="60%" stop-color="#7da8d8" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#0b172a" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="175" cy="200" r="100" fill="url(#stormGlow)" />
      <!-- Spiral vortex lines -->
      <path d="M175 200 A 30 30 0 0 1 145 170 A 50 50 0 0 1 195 120 A 70 70 0 0 1 245 190 A 90 90 0 0 1 155 280" fill="none" stroke="#7da8d8" stroke-width="3" opacity="0.6" stroke-linecap="round" />
      <path d="M175 200 A 15 15 0 0 1 160 185 A 25 25 0 0 1 185 160 A 35 35 0 0 1 210 195 A 45 45 0 0 1 165 240" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.8" stroke-linecap="round" />
    `;
  } else if (title.includes('Luffy')) {
    // Manga sketch storm
    artwork = `
      <defs>
        <radialGradient id="luffyGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f87171" stop-opacity="0.6" />
          <stop offset="80%" stop-color="#000" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="175" cy="200" r="100" fill="url(#luffyGlow)" />
      <!-- Wave lines sketch -->
      <path d="M80 250 C120 200 150 200 175 220 C200 240 230 240 270 190" fill="none" stroke="#f87171" stroke-width="2" opacity="0.7" />
      <path d="M70 230 C110 180 140 180 165 200 C190 220 220 220 260 170" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6" />
      <circle cx="175" cy="180" r="30" fill="none" stroke="#f87171" stroke-width="4" opacity="0.8" />
    `;
  } else if (title.includes('Mew ex')) {
    // Solid gold cosmic bubble
    artwork = `
      <defs>
        <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9" />
          <stop offset="40%" stop-color="#eab308" stop-opacity="0.7" />
          <stop offset="80%" stop-color="#ca8a04" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#ca8a04" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="175" cy="200" r="110" fill="url(#goldGlow)" />
      <!-- Rings of gold -->
      <circle cx="175" cy="200" r="70" fill="none" stroke="#fef08a" stroke-width="2" opacity="0.6" />
      <circle cx="175" cy="200" r="50" fill="none" stroke="#fef08a" stroke-width="1" opacity="0.8" stroke-dasharray="5,5" />
      <circle cx="175" cy="200" r="30" fill="#fef08a" opacity="0.8" filter="blur(3px)" />
    `;
  } else if (title.includes('Bonney')) {
    // Forest leaves swirl
    artwork = `
      <defs>
        <radialGradient id="bonneyGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#4ade80" stop-opacity="0.7" />
          <stop offset="60%" stop-color="#15803d" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#022c22" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="175" cy="200" r="100" fill="url(#bonneyGlow)" />
      <!-- Swirling vines -->
      <path d="M100 230 C120 150 200 150 210 200 C220 250 150 260 175 170" fill="none" stroke="#4ade80" stroke-width="3.5" opacity="0.6" stroke-linecap="round" />
      <path d="M110 210 C130 140 180 140 200 190 C220 240 170 230 180 180" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.8" stroke-linecap="round" />
    `;
  }

  // Final SVG string
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 500" width="100%" height="100%">
      <!-- Card Base Background -->
      <rect width="100%" height="100%" rx="16" fill="${bgColor}" />

      <!-- Outer Luxury Double Border -->
      <rect x="10" y="10" width="330" height="480" rx="12" fill="none" stroke="${borderColor}" stroke-width="2" />
      <rect x="14" y="14" width="322" height="472" rx="10" fill="none" stroke="${borderColor}" stroke-width="0.75" stroke-opacity="0.6" />

      <!-- Banner/Card Top Header Area -->
      <rect x="25" y="25" width="300" height="40" rx="4" fill="#000000" fill-opacity="0.3" />
      <text x="35" y="49" font-family="'Inter', sans-serif" font-weight="bold" font-size="12" fill="#ffffff" letter-spacing="1.5">${title.toUpperCase()}</text>
      <text x="315" y="49" font-family="'Inter', sans-serif" font-weight="bold" font-size="11" fill="${borderColor}" text-anchor="end" letter-spacing="1">TCG</text>

      <!-- Main Artwork Window Frame -->
      <rect x="25" y="75" width="300" height="250" rx="6" fill="#000000" fill-opacity="0.5" stroke="${borderColor}" stroke-width="0.5" />

      <!-- Card Illustration Content -->
      <g>
        <clipPath id="artClip">
          <rect x="26" y="76" width="298" height="248" rx="5" />
        </clipPath>
        <g clip-path="url(#artClip)">
          <!-- Abstract artwork background -->
          <rect x="26" y="76" width="298" height="248" fill="#0b0b0c" />
          ${artwork}
        </g>
      </g>

      <!-- Card Info Panel Section (Bottom) -->
      <rect x="25" y="335" width="300" height="140" rx="6" fill="#000000" fill-opacity="0.2" stroke="${borderColor}" stroke-width="0.5" />

      <!-- Text details inside Info Panel -->
      <text x="38" y="365" font-family="'Fraunces', serif" font-style="italic" font-size="14" fill="#ffffff">Kudjo Curated Specimen</text>

      <!-- Decorative gold divider -->
      <line x1="38" y1="380" x2="312" y2="380" stroke="${borderColor}" stroke-width="0.5" stroke-opacity="0.5" />

      <!-- Description text lines (lorem card details) -->
      <text x="38" y="405" font-family="'Inter', sans-serif" font-size="10" fill="#a3a3a3">Physical examination confirms centering: 60/40.</text>
      <text x="38" y="422" font-family="'Inter', sans-serif" font-size="10" fill="#a3a3a3">Surface foil reflects standard olography spectrum.</text>
      <text x="38" y="439" font-family="'Inter', sans-serif" font-size="10" fill="#a3a3a3">Stored inside ultra-secure temperature controlled vault.</text>

      <!-- Footer catalog identifier -->
      <text x="38" y="464" font-family="'Inter', sans-serif" font-size="8" fill="#525252" letter-spacing="1">KUDJO ARCHIVE COLLECTION · v1.0</text>

      ${holoOverlay}
    </svg>
  `;
}

// Helper to create a premium card back SVG
function createCardBackSVG() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 500" width="100%" height="100%">
      <!-- Base Background -->
      <rect width="100%" height="100%" rx="16" fill="#0d1117" />

      <!-- Outer Gold Borders -->
      <rect x="10" y="10" width="330" height="480" rx="12" fill="none" stroke="#9c7a52" stroke-width="2.5" />
      <rect x="15" y="15" width="320" height="470" rx="10" fill="none" stroke="#9c7a52" stroke-width="0.75" stroke-opacity="0.6" />

      <!-- Inner Dark Plate -->
      <rect x="25" y="25" width="300" height="450" rx="8" fill="#080a0f" />
      <rect x="29" y="29" width="292" height="442" rx="6" fill="none" stroke="#6b4f36" stroke-width="0.5" />

      <!-- Central Mandala / Gold Crest -->
      <g transform="translate(175, 250)">
        <circle r="60" fill="none" stroke="#9c7a52" stroke-width="1.5" />
        <circle r="40" fill="none" stroke="#6b4f36" stroke-width="0.75" />
        <circle r="20" fill="#9c7a52" opacity="0.1" />

        <!-- Star rays -->
        <g stroke="#9c7a52" stroke-width="1">
          <line x1="0" y1="-80" x2="0" y2="80" />
          <line x1="-80" y1="0" x2="80" y2="0" />
          <line x1="-56" y1="-56" x2="56" y2="56" />
          <line x1="-56" y1="56" x2="56" y2="-56" />
        </g>

        <!-- Decorative dots -->
        <circle cx="0" cy="-80" r="2.5" fill="#9c7a52" />
        <circle cx="0" cy="80" r="2.5" fill="#9c7a52" />
        <circle cx="-80" cy="0" r="2.5" fill="#9c7a52" />
        <circle cx="80" cy="0" r="2.5" fill="#9c7a52" />

        <circle cx="-56" cy="-56" r="2.5" fill="#9c7a52" />
        <circle cx="56" cy="56" r="2.5" fill="#9c7a52" />
        <circle cx="-56" cy="56" r="2.5" fill="#9c7a52" />
        <circle cx="56" cy="-56" r="2.5" fill="#9c7a52" />
      </g>

      <!-- Top and Bottom Branding text -->
      <text x="175" y="70" font-family="'Inter', sans-serif" font-weight="bold" font-size="10" fill="#9c7a52" letter-spacing="5" text-anchor="middle">KUDJO ARCHIVE</text>
      <text x="175" y="440" font-family="'Inter', sans-serif" font-weight="bold" font-size="10" fill="#9c7a52" letter-spacing="5" text-anchor="middle">OFFICIAL CARD BACK</text>
    </svg>
  `;
}

// Generate the specific card SVGs
const cardsToGenerate = [
  {
    filename: 'charizard_front.svg',
    title: 'Charizard ex',
    game: 'pokemon',
    bgColor: '#181210',
    borderColor: '#9c7a52',
    holographic: false,
  },
  {
    filename: 'charizard_angled.svg',
    title: 'Charizard ex',
    game: 'pokemon',
    bgColor: '#181210',
    borderColor: '#9c7a52',
    holographic: true,
    holoAngle: 45,
  },
  {
    filename: 'charizard_back.svg',
    isBack: true,
  },
  {
    filename: 'ace_front.svg',
    title: 'Portgas.D.Ace',
    game: 'one_piece',
    bgColor: '#141416',
    borderColor: '#b48c5a',
    holographic: false,
  },
  {
    filename: 'ace_angled.svg',
    title: 'Portgas.D.Ace',
    game: 'one_piece',
    bgColor: '#141416',
    borderColor: '#b48c5a',
    holographic: true,
    holoAngle: 120,
  },
  {
    filename: 'ace_back.svg',
    isBack: true,
  },
  {
    filename: 'lugia_front.svg',
    title: 'Lugia V',
    game: 'pokemon',
    bgColor: '#11161d',
    borderColor: '#8ba6c1',
    holographic: false,
  },
  {
    filename: 'lugia_angled.svg',
    title: 'Lugia V',
    game: 'pokemon',
    bgColor: '#11161d',
    borderColor: '#8ba6c1',
    holographic: true,
    holoAngle: 210,
  },
  {
    filename: 'luffy_front.svg',
    title: 'Monkey.D.Luffy',
    game: 'one_piece',
    bgColor: '#1a1415',
    borderColor: '#e16363',
    holographic: false,
  },
  {
    filename: 'mew_front.svg',
    title: 'Mew ex Gold',
    game: 'pokemon',
    bgColor: '#1b1a13',
    borderColor: '#fef08a',
    accentColor: '#ca8a04',
    glowColor: 'rgba(254,240,138,0.5)',
    holographic: false,
  },
  {
    filename: 'bonney_front.svg',
    title: 'Jewelry Bonney',
    game: 'one_piece',
    bgColor: '#0f1712',
    borderColor: '#4ade80',
    holographic: false,
  },
];

cardsToGenerate.forEach((card) => {
  const filePath = path.join(targetDir, card.filename);
  let svgContent = '';

  if (card.isBack) {
    svgContent = createCardBackSVG();
  } else {
    svgContent = createCardSVG({
      title: card.title,
      game: card.game,
      bgColor: card.bgColor,
      borderColor: card.borderColor,
      accentColor: card.accentColor,
      glowColor: card.glowColor,
      holographic: card.holographic,
      holoAngle: card.holoAngle,
    });
  }

  fs.writeFileSync(filePath, svgContent.trim());
  console.log(`Generated SVG: ${card.filename}`);
});

console.log('All card assets successfully generated in public/images/cards/');
