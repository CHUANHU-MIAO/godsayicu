'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import Link from 'next/link';

import {
  getAppearance,
  initAppearance,
  setAppearance,
  subscribeAppearance,
  type AppearanceChoice,
  type AppearanceState,
} from '@/lib/theme/appearance';
import {
  getMotion,
  refreshMotion,
  setMotionChoice,
  subscribeMotion,
  type MotionChoice,
  type MotionState,
} from '@/lib/motion/governor';

import styles from './lab.module.css';

type ThemeKey = 'xuanjin' | 'cangbi' | 'zhuxuan';
type LayoutKey = 'grid' | 'editorial' | 'orbit';

interface ThemeDef {
  key: ThemeKey;
  name: string;
  en: string;
  desc: string;
  vars: Record<string, string>;
  lightVars: Record<string, string>;
  pairs: { label: string; fg: string; bg: string }[];
  lightPairs: { label: string; fg: string; bg: string }[];
}

const THEMES: ThemeDef[] = [
  {
    key: 'xuanjin',
    name: '玄金',
    en: 'BASELINE / WARM CHARCOAL',
    desc: '早期基线。暖炭黑、月纸白、金、朱砂。气质沉稳，但层次偏平、缺少冷光纵深，现仅作对照。',
    vars: {
      '--lab-bg': '#0b0b0a', '--lab-bg-2': '#111110', '--lab-surface': '#151513',
      '--lab-surface-2': '#1a1a17', '--lab-text': '#f4efe5', '--lab-text-2': '#d6d0c3',
      '--lab-text-3': '#a9a294', '--lab-accent': '#d4b478', '--lab-accent-2': '#d4553c',
      '--lab-line': '#332f28', '--lab-line-2': '#4a4338',
      '--lab-glow': 'rgba(212, 180, 120, 0.10)', '--lab-glow-2': 'rgba(212, 85, 60, 0.06)',
    },
    lightVars: {
      '--lab-bg': '#f7f3ec', '--lab-bg-2': '#eee8df', '--lab-surface': '#fffdf8',
      '--lab-surface-2': '#f1ebe1', '--lab-text': '#241d15', '--lab-text-2': '#453a2d',
      '--lab-text-3': '#5c4c39', '--lab-accent': '#8a6524', '--lab-accent-2': '#a63f28',
      '--lab-line': '#ded3c1', '--lab-line-2': '#bfae96',
      '--lab-glow': 'rgba(138, 101, 36, 0.08)', '--lab-glow-2': 'rgba(166, 63, 40, 0.05)',
    },
    pairs: [
      { label: '正文 / 背景', fg: '#d6d0c3', bg: '#0b0b0a' },
      { label: '次要 / 表面', fg: '#a9a294', bg: '#151513' },
      { label: '强调 / 背景', fg: '#d4b478', bg: '#0b0b0a' },
    ],
    lightPairs: [
      { label: '正文 / 背景', fg: '#453a2d', bg: '#f7f3ec' },
      { label: '次要 / 表面', fg: '#5c4c39', bg: '#fffdf8' },
      { label: '强调 / 背景', fg: '#8a6524', bg: '#f7f3ec' },
    ],
  },
  {
    key: 'cangbi',
    name: '苍璧',
    en: 'ALTERNATIVE / DEEP INDIGO',
    desc: '深靛蓝底叠冷光，冰蓝为主、月金点睛。科技感与神秘感并存，冷底把金字衬得更亮，长时间阅读不刺眼。',
    vars: {
      '--lab-bg': '#060b14', '--lab-bg-2': '#0a1422', '--lab-surface': '#0e1b2c',
      '--lab-surface-2': '#142438', '--lab-text': '#eef4fb', '--lab-text-2': '#c9d7e6',
      '--lab-text-3': '#93aac2', '--lab-accent': '#7fb2ff', '--lab-accent-2': '#e8c88f',
      '--lab-line': '#24384f', '--lab-line-2': '#375374',
      '--lab-glow': 'rgba(90, 150, 255, 0.16)', '--lab-glow-2': 'rgba(232, 200, 143, 0.07)',
    },
    lightVars: {
      '--lab-bg': '#f2f6fc', '--lab-bg-2': '#e6eef8', '--lab-surface': '#ffffff',
      '--lab-surface-2': '#e9f1fb', '--lab-text': '#101c2c', '--lab-text-2': '#2c4059',
      '--lab-text-3': '#405775', '--lab-accent': '#1c5fb0', '--lab-accent-2': '#8a6524',
      '--lab-line': '#cbd9ea', '--lab-line-2': '#a6bcd6',
      '--lab-glow': 'rgba(28, 95, 176, 0.09)', '--lab-glow-2': 'rgba(138, 101, 36, 0.05)',
    },
    pairs: [
      { label: '正文 / 背景', fg: '#c9d7e6', bg: '#060b14' },
      { label: '次要 / 表面', fg: '#93aac2', bg: '#0e1b2c' },
      { label: '强调 / 背景', fg: '#e8c88f', bg: '#060b14' },
    ],
    lightPairs: [
      { label: '正文 / 背景', fg: '#2c4059', bg: '#f2f6fc' },
      { label: '次要 / 表面', fg: '#405775', bg: '#ffffff' },
      { label: '强调 / 背景', fg: '#1c5fb0', bg: '#f2f6fc' },
    ],
  },
  {
    key: 'zhuxuan',
    name: '朱玄',
    en: 'SELECTED / CINNABAR NOIR',
    desc: '已选定并落地正式站。墨夜底压朱砂、青玉作辅，庄重而有仪式感；朱砂只作点睛，不铺大面积。对应亮色为「月纸」，墨字深朱，保持同等对比度。',
    vars: {
      '--lab-bg': '#0a0809', '--lab-bg-2': '#130f11', '--lab-surface': '#181214',
      '--lab-surface-2': '#201719', '--lab-text': '#f7f0ec', '--lab-text-2': '#ddd0c8',
      '--lab-text-3': '#b09d95', '--lab-accent': '#e0684f', '--lab-accent-2': '#9fb8ae',
      '--lab-line': '#3a2a28', '--lab-line-2': '#574039',
      '--lab-glow': 'rgba(224, 104, 79, 0.13)', '--lab-glow-2': 'rgba(159, 184, 174, 0.06)',
    },
    lightVars: {
      '--lab-bg': '#f7f3ee', '--lab-bg-2': '#efe8e0', '--lab-surface': '#fffdfa',
      '--lab-surface-2': '#f2ebe3', '--lab-text': '#221a17', '--lab-text-2': '#3f312b',
      '--lab-text-3': '#5a473f', '--lab-accent': '#b23f28', '--lab-accent-2': '#3f6f63',
      '--lab-line': '#ddd0c2', '--lab-line-2': '#bda99a',
      '--lab-glow': 'rgba(178, 63, 40, 0.09)', '--lab-glow-2': 'rgba(63, 111, 99, 0.05)',
    },
    pairs: [
      { label: '正文 / 背景', fg: '#ddd0c8', bg: '#0a0809' },
      { label: '次要 / 表面', fg: '#b09d95', bg: '#181214' },
      { label: '强调 / 背景', fg: '#e0684f', bg: '#0a0809' },
    ],
    lightPairs: [
      { label: '正文 / 背景', fg: '#3f312b', bg: '#f7f3ee' },
      { label: '次要 / 表面', fg: '#5a473f', bg: '#fffdfa' },
      { label: '强调 / 背景', fg: '#b23f28', bg: '#f7f3ee' },
    ],
  },
];

