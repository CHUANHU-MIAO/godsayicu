'use client';

import { useEffect, useRef } from 'react';
import styles from './Coin3D.module.css';

export type CoinFace = 0 | 1; // 1 = 背，0 = 字

const DUR = 820;

/** 三枚铜钱：乾隆通宝 / 道光通宝 / 嘉庆通宝。每枚一面铸年号（字），另一面光背。 */
const COIN_REIGNS: [string, string, string, string][] = [
  ['乾', '隆', '通', '宝'],
  ['道', '光', '通', '宝'],
  ['嘉', '庆', '通', '宝'],
];

/** 三枚钱的摆放：轻微倾角 + 高低错落，落下时错开。参考 taibu 的布局。 */
const COIN_LAYOUT = [
  { tilt: -14, delayMs: 0, spins: 3, offset: 7 },
  { tilt: 9, delayMs: 70, spins: 4, offset: -9 },
  { tilt: 24, delayMs: 140, spins: 3, offset: 11 },
];

function CoinSvg({
  reign,
  back,
  id,
  tilt,
}: {
  reign: [string, string, string, string];
  back: boolean;
  id: string;
  tilt: number;
}) {
  // 直读：上、下、右、左 = 乾隆通宝 / 道光通宝 / 嘉庆通宝
  const [top, bottom, right, left] = reign;
  const metalId = `${id}-m`;
  const holeId = `${id}-h`;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={metalId} cx="34%" cy="28%" r="78%">
          <stop offset="0%" style={{ stopColor: 'var(--coin-hi)' }} />
          <stop offset="60%" style={{ stopColor: 'var(--coin-body)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--coin-rim)' }} />
        </radialGradient>
        {/* 方孔：用遮罩把中央方孔真正镂空，透出底色 */}
        <mask id={holeId}>
          <circle cx="50" cy="50" r="48" fill="white" />
          <rect x="40" y="40" width="20" height="20" fill="black" />
        </mask>
      </defs>
      <g transform={`rotate(${tilt} 50 50)`}>
        <g mask={`url(#${holeId})`}>
          {/* 钱体 */}
          <circle cx="50" cy="50" r="48" fill={`url(#${metalId})`} />
          {/* 外郭两道细圈 */}
          <circle cx="50" cy="50" r="47.3" fill="none" stroke="var(--coin-rim)" strokeWidth="1.2" opacity="0.55" />
          <circle cx="50" cy="50" r="42.5" fill="none" stroke="var(--coin-rim)" strokeWidth="1.4" opacity="0.7" />
          {/* 孔郭：方孔外的方框 */}
          <rect x="34.5" y="34.5" width="31" height="31" fill="none" stroke="var(--coin-rim)" strokeWidth="1.4" opacity="0.7" />
          {!back && (
            <g style={{ fill: 'var(--coin-ink)', fontFamily: 'var(--coin-font)' }}>
              {/* 直读：上·下·右·左 */}
              <text x="50" y="22" textAnchor="middle" dominantBaseline="central" fontSize="20">{top}</text>
              <text x="50" y="78" textAnchor="middle" dominantBaseline="central" fontSize="20">{bottom}</text>
              <text x="78" y="50" textAnchor="middle" dominantBaseline="central" fontSize="20">{right}</text>
              <text x="22" y="50" textAnchor="middle" dominantBaseline="central" fontSize="20">{left}</text>
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

export default function Coin3D({
  faces,
  spinToken,
  onSettled,
}: {
  faces: [CoinFace, CoinFace, CoinFace] | null;
  spinToken: number;
  onSettled?: () => void;
}) {
  const coinRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const innerRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const shadowRefs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];
  const prevFaceRef = useRef<number[]>([0, 0, 0]);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  useEffect(() => {
    if (!spinToken) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targets: [CoinFace, CoinFace, CoinFace] = faces ?? [0, 0, 0];
    let maxEnd = 0;

    for (let i = 0; i < 3; i += 1) {
      const coin = coinRefs[i].current;
      const inner = innerRefs[i].current;
      const shadow = shadowRefs[i].current;
      if (!coin || !inner || !shadow) continue;

      const back = targets[i] === 1;
      const endX = back ? 180 : 0;
      const startX = prevFaceRef.current[i];
      const total = COIN_LAYOUT[i].spins * 360 + (endX - startX);
      prevFaceRef.current[i] = endX;

      inner.style.transform = 'none';
      coin.style.transform = 'none';

      if (reduce) {
        inner.style.transform = `rotateX(${endX}deg)`;
        continue;
      }

      const delay = COIN_LAYOUT[i].delayMs;
      maxEnd = Math.max(maxEnd, DUR + delay);

      // 翻转：绕 X 轴转若干圈后停在结果那一面（连续抛掷从上一面接着转）
      inner.animate(
        [
          { transform: `rotateX(${startX}deg)`, easing: 'cubic-bezier(.2,.62,.28,1)' },
          { transform: `rotateX(${startX + total}deg)` },
        ],
        { duration: DUR, delay, fill: 'both' },
      );

      // 腾起：先落一点再高高跃起，落下后轻弹一次
      coin.animate(
        [
          { transform: 'translateY(0px)', offset: 0, easing: 'cubic-bezier(.4,0,.7,1)' },
          { transform: 'translateY(10px)', offset: 0.1, easing: 'cubic-bezier(.18,.72,.3,1)' },
          { transform: 'translateY(-46px)', offset: 0.42, easing: 'cubic-bezier(.5,.05,.86,.45)' },
          { transform: 'translateY(-12px)', offset: 0.65, easing: 'cubic-bezier(.3,.55,.36,1)' },
          { transform: 'translateY(6px)', offset: 0.79, easing: 'cubic-bezier(.3,1.45,.5,1)' },
          { transform: 'translateY(-9px)', offset: 0.87, easing: 'cubic-bezier(.4,0,.6,1)' },
          { transform: 'translateY(2px)', offset: 0.94, easing: 'cubic-bezier(.3,1.2,.5,1)' },
          { transform: 'translateY(0px)', offset: 1 },
        ],
        { duration: DUR, delay, fill: 'both' },
      );

      shadow.animate(
        [
          { transform: 'translateX(-50%) translate(0px,0px) scale(1.02,.95)', opacity: 0.5, offset: 0 },
          { transform: 'translateX(-50%) translate(1px,1px) scale(.94,.84)', opacity: 0.44, offset: 0.11 },
          { transform: 'translateX(-50%) translate(12px,5px) scale(.5,.34)', opacity: 0.13, offset: 0.43 },
          { transform: 'translateX(-50%) translate(2px,2px) scale(1.18,1.06)', opacity: 0.6, offset: 0.79 },
          { transform: 'translateX(-50%) translate(0px,1px) scale(.94,.9)', opacity: 0.4, offset: 0.87 },
          { transform: 'translateX(-50%) translate(0px,0px) scale(1.05,1.03)', opacity: 0.54, offset: 0.94 },
          { transform: 'translateX(-50%) translate(0px,0px) scale(1,1)', opacity: 0.5, offset: 1 },
        ],
        { duration: DUR, delay, fill: 'both' },
      );

      const finish = (index: number, endAngle: number) => () => {
        const el = innerRefs[index].current;
        if (el) el.style.transform = `rotateX(${endAngle}deg)`;
      };
      const anim = inner.getAnimations()[0];
      if (anim) anim.onfinish = finish(i, endX);
    }

    if (reduce) {
      settledRef.current?.();
      return;
    }

    const timer = setTimeout(() => settledRef.current?.(), maxEnd + 60);
    return () => clearTimeout(timer);
  }, [spinToken, faces]);

  return (
    <div className={styles.stage} aria-label="三枚铜钱">
      <div className={styles.tray} aria-hidden="true" />
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={styles.slot}
          style={{ transform: `translateY(${COIN_LAYOUT[index].offset}px)` }}
        >
          <div ref={coinRefs[index]} className={styles.coin}>
            <div ref={innerRefs[index]} className={styles.inner}>
              <span className={`${styles.side} ${styles.front}`}>
                <CoinSvg reign={COIN_REIGNS[index]} back={false} id={`coin-f-${index}`} tilt={COIN_LAYOUT[index].tilt} />
              </span>
              <span className={`${styles.side} ${styles.back}`}>
                <CoinSvg reign={COIN_REIGNS[index]} back id={`coin-b-${index}`} tilt={COIN_LAYOUT[index].tilt} />
              </span>
            </div>
          </div>
          <span ref={shadowRefs[index]} className={styles.shadow} />
        </div>
      ))}
    </div>
  );
}
