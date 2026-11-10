'use client';

import { useEffect, useRef } from 'react';
import styles from './Coin3D.module.css';

export type CoinFace = 0 | 1; // 1 = 背，0 = 字

const DUR = 900;
const STAGGER = 160;

function CoinSvg({ back, id }: { back: boolean; id: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="36%" cy="30%" r="74%">
          <stop offset="0%" stopColor="#f2ddb0" />
          <stop offset="44%" stopColor="#cba55e" />
          <stop offset="100%" stopColor="#87672c" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id})`} stroke="#6d5222" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#7d5f27" strokeWidth="0.9" opacity="0.72" />
      <rect x="36" y="36" width="28" height="28" fill="#241d14" stroke="#6d5222" strokeWidth="1.2" />
      {back ? (
        <>
          <path d="M43 17h5M52 17h5" stroke="#6d5222" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M43 83h5M52 83h5" stroke="#6d5222" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M17 43v5M17 52v5" stroke="#6d5222" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M83 43v5M83 52v5" stroke="#6d5222" strokeWidth="1.7" strokeLinecap="round" />
        </>
      ) : (
        <>
          <text x="50" y="31.5" textAnchor="middle" fontSize="9.5" fill="#5a4116">乾</text>
          <text x="50" y="77.5" textAnchor="middle" fontSize="9.5" fill="#5a4116">隆</text>
          <text x="25" y="54" textAnchor="middle" fontSize="9.5" fill="#5a4116">通</text>
          <text x="75" y="54" textAnchor="middle" fontSize="9.5" fill="#5a4116">宝</text>
        </>
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
          { transform: 'translateY(11px)', offset: 0.11, easing: 'cubic-bezier(.18,.72,.3,1)' },
          { transform: 'translateY(-62px)', offset: 0.43, easing: 'cubic-bezier(.5,.05,.86,.45)' },
          { transform: 'translateY(-9px)', offset: 0.66, easing: 'cubic-bezier(.3,.55,.36,1)' },
          { transform: 'translateY(4px)', offset: 0.79, easing: 'cubic-bezier(.3,1.45,.5,1)' },
          { transform: 'translateY(-11px)', offset: 0.87, easing: 'cubic-bezier(.4,0,.6,1)' },
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
                <CoinSvg back={false} id={`coin-f-${index}`} />
              </span>
              <span className={`${styles.side} ${styles.back}`}>
                <CoinSvg back id={`coin-b-${index}`} />
              </span>
            </div>
          </div>
          <span ref={shadowRefs[index]} className={styles.shadow} />
        </div>
      ))}
    </div>
  );
}
