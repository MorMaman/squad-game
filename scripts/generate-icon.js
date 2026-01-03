/**
 * Generate App Icon for Squad Game
 * Creates a modern, vibrant gaming icon
 */

const sharp = require('sharp');
const path = require('path');

const SIZE = 1024;
const PADDING = 100;

// App colors
const COLORS = {
  background: '#0A0E27',
  gradientStart: '#7C3AED', // Purple
  gradientEnd: '#EC4899',   // Pink
  accent: '#00FF87',        // Green
  gold: '#FFD700',
};

// Create SVG for the icon
const createIconSVG = () => {
  const centerX = SIZE / 2;
  const centerY = SIZE / 2;

  return `
    <svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background gradient -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0F1535"/>
          <stop offset="100%" style="stop-color:#0A0E27"/>
        </linearGradient>

        <!-- Main gradient for shapes -->
        <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${COLORS.gradientStart}"/>
          <stop offset="100%" style="stop-color:${COLORS.gradientEnd}"/>
        </linearGradient>

        <!-- Glow effect -->
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Inner shadow -->
        <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur"/>
          <feOffset dy="5" dx="0"/>
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/>
          <feFlood flood-color="black" flood-opacity="0.3"/>
          <feComposite in2="shadowDiff" operator="in"/>
          <feComposite in2="SourceGraphic" operator="over"/>
        </filter>
      </defs>

      <!-- Background with rounded corners -->
      <rect width="${SIZE}" height="${SIZE}" rx="220" ry="220" fill="url(#bgGrad)"/>

      <!-- Subtle grid pattern -->
      <g opacity="0.03">
        ${Array.from({length: 10}, (_, i) => `
          <line x1="${i * 100 + 50}" y1="0" x2="${i * 100 + 50}" y2="${SIZE}" stroke="white" stroke-width="2"/>
          <line x1="0" y1="${i * 100 + 50}" x2="${SIZE}" y2="${i * 100 + 50}" stroke="white" stroke-width="2"/>
        `).join('')}
      </g>

      <!-- Outer glow ring -->
      <circle cx="${centerX}" cy="${centerY}" r="380" fill="none" stroke="url(#mainGrad)" stroke-width="3" opacity="0.3"/>

      <!-- Main hexagon shape (gaming feel) -->
      <g filter="url(#glow)">
        <polygon
          points="${centerX},${centerY - 320} ${centerX + 277},${centerY - 160} ${centerX + 277},${centerY + 160} ${centerX},${centerY + 320} ${centerX - 277},${centerY + 160} ${centerX - 277},${centerY - 160}"
          fill="url(#mainGrad)"
          opacity="0.15"
        />
      </g>

      <!-- Inner hexagon -->
      <polygon
        points="${centerX},${centerY - 280} ${centerX + 242},${centerY - 140} ${centerX + 242},${centerY + 140} ${centerX},${centerY + 280} ${centerX - 242},${centerY + 140} ${centerX - 242},${centerY - 140}"
        fill="none"
        stroke="url(#mainGrad)"
        stroke-width="4"
        opacity="0.5"
      />

      <!-- Game controller / Play symbol mashup -->
      <g transform="translate(${centerX}, ${centerY})">
        <!-- Controller base shape -->
        <ellipse cx="0" cy="0" rx="200" ry="140" fill="url(#mainGrad)" filter="url(#innerShadow)"/>

        <!-- Controller handles -->
        <ellipse cx="-150" cy="80" rx="70" ry="90" fill="url(#mainGrad)"/>
        <ellipse cx="150" cy="80" rx="70" ry="90" fill="url(#mainGrad)"/>

        <!-- D-pad -->
        <g transform="translate(-90, -10)">
          <rect x="-15" y="-45" width="30" height="90" rx="8" fill="${COLORS.background}" opacity="0.6"/>
          <rect x="-45" y="-15" width="90" height="30" rx="8" fill="${COLORS.background}" opacity="0.6"/>
        </g>

        <!-- Action buttons -->
        <g transform="translate(90, -10)">
          <circle cx="0" cy="-30" r="18" fill="${COLORS.accent}" opacity="0.9"/>
          <circle cx="30" cy="0" r="18" fill="${COLORS.gold}" opacity="0.9"/>
          <circle cx="0" cy="30" r="18" fill="${COLORS.gradientEnd}" opacity="0.9"/>
          <circle cx="-30" cy="0" r="18" fill="${COLORS.gradientStart}" opacity="0.9"/>
        </g>

        <!-- Center play button -->
        <circle cx="0" cy="0" r="35" fill="${COLORS.background}" opacity="0.8"/>
        <polygon points="-10,-18 -10,18 18,0" fill="white" transform="translate(3, 0)"/>
      </g>

      <!-- "SG" text at bottom -->
      <text x="${centerX}" y="${centerY + 360}"
        font-family="Arial Black, sans-serif"
        font-size="80"
        font-weight="900"
        fill="url(#mainGrad)"
        text-anchor="middle"
        letter-spacing="15"
      >SG</text>

      <!-- Sparkle effects -->
      <g fill="${COLORS.gold}" opacity="0.8">
        <circle cx="180" cy="200" r="8"/>
        <circle cx="844" cy="280" r="6"/>
        <circle cx="200" cy="780" r="5"/>
        <circle cx="824" cy="744" r="7"/>
      </g>
    </svg>
  `;
};

async function generateIcon() {
  const svg = createIconSVG();
  const svgBuffer = Buffer.from(svg);

  // Generate main icon (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(__dirname, '../assets/icon.png'));

  console.log('Generated: assets/icon.png (1024x1024)');

  // Generate adaptive icon for Android (foreground layer)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(__dirname, '../assets/adaptive-icon.png'));

  console.log('Generated: assets/adaptive-icon.png (1024x1024)');

  // Generate favicon
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(__dirname, '../assets/favicon.png'));

  console.log('Generated: assets/favicon.png (48x48)');

  // Generate splash icon (smaller, centered)
  const splashSvg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#0A0E27"/>
      <g transform="translate(256, 256) scale(0.4)">
        ${createIconSVG().replace(/<svg[^>]*>/, '').replace('</svg>', '')}
      </g>
    </svg>
  `;

  await sharp(Buffer.from(splashSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, '../assets/splash-icon.png'));

  console.log('Generated: assets/splash-icon.png (512x512)');

  console.log('\nAll icons generated successfully!');
}

generateIcon().catch(console.error);