const LAYOUTS: { key: LayoutKey; name: string; desc: string; tags: string[] }[] = [
  {
    key: 'grid',
    name: '九宫 · 旧版',
    desc: '3×3 等权卡片，一眼看全九个入口。信息效率高，但节奏均匀、缺少主次，是「工具页」而非「作品」。',
    tags: ['信息效率最高', '零改造成本', '缺叙事'],
  },
  {
    key: 'editorial',
    name: '卷轴 · 编辑式',
    desc: '超大标题占左，纵向清单占右，故意打破对称留出大片负空间。参考 2026 获奖站的档案索引与破格编排。',
    tags: ['留白即奢华', '字重强对比', '滚动叙事'],
  },
  {
    key: 'orbit',
    name: '星图 · 沉浸式',
    desc: '已选定并落地正式首页。中央观象盘（纯 SVG 自绘：刻度、八卦爻线）+ 九个入口环绕，悬停联动中央说明。零 3D 依赖，≤900px 自动退化为卡片网格。',
    tags: ['已落地', '零 3D 依赖', '移动端退化网格'],
  },
];

const LIBRARIES = [
  { name: '原生 CSS + Web Animations', size: '0 KB', role: '滚动揭示、SVG 描边、悬停、卷轴展开', verdict: '已采用', note: '跑在合成线程，零 JS；正式站星图与测试页动效全部由它实现' },
  { name: '性能自适应治理（自研）', size: '约 2 KB', role: '按设备能力输出 off / calm / full 三档', verdict: '已采用', note: 'CPU、内存、网络、像素比 + 真实 rAF 帧率采样；低档不绑定监听、不渲染粒子' },
  { name: 'Motion（原 Framer Motion）', size: '2.6–18 KB', role: '组件入场/退出、layout 动画、页面转场', verdict: '后续', note: 'React 声明式，自动尊重 prefers-reduced-motion；结果页分段展开时再引' },
  { name: 'GSAP + ScrollTrigger', size: '约 23–31 KB', role: '长篇滚动叙事、pin 住场景', verdict: '暂缓', note: '星图已用原生实现，无需为单个首页引入时间线引擎' },
  { name: 'Lenis', size: '约 3 KB', role: '惯性平滑滚动', verdict: '暂缓', note: '会改变全站手感，且影响低端机滚动性能' },
  { name: 'Anime.js v4', size: '约 13 KB', role: 'SVG 变形、文字分裂', verdict: '不引入', note: 'stroke-dasharray 与逐字 stagger 已用原生覆盖' },
  { name: 'Three.js / R3F', size: '约 155 KB gzip', role: '3D 星图、粒子场', verdict: '已规避', note: '星图改用 SVG + CSS 达成同等观感，省下 155 KB 与 GPU 开销' },
  { name: 'React Bits / Magic UI', size: '复制粘贴', role: '现成特效组件', verdict: '只借鉴', note: '闭源商用需逐个审许可，不直接引依赖' },
];

