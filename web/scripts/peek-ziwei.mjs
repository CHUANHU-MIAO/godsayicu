import { calculateZiwei } from 'taibu-core/ziwei';
import { calculateDaliuren } from 'taibu-core/daliuren';

const clip = (value, limit = 3000) =>
  JSON.stringify(value, null, 2).slice(0, limit);

const ziwei = await calculateZiwei({
  birthYear: 1990,
  birthMonth: 6,
  birthDay: 15,
  birthHour: 9,
  birthMinute: 30,
  gender: 'male',
  calendarType: 'solar',
  timezone: 'Asia/Shanghai',
});

console.log('=== ZIWEI keys ===');
console.log(Object.keys(ziwei));
console.log('=== ZIWEI soul/body/fiveElement ===');
console.log({
  soul: ziwei.soul,
  body: ziwei.body,
  fiveElement: ziwei.fiveElement,
  lifeMasterStar: ziwei.lifeMasterStar,
  bodyMasterStar: ziwei.bodyMasterStar,
  earthlyBranchOfSoulPalace: ziwei.earthlyBranchOfSoulPalace,
  earthlyBranchOfBodyPalace: ziwei.earthlyBranchOfBodyPalace,
  soulPalaceIndex: ziwei.palaces?.findIndex((p) => p.name === '命宫'),
});
console.log('=== ZIWEI palace names in array order ===');
console.log(ziwei.palaces?.map((p, i) => `${i}:${p.name}/${p.earthlyBranch}/${p.heavenlyStem}`));
console.log('=== ZIWEI first palace ===');
console.log(clip(ziwei.palaces?.[0], 1600));
console.log('=== ZIWEI decadalList ===');
console.log(clip(ziwei.decadalList?.slice(0, 4), 1200));
console.log('=== ZIWEI mutagenSummary ===');
console.log(clip(ziwei.mutagenSummary, 800));
console.log('=== ZIWEI full (truncated 3000) ===');
console.log(clip(ziwei, 3000));

const daliuren = await calculateDaliuren({
  date: '2026-11-10',
  hour: 14,
  minute: 30,
  timezone: 'Asia/Shanghai',
  question: '测试占问',
});

console.log('=== DALIUREN keys ===');
console.log(Object.keys(daliuren));
console.log('=== DALIUREN dateInfo ===');
console.log(clip(daliuren.dateInfo, 1200));
console.log('=== DALIUREN tianDiPan ===');
console.log(clip(daliuren.tianDiPan, 1600));
console.log('=== DALIUREN siKe ===');
console.log(clip(daliuren.siKe, 800));
console.log('=== DALIUREN sanChuan ===');
console.log(clip(daliuren.sanChuan, 800));
console.log('=== DALIUREN keTi/keName ===');
console.log(clip({ keName: daliuren.keName, keTi: daliuren.keTi }, 800));
console.log('=== DALIUREN gongInfos[0] ===');
console.log(clip(daliuren.gongInfos?.[0], 800));
console.log('=== DALIUREN gongInfos order ===');
console.log(daliuren.gongInfos?.map((g) => `${g.diZhi}/${g.tianZhi}/${g.tianJiangShort}`));
console.log('=== DALIUREN shenSha ===');
console.log(clip(daliuren.shenSha?.slice(0, 5), 800));
console.log('=== DALIUREN full (truncated 3000) ===');
console.log(clip(daliuren, 3000));
