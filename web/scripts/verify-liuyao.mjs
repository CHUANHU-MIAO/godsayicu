/**
 * 六爻接入验证脚本
 * 用途：确认 taibu-core 在当前工程内可正常计算，输出结构与预期一致。
 * 运行：node scripts/verify-liuyao.mjs
 */
import { calculateLiuyao } from 'taibu-core/liuyao';

const out = await calculateLiuyao({
  question: '近期事业',
  yongShenTargets: ['官鬼'],
  method: 'coins',
  yaoValues: [7, 8, 9, 6, 7, 8],
  date: '2026-11-10T10:00:00',
  timezone: 'Asia/Shanghai',
});

console.log('keys:', Object.keys(out ?? {}));

const brief = {
  hexagramName: out.hexagramName,
  hexagramGong: out.hexagramGong,
  hexagramElement: out.hexagramElement,
  changedHexagramName: out.changedHexagramName,
  ganZhiTime: out.ganZhiTime,
  kongWang: out.kongWang,
  yaos: out.fullYaos?.map((y) => ({
    pos: y.position,
    type: y.type,
    change: y.change,
    liuQin: y.liuQin,
    naJia: y.naJia,
    wuXing: y.wuXing,
    isShi: y.isShiYao,
    isYing: y.isYingYao,
  })),
};

console.log(JSON.stringify(brief, null, 2));
