'use client';

import { useEffect, useRef } from 'react';

import styles from './LuopanDisc.module.css';

/**
 * 背景罗盘：十二层综合盘。
 *
 * 为什么用字符串拼装而不是 React 元素：这一盘有约 1500 个节点（仅六十四卦卦象
 * 就 384 条爻线），做成 JSX 会同时压大服务端 HTML 与首屏 JS。这里是纯装饰、
 * 无状态、无交互，挂在客户端跑一次 innerHTML 最划算 —— 磁盘上只留生成器本身。
 *
 * 层数是刻意压到 12 的：层一少，同样的字号在盘里占比就大，盘上的字才看得清。
 * 视框也按实际画到的半径收紧，否则整盘会缩在中间一小圈。
 */

const CX = 900;
const CY = 900;
/** 统一线宽系数。视框收紧后单位不再被压得太狠，1.15 就够 */
const SW = 1.15;

const MOUNTAINS = ['午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬', '子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙'];
const TIANXING = ['天帝', '南极', '天马', '天吊', '天杀', '天钱', '咸池', '天阴', '天汉', '天阀', '天皇', '天辅', '天垒', '天乙', '天厨', '天市', '天区', '天檀', '阴权', '天衡', '天官', '天罡', '天梵', '天禽'];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const XX28 = ['角', '亢', '氐', '房', '心', '尾', '箕', '斗', '牛', '女', '虚', '危', '室', '壁', '奎', '娄', '胃', '昴', '毕', '觜', '参', '井', '鬼', '柳', '星', '张', '翼', '轸'];
const NINE = ['贪狼', '巨门', '禄存', '文曲', '廉贞', '武曲', '破军', '左辅', '右弼'];
const TRIGRAM_ORDER = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
const TRIGRAM_SYM = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
const TBIT = [7, 6, 5, 4, 3, 2, 1, 0];

const HEX_NAMES = [
  '乾', '夬', '大有', '大壮', '小畜', '需', '大畜', '泰',
  '履', '兑', '暌', '归妹', '中孚', '节', '损', '临',
  '同人', '革', '离', '丰', '家人', '既济', '贲', '明夷',
  '无妄', '随', '噬嗑', '震', '益', '屯', '颐', '复',
  '姤', '大过', '鼎', '恒', '巽', '井', '蛊', '升',
  '讼', '困', '未济', '解', '涣', '坎', '蒙', '师',
  '遁', '咸', '旅', '小过', '渐', '蹇', '艮', '谦',
  '否', '萃', '晋', '豫', '观', '比', '剥', '坤',
];

const jiazi = (i: number) => STEMS[i % 10] + BRANCHES[i % 12];

const pt = (R: number, phi: number): [number, number] => {
  const r = (phi * Math.PI) / 180;
  return [CX + R * Math.sin(r), CY - R * Math.cos(r)];
};

const line = (x1: number, y1: number, x2: number, y2: number, sw = 0.8) =>
  `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke-width="${(sw * SW).toFixed(2)}"/>`;

const ringText = (R: number, phi: number, str: string, size: number) => {
  const [x, y] = pt(R, phi);
  const px = x.toFixed(2);
  const py = y.toFixed(2);
  return `<text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="central" font-size="${size}" transform="rotate(${phi.toFixed(2)} ${px} ${py})">${str}</text>`;
};

const bounds = (i: number, o: number) =>
  `<circle cx="${CX}" cy="${CY}" r="${i}" stroke-width="${SW}"/>` +
  `<circle cx="${CX}" cy="${CY}" r="${o}" stroke-width="${SW}"/>`;

const dividers = (n: number, i: number, o: number, w = 0.6) => {
  let out = '';
  for (let k = 0; k < n; k++) {
    const phi = k * (360 / n);
    const [ax, ay] = pt(i, phi);
    const [bx, by] = pt(o, phi);
    out += line(ax, ay, bx, by, w);
  }
  return out;
};

type RingType =
  | 'bagua'
  | 'list'
  | 'mountains'
  | 'qilong'
  | 'jiazi'
  | 'hexname'
  | 'hexdraw'
  | 'deg360';

interface RingCfg {
  name: string;
  w: number;
  type: RingType;
  order?: 'xian' | 'hou';
  labels?: string[];
  count?: number;
  initRot?: number;
}

const RINGS: RingCfg[] = [
  { name: '先天八卦', w: 44, type: 'bagua', order: 'xian' },
  { name: '后天八卦', w: 42, type: 'bagua', order: 'hou' },
  { name: '二十四天星', w: 32, type: 'list', labels: TIANXING },
  { name: '地盘正针二十四山', w: 36, type: 'mountains', initRot: 0 },
  { name: '穿山七十二龙', w: 32, type: 'qilong' },
  { name: '透地平分六十龙', w: 32, type: 'jiazi', count: 60 },
  { name: '人盘中针二十四山', w: 36, type: 'mountains', initRot: 7.5 },
  { name: '二十八宿', w: 28, type: 'list', labels: XX28 },
  { name: '先天六十四卦·卦名', w: 28, type: 'hexname' },
  { name: '先天六十四卦·卦象', w: 46, type: 'hexdraw' },
  { name: '贪狼九星', w: 30, type: 'list', labels: NINE },
  { name: '周天三百六十度', w: 22, type: 'deg360' },
];

