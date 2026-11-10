import { calculateLiuyao } from 'taibu-core/liuyao';

const out = await calculateLiuyao({
  question: '事业',
  yongShenTargets: ['官鬼'],
  method: 'coins',
  yaoValues: [7, 8, 9, 6, 7, 8],
  date: '2026-11-10T10:00:00',
  timezone: 'Asia/Shanghai',
});

console.log('TOP_KEYS:', Object.keys(out).join(','));
console.log('');
console.log('YAO0:', JSON.stringify(out.fullYaos[0], null, 2));
console.log('');
console.log('DERIVED:', JSON.stringify({
  nuclear: out.nuclearHexagram,
  opposite: out.oppositeHexagram,
  reversed: out.reversedHexagram,
}, null, 2).slice(0, 1200));
