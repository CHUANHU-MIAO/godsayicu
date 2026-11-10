'use client';

import { useEffect, useRef } from 'react';
import styles from './Coin3D.module.css';

export type CoinFace = 0 | 1; // 1 = 背，0 = 字

const DUR = 950;
const STAGGER = 150;

/** 三枚铜钱：乾隆通宝 / 道光通宝 / 嘉庆通宝 —— 乾道嘉谐音「钱到家」 */
const COIN_REIGNS: [string, string, string, string][] = [
  ['乾', '隆', '通', '宝'],
  ['道', '光', '通', '宝'],
  ['嘉', '庆', '通', '宝'],
];

function CoinSvg({
  reign,
  back,
  id,
}: {
  reign: [string, string, string, string];
  back: boolean;
  id: string;
}) {
  const [top, right, bottom, left] = reign;
  const bodyId = `${id}-b`;
  const rimId = `${id}-r`;
  const charId = `${id}-c`;
  const holeId = `${id}-h`;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        {/* 钱体：暖金，带高光与暗边 */}
        <radialGradient id={bodyId} cx="36%" cy="27%" r="84%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="24%" stopColor="#f7d47e" />
          <stop offset="55%" stopColor="#dca93d" />
          <stop offset="82%" stopColor="#a9771f" />
          <stop offset="100%" stopColor="#734c14" />
        </radialGradient>
        {/* 外缘：圆柱金属边，上亮下暗 */}
        <linearGradient id={rimId} x1="0.15" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#fff1c2" />
          <stop offset="44%" stopColor="#d6a236" />
          <stop offset="100%" stopColor="#7e531a" />
        </linearGradient>
        {/* 文字：上亮下暗，模拟阳起浮雕 */}
        <linearGradient id={charId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8c5c1a" />
          <stop offset="100%" stopColor="#3c2507" />
        </linearGradient>
        {/* 方孔：凹陷 */}
        <radialGradient id={holeId} cx="50%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#3a2810" />
          <stop offset="100%" stopColor="#0f0902" />
        </radialGradient>
      </defs>

      {/* 外缘立体边 */}
      <circle cx="50" cy="50" r="49" fill={`url(#${rimId})`} stroke="#5f3f12" strokeWidth="1.4" />
      {/* 钱体 */}
      <circle cx="50" cy="50" r="44.5" fill={`url(#${bodyId})`} stroke="#8f6520" strokeWidth="0.8" />
      {/* 内圈沟槽，分隔外缘与字面 */}
      <circle cx="50" cy="50" r="40" fill="none" stroke="#a3741d" strokeWidth="1.5" opacity="0.75" />
      <circle cx="50" cy="50" r="38.4" fill="none" stroke="#f6dd92" strokeWidth="0.6" opacity="0.5" />
      {/* 金属反光（左上高光） */}
      <path d="M15 39 A42 42 0 0 1 39 15" fill="none" stroke="#fff7e0" strokeOpacity="0.42" strokeWidth="2.6" strokeLinecap="round" />
      {/* 方孔：凹陷 + 内阴影 */}
      <rect x="36" y="36" width="28" height="28" rx="2" fill={`url(#${holeId})`} stroke="#c79f48" strokeWidth="1.1" />
      <rect x="36.6" y="36.6" width="26.8" height="26.8" rx="1.6" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1" />

      {back ? (
        <>
          {/* 背：素背，四决纹 + 中心圈 */}
          <path d="M43 16.5h4M57 16.5h4" stroke="#7d521a" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M43 83.5h4M57 83.5h4" stroke="#7d521a" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16.5 43v4M16.5 57v4" stroke="#7d521a" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M83.5 43v4M83.5 57v4" stroke="#7d521a" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="50" cy="50" r="21" fill="none" stroke="#7d521a" strokeWidth="0.9" opacity="0.5" />
        </>
      ) : (
        (() => {
          const glyphs: { ch: string; x: number; y: number }[] = [
            { ch: top, x: 50, y: 27.5 },
            { ch: right, x: 73.5, y: 54 },
            { ch: bottom, x: 50, y: 80.5 },
            { ch: left, x: 26.5, y: 54 },
          ];
          return (
            <g>
              {/* 阳起浮雕：右下暖光 + 左上高光，再压深字，呈现錾刻入铜的立体感 */}
              {glyphs.map((g, i) => (
                <g key={i}>
                  <text x={g.x + 0.7} y={g.y + 0.9} textAnchor="middle" fontSize="12" fontWeight="700" fill="#5c3c10" opacity="0.55">{g.ch}</text>
                  <text x={g.x - 0.6} y={g.y - 0.7} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff2c8" opacity="0.5">{g.ch}</text>
                  <text x={g.x} y={g.y} textAnchor="middle" fontSize="12" fontWeight="700" fill={`url(#${charId})`} stroke="#241603" strokeWidth="0.3">{g.ch}</text>
                </g>
              ))}
            </g>
          );
        })()
      )}
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

      const isBack = targets[i] === 1;
      const endY = isBack ? 180 : 0;

      // 清掉上一次的静态落定，避免与动画叠加
      inner.style.transform = 'none';
      coin.style.transform = 'none';

      if (reduce) {
        inner.style.transform = `rotateY(${endY}deg)`;
        continue;
      }

      const ry1 = endY + 720;
      const sx = i % 2 ? 360 : -360;
      const sz = i === 1 ? -22 : 16;
      const delay = i * STAGGER;
      maxEnd = Math.max(maxEnd, DUR + delay);

      inner.animate(
        [
          { transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)', easing: 'cubic-bezier(.36,.02,.5,.99)' },
          { transform: `rotateX(${sx * 0.18}deg) rotateY(${120}deg) rotateZ(${sz * 0.4}deg)`, offset: 0.2, easing: 'cubic-bezier(.4,.03,.44,.98)' },
          { transform: `rotateX(${sx * 0.52}deg) rotateY(${320}deg) rotateZ(${sz * 1.05}deg)`, offset: 0.5, easing: 'cubic-bezier(.34,.06,.4,.97)' },
          { transform: `rotateX(${sx * 0.84}deg) rotateY(${560}deg) rotateZ(${sz * 1.25}deg)`, offset: 0.76, easing: 'cubic-bezier(.25,.5,.35,1)' },
          { transform: `rotateX(${sx}deg) rotateY(${ry1 - 26}deg) rotateZ(${sz * 0.3}deg)`, offset: 0.92, easing: 'cubic-bezier(.3,.55,.42,1)' },
          { transform: `rotateX(${sx}deg) rotateY(${ry1}deg) rotateZ(0deg)` },
        ],
        { duration: DUR, delay, fill: 'both' },
      );

      coin.animate(
        [
          { transform: 'translateY(0px)', offset: 0, easing: 'cubic-bezier(.4,0,.7,1)' },
          { transform: 'translateY(12px)', offset: 0.1, easing: 'cubic-bezier(.18,.72,.3,1)' },
          { transform: 'translateY(-78px)', offset: 0.42, easing: 'cubic-bezier(.5,.05,.86,.45)' },
          { transform: 'translateY(-12px)', offset: 0.65, easing: 'cubic-bezier(.3,.55,.36,1)' },
          { transform: 'translateY(5px)', offset: 0.79, easing: 'cubic-bezier(.3,1.45,.5,1)' },
          { transform: 'translateY(-13px)', offset: 0.87, easing: 'cubic-bezier(.4,0,.6,1)' },
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
        if (el) el.style.transform = `rotateY(${endAngle}deg)`;
      };
      const anim = inner.getAnimations()[0];
      if (anim) anim.onfinish = finish(i, endY);
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
      {[0, 1, 2].map((index) => (
        <div key={index} className={styles.slot}>
          <div ref={coinRefs[index]} className={styles.coin}>
            <div ref={innerRefs[index]} className={styles.inner}>
              <span className={`${styles.side} ${styles.front}`}>
                <CoinSvg reign={COIN_REIGNS[index]} back={false} id={`coin-f-${index}`} />
              </span>
              <span className={`${styles.side} ${styles.back}`}>
                <CoinSvg reign={COIN_REIGNS[index]} back id={`coin-b-${index}`} />
              </span>
            </div>
          </div>
          <span ref={shadowRefs[index]} className={styles.shadow} />
        </div>
      ))}
    </div>
  );
}
