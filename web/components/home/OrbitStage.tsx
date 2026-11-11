'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import DivinationGlyph from '@/components/icons/DivinationGlyph';
import { getMotion, subscribeMotion, type MotionTier } from '@/lib/motion/governor';

import styles from './OrbitStage.module.css';

const ENTRIES = [
  { href: '/liuyao', name: '六爻', sub: '三枚铜钱，六摇成卦', key: 'liuyao' },
  { href: '/tarot', name: '塔罗', sub: '七十八张，取象会意', key: 'tarot' },
  { href: '/ziwei', name: '紫微', sub: '十二宫位，星曜布列', key: 'ziwei' },
  { href: '/daliuren', name: '六壬', sub: '天地盘立，四课三传', key: 'daliuren' },
  { href: '/almanac', name: '黄历', sub: '宜忌神煞，日辰吉凶', key: 'almanac' },
  { href: '/jiao', name: '杯筊', sub: '一正一反，问之于神', key: 'jiao' },
  { href: '/bazi', name: '八字', sub: '四柱排盘，大运流转', key: 'bazi' },
  { href: '/meihua', name: '梅花', sub: '观物取象，随心起卦', key: 'meihua' },
  { href: '/qimen', name: '奇门', sub: '九宫布局，趋避择时', key: 'qimen' },
] as const;

