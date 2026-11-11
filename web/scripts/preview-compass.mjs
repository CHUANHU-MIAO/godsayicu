/**
 * 生成八角罗盘 + 太极的静态预览图，用于目视校验几何关系。
 * 结构与 components/home/OrbitStage.tsx 的 CompassDisc / TaijiSymbol 保持一致。
 * 用法：cd web && node scripts/preview-compass.mjs
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

const OUT_DIR = path.resolve(process.cwd(), '..', 'dist');

const OCT_CORNERS = Array.from({ length: 8 }, (_, i) => -90 + i * 45);
const TICKS = Array.from({ length: 24 }, (_, i) => i * 15);
const GUA = [
  [1, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [1, 0, 0],
  [0, 1, 1],
  [0, 1, 0],
  [0, 0, 1],
  [0, 0, 0],
];

function octagon(r) {
  return OCT_CORNERS.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return `${(150 + r * Math.cos(rad)).toFixed(1)},${(150 + r * Math.sin(rad)).toFixed(1)}`;
  }).join(' ');
}

function disc(t) {
  const nodes = OCT_CORNERS.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return `<circle cx="${(150 + 135 * Math.cos(rad)).toFixed(1)}" cy="${(150 + 135 * Math.sin(rad)).toFixed(1)}" r="1.7" fill="${t.gold}" opacity="0.5"/>`;
  }).join('');

  const ticks = TICKS.map((deg) => {
    const y2 = deg % 90 === 0 ? 34 : deg % 45 === 0 ? 30 : 27;
    const style =
      deg % 90 === 0
        ? `stroke="${t.gold}" stroke-width="1.4" stroke-linecap="round" opacity="0.75"`
        : `stroke="${t.line2}" stroke-width="0.9" opacity="0.7"`;
    return `<line x1="150" y1="22" x2="150" y2="${y2}" ${style} transform="rotate(${deg} 150 150)"/>`;
  }).join('');

  const gua = GUA.map((lines, index) => {
    const rows = lines
      .map((solid, row) => {
        const y = 52 + row * 6;
        const s = `stroke="${t.gold}" stroke-width="1.8" stroke-linecap="round" opacity="0.38"`;
        return solid
          ? `<line x1="139" y1="${y}" x2="161" y2="${y}" ${s}/>`
          : `<line x1="139" y1="${y}" x2="148" y2="${y}" ${s}/><line x1="152" y1="${y}" x2="161" y2="${y}" ${s}/>`;
      })
      .join('');
    return `<g transform="rotate(${index * 45} 150 150)">${rows}</g>`;
  }).join('');

  return `<g opacity="0.62">
    <polygon points="${octagon(141)}" fill="none" stroke="${t.line2}" stroke-width="0.9"/>
    <polygon points="${octagon(133)}" fill="none" stroke="${t.line}" stroke-width="0.7" opacity="0.75"/>
    ${nodes}
    <circle cx="150" cy="150" r="112" fill="none" stroke="${t.line2}" stroke-width="0.9" opacity="0.85"/>
    <circle cx="150" cy="150" r="104" fill="none" stroke="${t.line2}" stroke-width="0.8" stroke-dasharray="2 6" opacity="0.6"/>
    ${ticks}
    ${gua}
    <circle cx="150" cy="150" r="80" fill="none" stroke="${t.line2}" stroke-width="0.9" opacity="0.85"/>
  </g>`;
}

function taiji(t) {
  return `<g transform="translate(150 150) scale(0.7708) translate(-100 -100)">
    <circle cx="100" cy="100" r="96" fill="${t.yang}"/>
    <path d="M100 4 A96 96 0 0 1 100 196 Z" fill="${t.yin}"/>
    <circle cx="100" cy="148" r="48" fill="${t.yang}"/>
    <circle cx="100" cy="52" r="48" fill="${t.yin}"/>
    <circle cx="100" cy="52" r="13" fill="${t.yang}"/>
    <circle cx="100" cy="148" r="13" fill="${t.yin}"/>
    <circle cx="100" cy="100" r="96" fill="none" stroke="${t.edge}" stroke-width="1.6"/>
  </g>`;
}

const THEMES = {
  dark: {
    bg: '#0a0809',
    gold: '#e0684f',
    line: '#3a2a28',
    line2: '#574039',
    taiji: { yin: '#100c0e', yang: '#f3e9e0', edge: 'rgba(224,104,79,0.5)' },
  },
  light: {
    bg: '#f7f3ee',
    gold: '#b23f28',
    line: '#ddd0c2',
    line2: '#bda99a',
    taiji: { yin: '#2b201c', yang: '#fffdf8', edge: 'rgba(178,63,40,0.45)' },
  },
};

mkdirSync(OUT_DIR, { recursive: true });

for (const [name, theme] of Object.entries(THEMES)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="600" height="600">
    <rect width="300" height="300" fill="${theme.bg}"/>
    ${disc(theme)}
    ${taiji(theme.taiji)}
  </svg>`;

  const out = path.join(OUT_DIR, `compass-oct-${name}.png`);
  await sharp(Buffer.from(svg), { density: 200 }).png().toFile(out);
  console.log('wrote', out);
}
