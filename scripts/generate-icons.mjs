import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');

const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="112" fill="#18181B"/>
  <rect x="156" y="112" width="200" height="56" rx="28" fill="#FAFAFA"/>
  <rect x="116" y="228" width="280" height="56" rx="28" fill="#D4D4D8"/>
  <rect x="76" y="344" width="360" height="56" rx="28" fill="#A1A1AA"/>
  <path d="M256 168V228M196 284V344M316 284V344" stroke="#FAFAFA" stroke-width="20" stroke-linecap="round"/>
</svg>`;

// Maskable: full-bleed bg, symbol inset ~18% for safe zone
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#18181B"/>
  <g transform="translate(56 56) scale(0.78)">
    <rect x="156" y="112" width="200" height="56" rx="28" fill="#FAFAFA"/>
    <rect x="116" y="228" width="280" height="56" rx="28" fill="#D4D4D8"/>
    <rect x="76" y="344" width="360" height="56" rx="28" fill="#A1A1AA"/>
    <path d="M256 168V228M196 284V344M316 284V344" stroke="#FAFAFA" stroke-width="20" stroke-linecap="round"/>
  </g>
</svg>`;

async function writePng(name, svg, size) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(join(outDir, name), buf);
  console.log(name, size);
}

await writePng('icon-192.png', anySvg, 192);
await writePng('icon-512.png', anySvg, 512);
await writePng('apple-touch-icon.png', anySvg, 180);
await writePng('icon-192-maskable.png', maskableSvg, 192);
await writePng('icon-512-maskable.png', maskableSvg, 512);