const APPEARANCE_OPTIONS: { key: AppearanceChoice; label: string }[] = [
  { key: 'light', label: '亮 色' },
  { key: 'dark', label: '暗 色' },
  { key: 'system', label: '跟随系统' },
];

const MOTION_OPTIONS: { key: MotionChoice; label: string }[] = [
  { key: 'auto', label: '自 动' },
  { key: 'off', label: '静 态' },
  { key: 'calm', label: '克 制' },
  { key: 'full', label: '完 整' },
];

const TIER_LABEL: Record<string, string> = { off: '静态', calm: '克制', full: '完整' };

function srgb(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const n = parseInt(full, 16);
  return 0.2126 * srgb((n >> 16) & 255) + 0.7152 * srgb((n >> 8) & 255) + 0.0722 * srgb(n & 255);
}

function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function SectionHead({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className={styles.sectionHead} data-reveal>
      <span className={styles.sectionNo}>{n}</span>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionSub}>{sub}</p>
      </div>
    </div>
  );
}

export default function LabPage() {
  const [theme, setTheme] = useState<ThemeKey>('zhuxuan');
  const [layout, setLayout] = useState<LayoutKey>('orbit');
  const [appearance, setAppearanceState] = useState<AppearanceState>({ choice: 'system', resolved: 'dark' });
  const [motion, setMotionState] = useState<MotionState>({
    choice: 'auto', tier: 'calm', report: null, probing: false,
  });
  const [replay, setReplay] = useState(0);
  const parallaxRef = useRef<HTMLDivElement | null>(null);

  const activeTheme = THEMES.find((item) => item.key === theme) ?? THEMES[2];
  const activeLayout = LAYOUTS.find((item) => item.key === layout) ?? LAYOUTS[2];
  const isLight = appearance.resolved === 'light';
  const activeVars = isLight ? activeTheme.lightVars : activeTheme.vars;
  const activePairs = isLight ? activeTheme.lightPairs : activeTheme.pairs;

  const ratios = useMemo(
    () => activePairs.map((pair) => ({ ...pair, value: contrastRatio(pair.fg, pair.bg) })),
    [activePairs],
  );

  useEffect(() => {
    initAppearance();
    setAppearanceState(getAppearance());
    return subscribeAppearance(setAppearanceState);
  }, []);

  useEffect(() => {
    setMotionState(getMotion());
    return subscribeMotion(setMotionState);
  }, []);

  // 进入视口渐显：低档位降级为一次性直接显示，不产生持续动画
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window) || motion.tier === 'off') {
      nodes.forEach((node) => node.classList.add(styles.revealed));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [motion.tier]);

  // 视差：仅「完整」档绑定滚动监听，低档完全不挂监听器
  useEffect(() => {
    if (motion.tier !== 'full') return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 700);
        parallaxRef.current?.style.setProperty('--parallax-y', `${y * 0.18}px`);
        frame = 0;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [motion.tier]);

  function handleTilt(event: MouseEvent<HTMLDivElement>) {
    if (motion.tier !== 'full') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty('--tilt-x', `${(-y * 9).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${(x * 9).toFixed(2)}deg`);
  }

  function resetTilt(event: MouseEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  }

  const report = motion.report;

  return (
    <main
      className={styles.lab}
      style={activeVars as CSSProperties}
      data-motion={motion.tier}
      data-layout={layout}
      data-appearance={appearance.resolved}
    >
      <div className={styles.aurora} ref={parallaxRef} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>← 返回正式站</Link>
        <span className={styles.badge}>方案台 · 正式站已按朱玄 + 星图落地</span>
        <Link href="/history" className={styles.navLink}>问事录 →</Link>
      </nav>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>DESIGN LAB · 2026 / SELECTED PROPOSAL</p>
        <h1 className={styles.display}>
          <span>观</span><span>象</span>
          <span className={styles.displayDot}>·</span>
          <span>问</span><span>天</span>
        </h1>
        <p className={styles.tagline}>观象以知变，问天而察机</p>
        <p className={styles.heroNote}>
          已选定朱玄配色与星图布局，并加入亮暗切换与性能自适应动效。下方保留三套色谱、三种布局与动效库对照，可实时切换验证。
        </p>
        <div className={styles.scrollHint} aria-hidden="true"><span>向 下 展 开</span><i /></div>
      </header>

      <section className={styles.section} id="palette">
        <SectionHead n="01" title="色谱与外观" sub="Color system · 朱玄为选定暗色，配套「月纸」亮色；三态切换全站生效" />

        <div className={styles.appearanceBar} data-reveal>
          <span className={styles.appearanceLabel}>外 观</span>
          <div className={styles.appearanceSwitch}>
            {APPEARANCE_OPTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.motionBtn} ${appearance.choice === item.key ? styles.motionOn : ''}`}
                onClick={() => setAppearance(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className={styles.appearanceNote}>
            当前 {isLight ? '亮色' : '暗色'}
            {appearance.choice === 'system' ? '（跟随系统偏好）' : ''} · 全站右下角按钮亦可切换
          </span>
        </div>

        <div className={styles.switcher} data-reveal>
          {THEMES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.switchBtn} ${theme === item.key ? styles.switchOn : ''}`}
              onClick={() => setTheme(item.key)}
            >
              <span
                className={styles.swatchMini}
                style={{ background: (isLight ? item.lightVars : item.vars)['--lab-accent'] }}
              />
              <span>
                <strong>{item.name}{item.key === 'zhuxuan' ? ' · 已选' : ''}</strong>
                <small>{item.en}</small>
              </span>
            </button>
          ))}
        </div>

        <div className={styles.paletteGrid} data-reveal>
          <div className={styles.palettePanel}>
            <p className={styles.panelLabel}>色 板 / {activeTheme.name} · {isLight ? '亮色' : '暗色'}</p>
            <div className={styles.swatches}>
              {[
                ['底色', '--lab-bg'], ['次底', '--lab-bg-2'], ['表面', '--lab-surface'],
                ['浮层', '--lab-surface-2'], ['主文', '--lab-text'], ['正文', '--lab-text-2'],
                ['次要', '--lab-text-3'], ['强调', '--lab-accent'], ['点睛', '--lab-accent-2'],
                ['描边', '--lab-line'],
              ].map(([label, key]) => (
                <div className={styles.swatch} key={key}>
                  <span style={{ background: activeVars[key] }} />
                  <b>{label}</b>
                  <code>{activeVars[key]?.startsWith('#') ? activeVars[key] : '光晕'}</code>
                </div>
              ))}
            </div>
            <p className={styles.themeDesc}>{activeTheme.desc}</p>
          </div>

          <div className={styles.contrastPanel}>
            <p className={styles.panelLabel}>可 读 性 / WCAG · {isLight ? '亮色' : '暗色'}</p>
            {ratios.map((pair) => (
              <div className={styles.contrastRow} key={pair.label}>
                <span>{pair.label}</span>
                <b>{pair.value.toFixed(2)} : 1</b>
                <em className={pair.value >= 7 ? styles.pass : pair.value >= 4.5 ? styles.warn : styles.fail}>
                  {pair.value >= 7 ? 'AAA' : pair.value >= 4.5 ? 'AA' : '不足'}
                </em>
              </div>
            ))}
            <p className={styles.contrastNote}>
              正文以 7:1 为硬线，亮暗两套都按高对比设计，绝不靠降低透明度做「高级感」。
            </p>

            <div className={styles.sample}>
              <p className={styles.sampleTitle}>实际排版取样</p>
              <h3 className={styles.sampleH3}>水火既济 · 初吉终乱</h3>
              <p className={styles.sampleBody}>
                六爻皆正，事已成而防其变。正文用无衬线，标题与卦名保留衬线，形成轻重对比。
              </p>
              <div className={styles.sampleActions}>
                <button type="button" className={styles.primaryBtn}>起 一 卦</button>
                <button type="button" className={styles.ghostBtn}>查看解读</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="layout">
        <SectionHead n="02" title="布局" sub="Layout system · 星图已落地正式首页，切换可对照结构差异" />

        <div className={styles.switcher} data-reveal>
          {LAYOUTS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.switchBtn} ${layout === item.key ? styles.switchOn : ''}`}
              onClick={() => setLayout(item.key)}
            >
              <span className={styles.layoutMini} data-mini={item.key} aria-hidden="true">
                <i /><i /><i /><i /><i /><i /><i /><i /><i />
              </span>
              <span>
                <strong>{item.name}</strong>
                <small>LAYOUT</small>
              </span>
            </button>
          ))}
        </div>

        <div className={styles.preview} data-reveal>
          <div className={styles.previewTop}>
            <span className={styles.previewDot} /><span className={styles.previewDot} /><span className={styles.previewDot} />
            <code>wentian / {layout}</code>
          </div>
          <div className={styles.wire} key={layout}>
            {layout === 'grid' && (
              <div className={styles.wireGrid}>
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className={styles.wireCell}><i /><b /></span>
                ))}
              </div>
            )}
            {layout === 'editorial' && (
              <div className={styles.wireEditorial}>
                <div className={styles.wireBig}><i /><i /><i /></div>
                <div className={styles.wireList}>
                  {Array.from({ length: 6 }, (_, i) => <span key={i}><i /><b /></span>)}
                </div>
              </div>
            )}
            {layout === 'orbit' && (
              <div className={styles.wireOrbit}>
                <div className={styles.wireCore} />
                {Array.from({ length: 9 }, (_, i) => (
                  <span
                    key={i}
                    className={styles.wireNode}
                    style={{ transform: `rotate(${(i * 360) / 9 - 90}deg) translateY(-96px) rotate(${-((i * 360) / 9 - 90)}deg)` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.layoutDesc} data-reveal>
          <h3 className={styles.layoutName}>{activeLayout.name}</h3>
          <p>{activeLayout.desc}</p>
          <div className={styles.tags}>
            {activeLayout.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <Link href="/" className={styles.layoutLink}>查看正式首页星图实景 →</Link>
        </div>
      </section>

      <section className={styles.section} id="motion">
        <SectionHead n="03" title="动效与性能自适应" sub="Motion system · 打开页面即探测设备，低性能机器自动降级，不卡顿" />

        <div className={styles.perfPanel} data-reveal>
          <div className={styles.perfHead}>
            <div>
              <p className={styles.panelLabel}>性 能 治 理 / AUTO GOVERNOR</p>
              <p className={styles.perfLead}>
                综合 CPU 核数、内存、网络、像素比与一次真实帧率采样，自动选择档位。低档不绑定滚动/鼠标监听、不渲染粒子层、关闭无限循环动画。
              </p>
            </div>
            <span className={styles.perfTier} data-tier={motion.tier}>
              {motion.probing ? '检测中…' : `当前 · ${TIER_LABEL[motion.tier]}`}
            </span>
          </div>

          <div className={styles.motionBar}>
            <div className={styles.motionSwitch}>
              {MOTION_OPTIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.motionBtn} ${motion.choice === item.key ? styles.motionOn : ''}`}
                  onClick={() => setMotionChoice(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.replayBtn}
              onClick={() => {
                if (motion.choice !== 'auto') setMotionChoice('auto');
                else refreshMotion();
                setReplay((n) => n + 1);
              }}
            >
              ↻ 重新检测并重播
            </button>
          </div>

          <div className={styles.perfGrid}>
            {[
              ['CPU', report ? `${report.cores} 核` : '—'],
              ['内存', report?.memoryGb ? `${report.memoryGb} GB` : '未公开'],
              ['网络', report?.effectiveType ?? '—'],
              ['设备', report ? (report.mobile ? '触屏 / 小屏' : '桌面') : '—'],
              ['像素比', report ? report.dpr.toFixed(1) : '—'],
              ['实测帧率', report?.fps ? `${report.fps} FPS` : '采样中'],
              ['综合评分', report ? `${report.score} 分` : '—'],
            ].map(([label, value]) => (
              <div className={styles.perfItem} key={label}>
                <span>{label}</span><b>{value}</b>
              </div>
            ))}
          </div>

          {report && (
            <ul className={styles.perfReasons}>
              {report.reasons.map((reason) => <li key={reason}>{reason}</li>)}
              {report.reducedMotion && <li>系统已开启「减少动态效果」，强制静态且不可手动覆盖</li>}
            </ul>
          )}
          <p className={styles.perfFoot}>
            自动档为默认；手动选择会记住偏好。系统「减少动态效果」始终优先，任何档位下页面内容都完整可读。
          </p>
        </div>

        <div className={styles.demoGrid}>
          <article className={styles.demo} data-reveal>
            <header><span>01</span><h3>滚动揭示</h3></header>
            <p className={styles.demoDesc}>进入视口才渐显，IntersectionObserver 只切类名，位移由合成线程承担。</p>
            <div className={styles.demoStage} key={`reveal-${replay}`}>
              <span className={styles.revealBox}>观</span>
              <span className={styles.revealBox} style={{ animationDelay: '120ms' }}>象</span>
              <span className={styles.revealBox} style={{ animationDelay: '240ms' }}>知</span>
              <span className={styles.revealBox} style={{ animationDelay: '360ms' }}>变</span>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>02</span><h3>笔画书写</h3></header>
            <p className={styles.demoDesc}>SVG stroke-dasharray 逐笔写出卦爻，比淡入更贴合书写与卷轴的意象。</p>
            <div className={styles.demoStage} key={`stroke-${replay}`}>
              <svg viewBox="0 0 160 96" className={styles.strokeSvg} aria-hidden="true">
                <path className={styles.strokeLine} d="M20 18 H140" style={{ animationDelay: '0ms' }} />
                <path className={styles.strokeLine} d="M20 48 H62 M98 48 H140" style={{ animationDelay: '260ms' }} />
                <path className={styles.strokeLine} d="M20 78 H140" style={{ animationDelay: '400ms' }} />
              </svg>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>03</span><h3>卷轴展开</h3></header>
            <p className={styles.demoDesc}>从中心向两侧徐徐展开，对应「展卷」而非「弹窗」。</p>
            <div className={styles.demoStage} key={`scroll-${replay}`}>
              <div className={styles.scrollOpen}><span>天 地 定位 · 山 泽 通 气</span></div>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>04</span><h3>磁吸倾斜</h3></header>
            <p className={styles.demoDesc}>光标位置驱动 rotateX/Y，只改 transform；仅「完整」档绑定监听。</p>
            <div className={styles.demoStage}>
              <div className={styles.tiltCard} onMouseMove={handleTilt} onMouseLeave={resetTilt}>
                <span className={styles.tiltGlyph}>☯</span><b>移动光标试试</b>
              </div>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>05</span><h3>光泽扫过</h3></header>
            <p className={styles.demoDesc}>悬停时一道极窄高光掠过按钮，作为「可点」的确认反馈，不闪烁。</p>
            <div className={styles.demoStage}>
              <button type="button" className={styles.shineBtn}><span>掷 筊 问 事</span></button>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>06</span><h3>逐字揭示</h3></header>
            <p className={styles.demoDesc}>标题按字错峰 55ms，总时长控制在 300ms 内，符合高端站的克制节奏。</p>
            <div className={styles.demoStage} key={`chars-${replay}`}>
              <p className={styles.charLine}>
                {'一阴一阳之谓道'.split('').map((char, i) => (
                  <span key={i} style={{ animationDelay: `${i * 55}ms` }}>{char}</span>
                ))}
              </p>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>07</span><h3>视差层叠</h3></header>
            <p className={styles.demoDesc}>背景光晕以 0.18 倍速随滚动位移；仅「完整」档注册滚动监听。</p>
            <div className={styles.demoStage}>
              <div className={styles.parallaxDemo}><i /><i /><i /><span>近 · 中 · 远</span></div>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>08</span><h3>呼吸光晕</h3></header>
            <p className={styles.demoDesc}>9 秒周期的极缓明灭，幅度很小。不做脉冲、不做持续旋转。</p>
            <div className={styles.demoStage}><div className={styles.breath}><span>静</span></div></div>
          </article>
        </div>
      </section>

      <section className={styles.section} id="stack">
        <SectionHead n="04" title="选型与落地" sub="Library & rollout · 不堆库，按职责分层引入" />

        <div className={styles.tableWrap} data-reveal>
          <table className={styles.table}>
            <thead><tr><th>工具</th><th>体积</th><th>职责</th><th>结论</th></tr></thead>
            <tbody>
              {LIBRARIES.map((lib) => (
                <tr key={lib.name}>
                  <td><b>{lib.name}</b><small>{lib.note}</small></td>
                  <td><code>{lib.size}</code></td>
                  <td>{lib.role}</td>
                  <td><span className={styles.verdict}>{lib.verdict}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.rollout} data-reveal>
          <div className={styles.rolloutStep}>
            <b>已完成 · 主题体系</b>
            <p>朱玄暗色 + 月纸亮色两套 token，亮/暗/跟随系统三态，首屏脚本同步应用避免闪烁，偏好持久化。</p>
          </div>
          <div className={styles.rolloutStep}>
            <b>已完成 · 性能治理</b>
            <p>设备探测 + 真实帧率采样输出三档，低档断开监听器与重型图层，系统减少动效优先。</p>
          </div>
          <div className={styles.rolloutStep}>
            <b>已完成 · 星图首页</b>
            <p>纯 SVG 观象盘 + 九门环绕，零 3D 依赖；移动端自动退化网格，键盘与读屏可用。</p>
          </div>
        </div>

        <div className={styles.rules} data-reveal>
          <h3>不可越线的四条</h3>
          <ol>
            <li>只动 <code>transform</code> 与 <code>opacity</code>，不碰 width / height / top / left。</li>
            <li>文字类动效 150–300ms，禁止超过 400ms、禁止持续旋转与闪烁。</li>
            <li>正文对比度 ≥ 7:1，<code>prefers-reduced-motion</code> 全量降级为静态。</li>
            <li>动效必须引导、确认或叙事——关掉动效页面依然完整可读。</li>
          </ol>
        </div>
      </section>

      <footer className={styles.footer} data-reveal>
        <p>朱玄 + 星图已落地正式站；此页保留方案对照、外观切换与性能诊断。</p>
        <div className={styles.footerLinks}>
          <Link href="/">返回首页</Link>
          <Link href="/history">查看问事录</Link>
        </div>
      </footer>
    </main>
  );
}