function buildLuopanMarkup(): { html: string; viewBox: string } {
  let inner = 66;
  let html = '';

  for (const cfg of RINGS) {
    const ri = inner;
    const ro = ri + cfg.w;
    const mid = (ri + ro) / 2;
    inner = ro + 2;

    let g = '';
    const open = cfg.initRot
      ? `<g transform="rotate(${cfg.initRot} ${CX} ${CY})">`
      : '<g>';

    if (cfg.type === 'bagua') {
      const order =
        cfg.order === 'xian'
          ? ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤']
          : ['离', '巽', '坤', '兑', '乾', '艮', '震', '坎'];
      g += bounds(ri, ro);
      order.forEach((nm, i) => {
        g += ringText(mid - 7, i * 45, TRIGRAM_SYM[TRIGRAM_ORDER.indexOf(nm)], 30);
        g += ringText(mid + 15, i * 45, nm, 13);
      });
    } else if (cfg.type === 'list') {
      const labels = cfg.labels ?? [];
      const fs = labels.length >= 24 ? 14 : labels.length >= 9 ? 17 : 18;
      g += bounds(ri, ro) + dividers(labels.length, ri, ro, 0.5);
      labels.forEach((s, i) => {
        g += ringText(mid, i * (360 / labels.length), s, fs);
      });
    } else if (cfg.type === 'mountains') {
      g += bounds(ri, ro) + dividers(24, ri, ro, 0.7);
      MOUNTAINS.forEach((c, i) => {
        g += ringText(mid, i * 15, c, 18);
      });
    } else if (cfg.type === 'qilong') {
      g += bounds(ri, ro) + dividers(72, ri, ro, 0.4);
      let c = 0;
      for (let i = 0; i < 72; i++) {
        g += ringText(mid, i * 5, i % 6 === 2 ? '正' : jiazi(c++), 9);
      }
    } else if (cfg.type === 'jiazi') {
      const count = cfg.count ?? 60;
      g += bounds(ri, ro) + dividers(count, ri, ro, 0.4);
      for (let j = 0; j < count; j++) {
        g += ringText(mid, j * (360 / count), jiazi(j), 11);
      }
    } else if (cfg.type === 'hexname') {
      g += bounds(ri, ro) + dividers(64, ri, ro, 0.3);
      for (let hn = 0; hn < 64; hn++) {
        g += ringText(mid, hn * (360 / 64), HEX_NAMES[hn], 10);
      }
    } else if (cfg.type === 'hexdraw') {
      g += bounds(ri, ro);
      const Ro = ro - 2;
      const Ri = ri + 2;
      const rowH = (Ro - Ri) / 6;
      const w = Math.min(22, (Ro - Ri) * 0.4);
      for (let h = 0; h < 64; h++) {
        const phi = h * (360 / 64);
        const up = TBIT[Math.floor(h / 8)];
        const lo = TBIT[h % 8];
        for (let r = 0; r < 6; r++) {
          const rad = Ro - (r + 0.5) * rowH;
          const pat = r < 3 ? up : lo;
          const yang = ((pat >> (2 - (r % 3))) & 1) === 1;
          const [px, py] = pt(rad, phi);
          const tx = Math.cos((phi * Math.PI) / 180);
          const ty = Math.sin((phi * Math.PI) / 180);
          if (yang) {
            g += line(px - tx * w, py - ty * w, px + tx * w, py + ty * w, 1);
          } else {
            const gap = w * 0.34;
            g += line(px - tx * w, py - ty * w, px - tx * gap, py - ty * gap, 1);
            g += line(px + tx * gap, py + ty * gap, px + tx * w, py + ty * w, 1);
          }
        }
      }
    } else if (cfg.type === 'deg360') {
      g += bounds(ri, ro);
      for (let d = 0; d < 360; d += 2) {
        const major = d % 30 === 0;
        const len = major ? 10 : 4;
        const [ax, ay] = pt(ro, d);
        const [bx, by] = pt(ro - len, d);
        g += line(ax, ay, bx, by, major ? 1.1 : 0.5);
        if (major) g += ringText(ri + 8, d, String(d), 11);
      }
    }

    html += open + g + '</g>';
  }

  const pad = 18;
  const span = 2 * (inner + pad);
  const viewBox = `${(CX - inner - pad).toFixed(1)} ${(CY - inner - pad).toFixed(1)} ${span.toFixed(1)} ${span.toFixed(1)}`;
  return { html, viewBox };
}

export default function LuopanDisc() {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.childElementCount > 0) return;
    const { html, viewBox } = buildLuopanMarkup();
    el.innerHTML = html;
    el.setAttribute('viewBox', viewBox);
  }, []);

  return <svg ref={ref} viewBox="-48 -48 1896 1896" aria-hidden="true" className={styles.svg} />;
}