/** 确定性星点分布，避免 SSR / CSR 随机数不一致 */
const STARS = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37.7 + 6) % 100}%`,
  top: `${(i * 61.3 + 11) % 100}%`,
  size: i % 5 === 0 ? 3 : 2,
  delay: `${(i % 7) * 0.45}s`,
}));

/** 八卦：1 为阳爻，0 为阴爻，自乾起顺时针 */
const GUA = [
  [1, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [1, 0, 0],
  [0, 1, 1],
  [0, 1, 0],
  [0, 0, 1],
  [0, 0, 0],
];

const TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

const OCT_CORNERS = Array.from({ length: 8 }, (_, i) => -90 + i * 45);

/** 以 (150,150) 为心、半径 r 的正八边形顶点串，自正上方起每 45° 取一点 */
function octagon(r: number): string {
  return OCT_CORNERS.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return `${(150 + r * Math.cos(rad)).toFixed(1)},${(150 + r * Math.sin(rad)).toFixed(1)}`;
  }).join(' ');
}

const OCT_OUTER = octagon(141);
const OCT_INNER = octagon(133);

/** 八角罗盘：正八边形双层边框、八角节点、二十四山刻度与八卦爻线环带，中心留空承托太极 */
function CompassDisc() {
  return (
    <svg viewBox="0 0 300 300" className={styles.disc} aria-hidden="true">
      <polygon points={OCT_OUTER} className={styles.discOuter} />
      <polygon points={OCT_INNER} className={styles.discHair} />

      {OCT_CORNERS.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <circle
            key={deg}
            cx={150 + 135 * Math.cos(rad)}
            cy={150 + 135 * Math.sin(rad)}
            r="1.7"
            className={styles.discNode}
          />
        );
      })}

      <circle cx="150" cy="150" r="112" className={styles.discRing} />
      <circle cx="150" cy="150" r="104" className={styles.discDashed} />

      {TICKS.map((deg) => (
        <line
          key={deg}
          x1="150"
          y1="22"
          x2="150"
          y2={deg % 90 === 0 ? '34' : deg % 45 === 0 ? '30' : '27'}
          className={deg % 90 === 0 ? styles.discCardinal : styles.discTick}
          transform={`rotate(${deg} 150 150)`}
        />
      ))}

      {GUA.map((lines, index) => (
        <g key={index} transform={`rotate(${index * 45} 150 150)`}>
          {lines.map((solid, row) => {
            // 环带半径 98：中心 150 - 98 = 52，三条爻线自 y=52 起向下排列
            const y = 52 + row * 6;
            return solid ? (
              <line key={row} x1="139" y1={y} x2="161" y2={y} className={styles.discYao} />
            ) : (
              <g key={row}>
                <line x1="139" y1={y} x2="148" y2={y} className={styles.discYao} />
                <line x1="152" y1={y} x2="161" y2={y} className={styles.discYao} />
              </g>
            );
          })}
        </g>
      ))}

      <circle cx="150" cy="150" r="80" className={styles.discRing} />
    </svg>
  );
}

/** 太极阴阳：墨 / 月白两色由主题变量提供，亮暗模式下都不反转 */
function TaijiSymbol() {
  return (
    <svg viewBox="0 0 200 200" className={`${styles.taiji} motion-heavy`} aria-hidden="true">
      <circle cx="100" cy="100" r="96" fill="var(--c-taiji-yang)" />
      <path d="M100 4 A96 96 0 0 1 100 196 Z" fill="var(--c-taiji-yin)" />
      <circle cx="100" cy="148" r="48" fill="var(--c-taiji-yang)" />
      <circle cx="100" cy="52" r="48" fill="var(--c-taiji-yin)" />
      <circle cx="100" cy="52" r="13" fill="var(--c-taiji-yang)" />
      <circle cx="100" cy="148" r="13" fill="var(--c-taiji-yin)" />
      <circle cx="100" cy="100" r="96" fill="none" stroke="var(--c-taiji-edge)" strokeWidth="1.6" />
      <circle
        cx="100"
        cy="100"
        r="99"
        fill="none"
        stroke="var(--c-taiji-edge)"
        strokeWidth="0.7"
        opacity="0.45"
      />
    </svg>
  );
}

export default function OrbitStage() {
  const [active, setActive] = useState<number | null>(null);
  const [tier, setTier] = useState<MotionTier>('calm');

  useEffect(() => {
    setTier(getMotion().tier);
    return subscribeMotion((next) => setTier(next.tier));
  }, []);

  const current = active === null ? null : ENTRIES[active];

  return (
    <section className={styles.stage} aria-label="九门入象">
      <div className={styles.halo} aria-hidden="true" />

      {tier === 'full' && (
        <div className={styles.stars} aria-hidden="true">
          {STARS.map((star, i) => (
            <span
              key={i}
              className={`${styles.star} motion-particle`}
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* 桌面：环形星图 */}
      <div className={styles.orbit}>
        <div className={styles.discWrap}>
          <div className={`${styles.discSpin} motion-heavy`}>
            <CompassDisc />
          </div>
          <div className={styles.core} aria-live="polite">
            {current ? (
              <span className={styles.coreGlyph}>
                <DivinationGlyph name={current.key} size={88} />
                <span className={styles.srOnly}>{current.name}</span>
              </span>
            ) : (
              <span className={styles.coreTaiji}>
                <TaijiSymbol />
              </span>
            )}
          </div>
        </div>

        {ENTRIES.map((item, index) => {
          const angle = (index * 360) / ENTRIES.length - 90;
          return (
            <div
              key={item.href}
              className={styles.nodeSlot}
              style={{
                transform: `rotate(${angle}deg) translateX(var(--orbit-r)) rotate(${-angle}deg)`,
                animationDelay: `${index * 55}ms`,
              }}
            >
              <Link
                href={item.href}
                className={styles.node}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                aria-label={`${item.name}：${item.sub}`}
              >
                <span className={styles.nodeGlyph}>
                  <DivinationGlyph name={item.key} size={28} />
                </span>
                <span className={styles.nodeName}>{item.name}</span>
                <span className={styles.nodeHint}>{item.sub}</span>
              </Link>
            </div>
          );
        })}
      </div>

      {/* 移动端：退化为卡片网格，保证可读与可点 */}
      <div className={styles.mobileGrid}>
        {ENTRIES.map((item) => (
          <Link key={item.href} href={item.href} className={styles.mobileCard}>
            <span className={styles.mobileGlyph}>
              <DivinationGlyph name={item.key} size={26} />
            </span>
            <span className={styles.mobileBody}>
              <b>{item.name}</b>
              <small>{item.sub}</small>
            </span>
            <span className={styles.mobileArrow} aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
