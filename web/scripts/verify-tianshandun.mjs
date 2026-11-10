/**
 * 六爻回归验证：天山遁（乾宫·金）
 * 预期六亲：土=父母、金=兄弟、火=官鬼
 * 运行：node scripts/verify-tianshandun.mjs
 */
import { calculateLiuyao } from 'taibu-core/liuyao';

// 下艮（阴阴阳）上乾（阳阳阳），从初爻到上爻
const yaoValues = [8, 8, 7, 7, 7, 7];

const out = await calculateLiuyao({
  question: '回归验证',
  yongShenTargets: ['父母'],
  method: 'coins',
  yaoValues,
  date: '2026-11-10T10:00:00',
  timezone: 'Asia/Shanghai',
});

console.log('卦名:', out.hexagramName);
console.log('宫位:', out.hexagramGong, '五行:', out.hexagramElement);
console.log('---');

for (const yao of out.fullYaos) {
  const position = `${yao.position}`;
  const yinYang = yao.type === 1 ? '阳' : '阴';
  const mark = yao.isShiYao ? '世' : yao.isYingYao ? '应' : '  ';
  console.log(
    `${position} ${yinYang} ${yao.liuQin} ${yao.naJia}${yao.wuXing} ${mark}`,
  );
}

const expected = {
  6: { liuQin: '父母', naJiaWuXing: '戌土' },
  5: { liuQin: '兄弟', naJiaWuXing: '申金' },
  4: { liuQin: '官鬼', naJiaWuXing: '午火' },
  3: { liuQin: '兄弟', naJiaWuXing: '申金' },
  2: { liuQin: '官鬼', naJiaWuXing: '午火' },
  1: { liuQin: '父母', naJiaWuXing: '辰土' },
};

let pass = true;
for (const yao of out.fullYaos) {
  const exp = expected[yao.position];
  if (!exp) continue;
  const actual = `${yao.naJia}${yao.wuXing}`;
  if (yao.liuQin !== exp.liuQin || actual !== exp.naJiaWuXing) {
    pass = false;
    console.log(
      `不匹配 第${yao.position}爻：期望 ${exp.liuQin} ${exp.naJiaWuXing}，实际 ${yao.liuQin} ${actual}`,
    );
  }
}

console.log('---');
console.log(pass ? 'RESULT: PASS 六亲与纳甲全部匹配' : 'RESULT: FAIL');
