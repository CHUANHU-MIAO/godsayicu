/**
 * 全术数域接入验证脚本
 * 用途：对 taibu-core 的每个术数域用最小合理入参真实调用一次，打印成功/失败与关键字段。
 * 运行：node scripts/verify-all-domains.mjs
 *
 * 说明：适配层位于 lib/divination/，其中的入参归一化与本脚本保持一致；
 * 由于 Node 无法直接导入 TypeScript，本脚本直接调用 taibu-core 对应子路径来验证各域引擎。
 */
import { calculateLiuyao } from 'taibu-core/liuyao';
import { calculateTarot } from 'taibu-core/tarot';
import { calculateZiwei } from 'taibu-core/ziwei';
import { calculateDaliuren } from 'taibu-core/daliuren';
import { calculateDailyAlmanac } from 'taibu-core/almanac';
import { calculateBazi } from 'taibu-core/bazi';
import { calculateBaziDayun } from 'taibu-core/bazi-dayun';
import { calculateMeihua } from 'taibu-core/meihua';
import { calculateQimen } from 'taibu-core/qimen';
import { calculateAstrology } from 'taibu-core/astrology';
import { calculateXiaoliurenData } from 'taibu-core/xiaoliuren';
import { calculateTaiyi } from 'taibu-core/taiyi';

const TZ = 'Asia/Shanghai';
const DATE = '2026-11-10';
const DATETIME = '2026-11-10T10:00:00';

const birth = {
  birthYear: 1990,
  birthMonth: 6,
  birthDay: 15,
  birthHour: 10,
  timezone: TZ,
};

function jiao() {
  const face = () => (Math.random() < 0.5 ? '正' : '反');
  const faces = [face(), face()];
  if (faces[0] !== faces[1]) return { result: 'sheng', label: '圣杯', meaning: '允', faces };
  if (faces[0] === '正') return { result: 'xiao', label: '笑杯', meaning: '陈述未明', faces };
  return { result: 'yin', label: '阴杯', meaning: '不允', faces };
}

