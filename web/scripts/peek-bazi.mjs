/**
 * 临时探针：确认 bazi / bazi-dayun / qimen 的真实输出结构，供页面渲染使用。
 * 运行：node scripts/peek-bazi.mjs
 */
import { calculateBazi } from 'taibu-core/bazi';
import { calculateBaziDayun } from 'taibu-core/bazi-dayun';
import { calculateQimen } from 'taibu-core/qimen';

const birth = {
  birthYear: 1990,
  birthMonth: 6,
  birthDay: 15,
  birthHour: 14,
  birthMinute: 30,
  gender: 'male',
  timezone: 'Asia/Shanghai',
};

const bazi = await calculateBazi(birth);
console.log('BAZI:', JSON.stringify(bazi, null, 2).slice(0, 3000));

const dayun = await calculateBaziDayun({ ...birth, yunSect: 2 });
console.log('DAYUN:', JSON.stringify(dayun, null, 2).slice(0, 3000));

const qimen = await calculateQimen({
  year: 2026,
  month: 11,
  day: 10,
  hour: 14,
  minute: 30,
  timezone: 'Asia/Shanghai',
  question: '测试',
});
console.log('QIMEN:', JSON.stringify(qimen, null, 2).slice(0, 3000));

console.log('QIMEN_META:', JSON.stringify({
  dunType: qimen.dunType,
  juNumber: qimen.juNumber,
  yuan: qimen.yuan,
  panType: qimen.panType,
  juMethod: qimen.juMethod,
  zhiFu: qimen.zhiFu,
  zhiShi: qimen.zhiShi,
  formations: qimen.globalFormations,
  boardFormations: qimen.boardFormations,
  palaceIndexes: qimen.palaces.map((p) => [p.palaceIndex, p.palaceName]),
  kongWang: qimen.kongWang,
  yiMa: qimen.yiMa,
}, null, 2));

console.log('DAYUN_META:', JSON.stringify({
  startAge: dayun.startAge,
  startAgeDetail: dayun.startAgeDetail,
  startSolar: dayun.startSolar,
  direction: dayun.direction,
  yunSect: dayun.yunSect,
  count: dayun.list.length,
  steps: dayun.list.map((d) => [d.startYear, d.startAge, d.ganZhi, d.tenGod, d.branchTenGod]),
}, null, 2));
