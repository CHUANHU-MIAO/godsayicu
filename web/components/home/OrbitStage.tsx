'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import LuopanDisc from './LuopanDisc';
import SealChars from './SealChars';
import StageGlyph, { type GlyphName } from './StageGlyph';
import styles from './OrbitStage.module.css';

/**
 * 首页星环。
 *
 * 动效全部由 CSS 过渡驱动，没有引入 GSAP：
 *   环的旋转写在 `--rot` 上一个累计角度，每个 tab 的 transform 用
 *   `rotate(var(--rot) + i*40deg) translateY(-r)` 直接算出来，内层
 *   `.tabRot` 用同一个表达式取负做直立补偿 —— 两者同时变、同时过渡，
 *   文字永远水平，且不需要每帧 JS 参与。
 *   最短弧靠 JS 累计：目标角先折成 [-180,180] 的增量再加到当前角上，
 *   CSS 只负责把数字补间过去（默认会走数值最短路径之外的整圈，所以要自己折）。
 */

const ITEMS: {
  key: GlyphName;
  href: string;
  name: string;
  sub: string;
  tags: string[];
  desc: string;
}[] = [
  {
    key: 'liuyao',
    href: '/liuyao',
    name: '六爻',
    sub: '三枚铜钱 · 六摇成卦',
    tags: ['卦象', '动爻', '世应'],
    desc: '以钱代蓍，六掷成爻。自下而上积爻成卦，观世应之向背、动爻之生克，于当下处境中见事之始终。',
  },
  {
    key: 'tarot',
    href: '/tarot',
    name: '塔罗',
    sub: '七十八张 · 取象会意',
    tags: ['牌阵', '原型', '逆位'],
    desc: '二十二张大牌述人生之原型，五十六张小牌映日常之起伏。以牌阵之位次，照见当下心境与未明之势。',
  },
  {
    key: 'ziwei',
    href: '/ziwei',
    name: '紫微',
    sub: '十二宫位 · 星曜布列',
    tags: ['命宫', '主星', '四化'],
    desc: '以生辰安命宫，布十四主星于十二宫。观三方四正之会照、四化之引动，察一生格局之厚薄与行运之顺逆。',
  },
  {
    key: 'daliuren',
    href: '/daliuren',
    name: '六壬',
    sub: '天地盘立 · 四课三传',
    tags: ['四课', '三传', '神将'],
    desc: '以日辰起天地盘，由四课定三传。事之隐显、人之向背，皆在传之进退与神将之加临之间。',
  },
  {
    key: 'almanac',
    href: '/almanac',
    name: '黄历',
    sub: '宜忌神煞 · 日辰吉凶',
    tags: ['值神', '建除', '宜忌'],
    desc: '依干支历法推日之宜忌，列值神、建除、二十八宿。择日行事，顺天应时，避其冲煞而就其生旺。',
  },
  {
    key: 'jiao',
    href: '/jiao',
    name: '杯筊',
    sub: '一正一反 · 问之于神',
    tags: ['圣杯', '笑杯', '阴杯'],
    desc: '二片竹筊掷地，一俯一仰为圣，双仰为笑，双俯为阴。三掷定夺，以决疑之从违。',
  },
  {
    key: 'bazi',
    href: '/bazi',
    name: '八字',
    sub: '四柱排盘 · 大运流转',
    tags: ['四柱', '日主', '大运'],
    desc: '年月日时各系干支，四柱八字定命之骨架。观日主之强弱、五行之流通，配大运流年，察气运之消长。',
  },
  {
    key: 'meihua',
    href: '/meihua',
    name: '梅花',
    sub: '观物取象 · 随心起卦',
    tags: ['体用', '动爻', '互卦'],
    desc: '以时、以数、以物起卦，取上下卦与动爻。象数相参，断事之机微，最重心领神会之一瞬。',
  },
  {
    key: 'qimen',
    href: '/qimen',
    name: '奇门',
    sub: '九宫布局 · 趋避择时',
    tags: ['九宫', '八门', '三奇'],
    desc: '布三奇六仪于九宫，配八门九星八神。察方位之生克、门星之吉凶，为出行谋事择时择向。',
  },
];