const checks = [
  {
    domain: 'liuyao',
    run: async () => {
      const out = await calculateLiuyao({
        question: '近期事业',
        yongShenTargets: ['官鬼'],
        method: 'coins',
        yaoValues: [7, 8, 9, 6, 7, 8],
        date: DATETIME,
        timezone: TZ,
      });
      return {
        hexagramName: out.hexagramName,
        changedHexagramName: out.changedHexagramName,
        dayGanZhi: `${out.ganZhiTime.day.gan}${out.ganZhiTime.day.zhi}`,
        yaoCount: out.fullYaos?.length,
        kongWang: out.kongWang?.kongDizhi?.join(''),
      };
    },
  },
  {
    domain: 'tarot',
    run: async () => {
      const out = await calculateTarot({ spreadType: 'three-card', question: '近期发展' });
      return {
        spreadName: out.spreadName,
        cardCount: out.cards.length,
        firstCard: out.cards[0] && {
          position: out.cards[0].position,
          name: out.cards[0].card.nameChinese,
          orientation: out.cards[0].orientation,
        },
      };
    },
  },
  {
    domain: 'ziwei',
    run: async () => {
      const out = calculateZiwei({ ...birth, gender: 'male' });
      return {
        solarDate: out.solarDate,
        lunarDate: out.lunarDate,
        fiveElement: out.fiveElement,
        soul: out.soul,
        body: out.body,
        palaceCount: out.palaces.length,
        zodiac: out.zodiac,
      };
    },
  },
  {
    domain: 'daliuren',
    run: async () => {
      const out = calculateDaliuren({ date: DATE, hour: 10, minute: 0, timezone: TZ, question: '测试' });
      return {
        bazi: out.dateInfo.bazi,
        yueJiang: out.dateInfo.yueJiangName,
        keName: out.keName,
        chu: out.sanChuan.chu,
        keTi: out.keTi.method,
        shenShaCount: out.shenSha.length,
      };
    },
  },
  {
    domain: 'almanac',
    run: async () => {
      const out = await calculateDailyAlmanac({ date: DATE, timezone: TZ });
      return {
        date: out.date,
        dayGanZhi: out.dayInfo.ganZhi,
        lunarDate: out.almanac.lunarDate,
        suitableCount: out.almanac.suitable.length,
        chongSha: out.almanac.chongSha,
        dayOfficer: out.almanac.dayOfficer,
      };
    },
  },
  {
    domain: 'bazi',
    run: async () => {
      const bazi = calculateBazi({ ...birth, gender: 'male' });
      const dayun = calculateBaziDayun({ ...birth, gender: 'male' });
      const p = bazi.fourPillars;
      return {
        fourPillars: [p.year, p.month, p.day, p.hour]
          .map((item) => (item ? `${item.stem}${item.branch}` : ''))
          .join(' '),
        dayMaster: bazi.dayMaster,
        dayunStartAge: dayun.startAge,
        dayunCount: dayun.list.length,
        firstDayun: dayun.list[0] && `${dayun.list[0].ganZhi}(${dayun.list[0].startYear})`,
      };
    },
  },
  {
    domain: 'meihua',
    run: async () => {
      const out = calculateMeihua({ question: '近期财运', date: DATETIME, method: 'time' });
      return {
        mainHexagram: out.mainHexagram.name,
        changedHexagram: out.changedHexagram?.name,
        movingLine: out.movingLine,
        bodyUseRelation: out.bodyUseRelation.relation,
        outcome: out.judgement.outcome,
      };
    },
  },
  {
    domain: 'qimen',
    run: async () => {
      const out = await calculateQimen({
        year: 2026,
        month: 11,
        day: 10,
        hour: 10,
        minute: 0,
        timezone: TZ,
        question: '测试',
      });
      return {
        siZhu: out.siZhu,
        dunJu: `${out.dunType}遁${out.juNumber}局`,
        zhiFu: out.zhiFu,
        zhiShi: out.zhiShi,
        palaceCount: out.palaces.length,
      };
    },
  },
  {
    domain: 'astrology',
    run: async () => {
      const out = calculateAstrology({
        ...birth,
        latitude: 39.9042,
        longitude: 116.4074,
        birthPlace: '北京',
      });
      return {
        sunSign: out.natal.sunSign.label,
        ascendant: out.natal.angles.find((item) => item.key === 'ascendant')?.sign.label,
        houseCount: out.natal.houses.length,
        bodyCount: out.natal.bodies.length,
        majorAspectCount: out.majorAspects.length,
      };
    },
  },
  {
    domain: 'xiaoliuren',
    run: async () => {
      const out = calculateXiaoliurenData({
        date: DATE,
        hour: 10,
        hourType: 'clock',
        question: '测试',
      });
      return {
        monthStatus: out.monthStatus,
        dayStatus: out.dayStatus,
        hourStatus: out.hourStatus,
        name: out.result.name,
        nature: out.result.nature,
      };
    },
  },
  {
    domain: 'taiyi',
    run: async () => {
      const out = calculateTaiyi({
        mode: 'hour',
        date: DATE,
        hour: 10,
        minute: 0,
        timezone: TZ,
        question: '测试',
      });
      return {
        system: out.boardMeta.systemLabel,
        mode: out.boardMeta.modeLabel,
        dayGanZhi: out.datetimeContext.dayGanZhi,
        hourGanZhi: out.datetimeContext.hourGanZhi,
        primaryStar: out.coreBoard?.primaryStar?.taiyiName,
        summary: out.judgementAnchors.summary[0],
      };
    },
  },
  {
    domain: 'jiao',
    run: async () => jiao(),
  },
];

let failed = 0;

for (const { domain, run } of checks) {
  try {
    const detail = await run();
    console.log(`${domain} -> 成功 | ${JSON.stringify(detail)}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${domain} -> 失败 | ${message}`);
    if (error instanceof Error && error.stack) {
      console.log(error.stack.split('\n').slice(0, 4).join('\n'));
    }
  }
}

console.log(
  `\n合计 ${checks.length} 个域：成功 ${checks.length - failed}，失败 ${failed}`,
);
if (failed > 0) process.exitCode = 1;
