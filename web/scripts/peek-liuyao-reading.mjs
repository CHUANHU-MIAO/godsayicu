/**
 * 探查六爻可用的断卦字段，供本地解读生成器使用。
 * 运行：node scripts/peek-liuyao-reading.mjs
 */
import { calculateLiuyao } from 'taibu-core/liuyao';

const out = await calculateLiuyao({
  question: '事业',
  yongShenTargets: ['官鬼'],
  method: 'coins',
  yaoValues: [7, 8, 9, 6, 7, 8],
  date: '2026-11-10T10:00:00',
  timezone: 'Asia/Shanghai',
});

const keys = [
  'hexagramName',
  'hexagramBrief',
  'yongShen',
  'shenSystemByYongShen',
  'liuChongGuaInfo',
  'liuHeGuaInfo',
  'chongHeTransition',
  'guaFanFuYin',
  'sanHeAnalysis',
  'timeRecommendations',
  'guaShen',
  'fuShen',
];

for (const key of keys) {
  const value = out[key];
  const text = JSON.stringify(value, null, 2);
  console.log(`### ${key}`);
  console.log(text ? text.slice(0, 1600) : String(value));
  console.log('');
}