const N = ITEMS.length;
const STEP = 360 / N;
const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const HOLD_MS = 150;

/** 折成 [-180,180)，CSS 过渡才会走最短弧 */
const shortest = (d: number) => (((d + 180) % 360) + 360) % 360 - 180;
const isMobile = () => window.innerWidth <= 900;

export default function OrbitStage() {
  const router = useRouter();

  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [hold, setHold] = useState<number | null>(null);

  const [rot, setRot] = useState(0);
  const [ringMs, setRingMs] = useState(900);
  const [discRot, setDiscRot] = useState(0);
  const [taijiRot, setTaijiRot] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);
  const rotRef = useRef(0);
  const gestures = useRef(false);
  const press = useRef<{ idx: number; x: number; y: number; moved: boolean } | null>(null);
  const holdTimer = useRef<number | null>(null);
  const holding = useRef(false);
  const suppress = useRef(false);
  const swapTimer = useRef<number | null>(null);

  rotRef.current = rot;

  /* 展开时给 body 打标，让页面顶部的日期条、快捷入口、页脚一起淡出。
     用普通类名而不是 CSS Module 的哈希名，page.module.css 才能引用同一个选择器。 */
  useEffect(() => {
    document.body.classList.toggle('stageOpen', active !== null);
    return () => document.body.classList.remove('stageOpen');
  }, [active]);

  useEffect(() => {
    gestures.current =
      window.matchMedia('(max-width:900px)').matches ||
      window.matchMedia('(hover:none) and (pointer:coarse)').matches;

    return () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
      if (swapTimer.current) window.clearTimeout(swapTimer.current);
    };
  }, []);

  const spinTo = useCallback((index: number, dur: number) => {
    setRingMs(dur);
    setRot((cur) => cur + shortest(90 - index * STEP - cur));
  }, []);

  const showPanel = useCallback((index: number, instant: boolean) => {
    if (swapTimer.current) window.clearTimeout(swapTimer.current);
    if (instant) {
      setShown(index);
      setPhase('in');
      return;
    }
    setPhase('out');
    swapTimer.current = window.setTimeout(() => {
      setShown(index);
      setPhase('in');
    }, 170);
  }, []);

  const openDoor = useCallback(
    (index: number) => {
      if (busy.current) return;
      busy.current = true;
      setHold(null);
      setActive(index);
      spinTo(index, 1250);
      showPanel(index, shown === null);

      const g = (90 - index * STEP) * (isMobile() ? 0 : 1);
      setDiscRot(-g * 0.55);
      setTaijiRot(g * 1.2);

      window.setTimeout(() => {
        busy.current = false;
      }, 1300);
    },
    [shown, spinTo, showPanel],
  );

  const close = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setActive(null);
    setHold(null);
    setRingMs(950);
    setRot((cur) => cur + shortest(-cur));
    setDiscRot(0);
    setTaijiRot(0);
    window.setTimeout(() => {
      busy.current = false;
    }, 1000);
  }, []);

  const switchTo = useCallback(
    (index: number) => {
      if (index === active || busy.current || active === null) return;
      const delta = shortest((index - active) * STEP) / STEP;
      setActive(index);
      spinTo(index, 900);
      setDiscRot((cur) => cur + delta * STEP * 0.55);
      setTaijiRot((cur) => cur - delta * STEP * 1.2);
      showPanel(index, false);
    },
    [active, spinTo, showPanel],
  );

  const indexUnderPoint = useCallback((px: number, py: number) => {
    const el = stageRef.current;
    if (!el) return -1;
    const r = el.getBoundingClientRect();
    const a = (Math.atan2(py - (r.top + r.height / 2), px - (r.left + r.width / 2)) * 180) / Math.PI;
    let best = -1;
    let bestD = 1e9;
    for (let i = 0; i < N; i++) {
      const d = Math.abs(((a - (rotRef.current + i * STEP - 90) + 540) % 360) - 180);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return bestD <= 26 ? best : -1;
  }, []);

  /* ---- 触屏：长按放大预览，不撒手沿环滑动切换，抬手不跳转 ---- */
  const onDown = (i: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (active !== null || !gestures.current) return;
    if (e.pointerType === 'mouse' && e.button > 0) return;
    suppress.current = false;
    press.current = { idx: i, x: e.clientX, y: e.clientY, moved: false };
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      const p = press.current;
      if (!p || p.moved) return;
      holding.current = true;
      const k = indexUnderPoint(p.x, p.y);
      setHold(k >= 0 ? k : i);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(12);
        } catch {
          /* 不支持震动的浏览器直接忽略 */
        }
      }
    }, HOLD_MS);
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = press.current;
      if (!p || active !== null) return;
      if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 9) {
        p.moved = true;
        if (holdTimer.current) window.clearTimeout(holdTimer.current);
        holding.current = true;
        const i0 = indexUnderPoint(e.clientX, e.clientY);
        if (i0 >= 0) setHold(i0);
      }
      if (holding.current) {
        const i = indexUnderPoint(e.clientX, e.clientY);
        if (i >= 0) setHold(i);
        if (e.cancelable) e.preventDefault();
      }
    };

    const up = () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
      const was = holding.current;
      holding.current = false;
      if (active !== null) {
        press.current = null;
        return;
      }
      /* 松手不跳转：保留放大态与「进入」按钮，同时吞掉紧跟着的那次 click */
      if (was) suppress.current = true;
      else setHold(null);
      press.current = null;
    };

    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [active, indexUnderPoint]);

  const onTabClick = (i: number) => {
    if (suppress.current) {
      suppress.current = false;
      return;
    }
    if (hold !== null) {
      openDoor(hold);
      return;
    }
    if (active !== null) switchTo(i);
    else openDoor(i);
  };

  /* ---- 键盘与空白处 ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (active !== null) close();
        else if (hold !== null) setHold(null);
        return;
      }
      if (active === null) return;
      if (e.key === 'ArrowRight') switchTo((active + 1) % N);
      if (e.key === 'ArrowLeft') switchTo((active - 1 + N) % N);
    };
    const onBlank = (e: PointerEvent) => {
      if (hold === null || active !== null) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('[data-tab]')) return;
      setHold(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onBlank);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onBlank);
    };
  }, [active, hold, close, switchTo]);

  const isOpen = active !== null;
  const item = shown === null ? null : ITEMS[shown];
  const prev = shown === null ? 0 : (shown - 1 + N) % N;
  const next = shown === null ? 0 : (shown + 1) % N;

  const stateOf = (i: number) => {
    if (!isOpen) return 'idle';
    if (i === active) return 'active';
    if (i === (active! - 1 + N) % N || i === (active! + 1) % N) return 'near';
    return 'far';
  };

  return (
    <>
      <SealChars open={isOpen} />

      <div
        ref={stageRef}
        className={styles.stage}
        data-open={isOpen ? 'true' : 'false'}
        aria-label="九门入象"
      >
        <div
          className={styles.discWrap}
          style={{ '--disc-rot': `${discRot}deg` } as CSSProperties}
          aria-hidden="true"
        >
          <div className={styles.luopanSpin}>
            <LuopanDisc />
          </div>
        </div>

        <div
          className={styles.taijiWrap}
          style={{ '--taiji-rot': `${taijiRot}deg` } as CSSProperties}
          aria-hidden="true"
        >
          <div className={styles.taijiSpin}>
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="96" fill="var(--c-taiji-yang)" />
              <path d="M100 4 A96 96 0 0 1 100 196 Z" fill="var(--c-taiji-yin)" />
              <circle cx="100" cy="148" r="48" fill="var(--c-taiji-yang)" />
              <circle cx="100" cy="52" r="48" fill="var(--c-taiji-yin)" />
              <circle cx="100" cy="52" r="13" fill="var(--c-taiji-yang)" />
              <circle cx="100" cy="148" r="13" fill="var(--c-taiji-yin)" />
              <circle cx="100" cy="100" r="96" fill="none" stroke="var(--c-taiji-edge)" strokeWidth="1.6" />
            </svg>
          </div>
        </div>

        <div
          className={styles.ring}
          style={{ '--rot': `${rot}deg`, '--ring-ms': `${ringMs}ms` } as CSSProperties}
        >
          {ITEMS.map((entry, i) => {
            const st = stateOf(i);
            return (
              <button
                key={entry.key}
                type="button"
                data-tab=""
                data-state={st}
                data-index={i}
                className={styles.tab}
                style={{ '--i': i } as CSSProperties}
                tabIndex={st === 'far' ? -1 : 0}
                aria-hidden={st === 'far' ? true : undefined}
                aria-label={`${entry.name}：${entry.sub}`}
                onPointerDown={(e) => onDown(i, e)}
                onClick={() => onTabClick(i)}
              >
                <span className={styles.tabRot}>
                  <span className={styles.tabBody}>
                    <span className={styles.tabDisc}>
                      <StageGlyph name={entry.key} size={38} keepStroke />
                    </span>
                    <span className={styles.tabLabel}>{entry.name}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <aside className={styles.panel} data-open={isOpen ? 'true' : 'false'} aria-live="polite">
        <div className={styles.panelGhost} aria-hidden="true">
          {item && <StageGlyph name={item.key} size={320} keepStroke />}
        </div>
        <div className={styles.panelInner}>
          <div className={styles.panelBody} data-phase={phase}>
            {item && shown !== null && (
              <div key={shown} className={styles.panelStack}>
                <div className={styles.panelMark}>
                  <StageGlyph name={item.key} size={46} />
                </div>
                <div className={styles.eyebrow}>
                  九门 · {CN[shown]} / 九
                </div>
                <h2 className={styles.panelName}>{item.name}</h2>
                <p className={styles.panelSub}>{item.sub}</p>
                <p className={styles.panelDesc}>{item.desc}</p>
                <div className={styles.panelTags}>
                  {item.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className={styles.panelNav}>
                  <button
                    type="button"
                    className={`${styles.navCard} ${styles.enterCard}`}
                    onClick={() => router.push(item.href)}
                  >
                    <StageGlyph name={item.key} size={22} />
                    <span>
                      <em>{item.name}</em>
                      <b>进入此门</b>
                    </span>
                    <span className={styles.cardArrow}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </button>
                  {[
                    { i: prev, label: '上一门' },
                    { i: next, label: '下一门' },
                  ].map((spec) => (
                    <button
                      key={spec.label}
                      type="button"
                      className={styles.navCard}
                      onClick={() => switchTo(spec.i)}
                    >
                      <StageGlyph name={ITEMS[spec.i].key} size={22} />
                      <span>
                        <em>{spec.label}</em>
                        <b>{ITEMS[spec.i].name}</b>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <button
        type="button"
        className={styles.backBtn}
        data-open={isOpen ? 'true' : 'false'}
        onClick={close}
        aria-label="返回星环视图"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span>星环</span>
      </button>

      <button
        type="button"
        className={styles.enterBtn}
        data-show={hold !== null ? 'true' : 'false'}
        tabIndex={hold === null ? -1 : 0}
        onClick={() => {
          if (hold !== null) openDoor(hold);
        }}
      >
        <span>进入 · {hold === null ? '—' : ITEMS[hold].name}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </>
  );
}
