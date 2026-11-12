'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

import styles from './SealChars.module.css';

/**
 * 背景八枚小篆：一念归静 / 万理昭明。
 *
 * 字形来自「崇羲篆體」（說文小篆，OFL-1.1），已按 unicode-range 切成子集，
 * 只下命中这八个字的 7 块（约 474KB）。篆书要用繁体字形：歸 靜 萬。
 *
 * 星环态：每侧两列竖读，第一列提到左上、第二列沉到右下；
 * 展开态：四个一组横排，上下两带，并且要落在详情面板左缘以内。
 * 位置全部按视口算，尺寸跟着变，所以每帧都是「算 → 写入 style」，靠 CSS 过渡补间。
 */

interface ZiDef {
  ch: string;
  side: 'L' | 'R';
  /** 0 为外侧一列，1 为靠环一列；右侧镜像：0 靠环、1 靠外 */
  col: number;
  row: number;
}

const ZI_DEF: ZiDef[] = [
  { ch: '一', side: 'L', col: 0, row: 0 },
  { ch: '念', side: 'L', col: 0, row: 1 },
  { ch: '歸', side: 'L', col: 1, row: 0 },
  { ch: '靜', side: 'L', col: 1, row: 1 },
  { ch: '萬', side: 'R', col: 0, row: 0 },
  { ch: '理', side: 'R', col: 0, row: 1 },
  { ch: '昭', side: 'R', col: 1, row: 0 },
  { ch: '明', side: 'R', col: 1, row: 1 },
];

interface Plan {
  left: number;
  top: number;
  w: number;
  op: number;
}

const isMobile = () => window.innerWidth <= 900;

/** 星环的外接半宽：桌面 292 + 132/2；窄屏按当前轨道半径与节点宽算 */
function ringHalfW(): number {
  if (isMobile()) {
    const vw = window.innerWidth;
    const r = Math.min(150, Math.max(112, vw * 0.34));
    return r + 40;
  }
  return 292 + 66;
}

function computePlan(open: boolean): Plan[] {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const m = isMobile();
  const plan: Plan[] = [];

  if (!open) {
    if (m) {
      /* 窄屏两侧几乎没有留白，把两对字顶到屏幕上下两端的空角里，中间让给星环 */
      const ms = Math.round(Math.min(48, Math.max(32, W * 0.12)));
      const mg = 6;
      const lbx = 6;
      const rbx = W - lbx - ms * 2 - mg;
      for (const d of ZI_DEF) {
        const cx = d.side === 'L' ? lbx + d.col * (ms + mg) : rbx + d.col * (ms + mg);
        const pairTop = d.col === 0 ? H * 0.055 : H * 0.795;
        plan.push({ left: cx, top: pairTop + d.row * ms * 0.95, w: ms, op: 0.55 });
      }
      return plan;
    }

    const margin = W / 2 - ringHalfW();
    const size = Math.round(Math.min(112, Math.max(72, margin * 0.34)));
    const gap = 14;
    const blockW = size * 2 + gap;
    const x0 = Math.max(6, (margin - blockW) / 2);
    const xR = W - x0 - blockW;
    const vOff = size * 0.56; /* 同一列上下两字的间距 */
    const dOff = size * 1.3; /* 第一列上提 / 第二列下压，拉开成「左上—右下」 */

    for (const d of ZI_DEF) {
      const colLeft = d.side === 'L' ? x0 + d.col * (size + gap) : xR + d.col * (size + gap);
      const cy = H / 2 + (d.col === 0 ? -dOff : dOff) + (d.row === 0 ? -vOff : vOff);
      plan.push({ left: colLeft, top: cy - size / 2, w: size, op: 0.82 });
    }
    return plan;
  }

  /* ---- 展开态 ---- */
  if (m) {
    /* 窄屏：详情是底部抽屉，字只能待在最上面那条窄带里 */
    const sm = Math.round(Math.min(W * 0.135, 64));
    for (let k = 0; k < 4; k++) {
      plan.push({ left: W * 0.3 + k * sm * 1.14, top: H * 0.026 + (k % 2 ? sm * 0.3 : 0), w: sm, op: 0.42 });
    }
    for (let k = 0; k < 4; k++) {
      plan.push({ left: W * 0.05 + k * sm * 1.14, top: H * 0.098 + (k % 2 ? sm * 0.3 : 0), w: sm, op: 0.42 });
    }
    return plan;
  }

  /* 桌面：面板占住右侧 min(48vw,660px)，字只能落在它的左缘以内，
     否则末尾那一两个会被面板压掉半个。先算「安全右界」，两组再各自往里收。 */
  const panelW = Math.min(W * 0.48, 660);
  const safeR = W - panelW - W * 0.035;
  const so1 = Math.round(Math.min(W * 0.086, 124));
  const so2 = Math.round(Math.min(W * 0.082, 118));

  /* 步长先按给定起点算；排不开就退回起点，保证四字横向错得开又不越界 */
  const band = (xStart: number, minX: number, size: number) => {
    let st = (safeR - size - xStart) / 3;
    const minSt = size * 1.18;
    if (st < minSt) {
      st = minSt;
      xStart = safeR - size - st * 3;
    }
    if (xStart < minX) xStart = minX;
    return { x: xStart, st };
  };
  const b1 = band(W * 0.12, W * 0.09, so1);
  const b2 = band(W * 0.24, W * 0.1, so2);

  for (let k = 0; k < 4; k++) {
    /* 起点让开左上角的「返回星环」按钮 */
    plan.push({ left: b1.x + k * b1.st, top: H * 0.12 + (k % 2 ? so1 * 0.26 : 0), w: so1, op: 0.62 });
  }
  for (let k = 0; k < 4; k++) {
    plan.push({
      left: b2.x + k * b2.st,
      top: H * 0.76 + (k % 2 ? so2 * 0.26 : -(so2 * 0.16)),
      w: so2,
      op: 0.62,
    });
  }
  return plan;
}

export default function SealChars({ open }: { open: boolean }) {
  const [plan, setPlan] = useState<Plan[] | null>(null);
  /** 首帧必须瞬间就位，否则八字会从左上角滑进来；就位之后才开启过渡 */
  const [animated, setAnimated] = useState(false);

  useLayoutEffect(() => {
    const layout = () => setPlan(computePlan(open));
    layout();
    window.addEventListener('resize', layout);
    return () => window.removeEventListener('resize', layout);
  }, [open]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={styles.layer} aria-hidden="true">
      {ZI_DEF.map((z, i) => {
        const p = plan?.[i];
        return (
          <span
            key={z.ch}
            className={`${styles.slot} ${animated ? styles.animated : ''}`}
            style={{
              left: p?.left ?? 0,
              top: p?.top ?? 0,
              width: p?.w ?? 0,
              height: p?.w ?? 0,
              opacity: p?.op ?? 0,
            }}
          >
            <span
              className={styles.glyph}
              style={{
                fontSize: p ? p.w * 0.86 : 0,
                animationDelay: `${250 + i * 70}ms`,
              }}
            >
              {z.ch}
            </span>
          </span>
        );
      })}
    </div>
  );
}
