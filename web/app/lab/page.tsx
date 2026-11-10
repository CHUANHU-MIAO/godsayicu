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

import styles from './lab.module.css';

type ThemeKey = 'xuanjin' | 'cangbi' | 'zhuxuan';
type LayoutKey = 'grid' | 'editorial' | 'orbit';
type MotionLevel = 'off' | 'calm' | 'full';

interface ThemeDef {
  key: ThemeKey;
  name: string;
  en: string;
  desc: string;
  vars: Record<string, string>;
  pairs: { label: string; fg: string; bg: string }[];
}

const THEMES: ThemeDef[] = [
  {
    key: 'xuanjin',
    name: '玄金',
    en: 'CURRENT / WARM CHARCOAL',
    desc: '现版基线。暖炭黑、月纸白、金、朱砂。气质沉稳，但层次偏平、缺少冷光纵深。',
    vars: {
      '--lab-bg': '#0b0b0a',
      '--lab-bg-2': '#111110',
      '--lab-surface': '#151513',
      '--lab-surface-2': '#1a1a17',
      '--lab-text': '#f4efe5',
      '--lab-text-2': '#d6d0c3',
      '--lab-text-3': '#a9a294',
      '--lab-accent': '#d4b478',
      '--lab-accent-2': '#d4553c',
      '--lab-line': '#332f28',
      '--lab-line-2': '#4a4338',
      '--lab-glow': 'rgba(212, 180, 120, 0.10)',
      '--lab-glow-2': 'rgba(212, 85, 60, 0.06)',
    },
    pairs: [
      { label: '正文 / 背景', fg: '#d6d0c3', bg: '#0b0b0a' },
      { label: '次要 / 表面', fg: '#a9a294', bg: '#151513' },
      { label: '强调 / 背景', fg: '#d4b478', bg: '#0b0b0a' },
    ],
  },
  {
    key: 'cangbi',
    name: '苍璧',
    en: 'PROPOSED / DEEP INDIGO',
    desc: '推荐。深靛蓝底叠冷光，冰蓝为主、月金点睛。科技感与神秘感并存，冷底把金字衬得更亮，长时间阅读不刺眼。',
    vars: {
      '--lab-bg': '#060b14',
      '--lab-bg-2': '#0a1422',
      '--lab-surface': '#0e1b2c',
      '--lab-surface-2': '#142438',
      '--lab-text': '#eef4fb',
      '--lab-text-2': '#c9d7e6',
      '--lab-text-3': '#93aac2',
      '--lab-accent': '#7fb2ff',
      '--lab-accent-2': '#e8c88f',
      '--lab-line': '#24384f',
      '--lab-line-2': '#375374',
      '--lab-glow': 'rgba(90, 150, 255, 0.16)',
      '--lab-glow-2': 'rgba(232, 200, 143, 0.07)',
    },
    pairs: [
      { label: '正文 / 背景', fg: '#c9d7e6', bg: '#060b14' },
      { label: '次要 / 表面', fg: '#93aac2', bg: '#0e1b2c' },
      { label: '强调 / 背景', fg: '#e8c88f', bg: '#060b14' },
    ],
  },
  {
    key: 'zhuxuan',
    name: '朱玄',
    en: 'ALTERNATIVE / CINNABAR NOIR',
    desc: '更东方、更仪式感。墨夜底压朱砂，青玉作辅。适合把「卜」的庄重感放到最大，但朱砂大面积使用易疲劳，只宜作点睛。',
    vars: {
      '--lab-bg': '#0a0809',
      '--lab-bg-2': '#130f11',
      '--lab-surface': '#181214',
      '--lab-surface-2': '#201719',
      '--lab-text': '#f7f0ec',
      '--lab-text-2': '#ddd0c8',
      '--lab-text-3': '#b09d95',
      '--lab-accent': '#e0684f',
      '--lab-accent-2': '#9fb8ae',
      '--lab-line': '#3a2a28',
      '--lab-line-2': '#574039',
      '--lab-glow': 'rgba(224, 104, 79, 0.13)',
      '--lab-glow-2': 'rgba(159, 184, 174, 0.06)',
    },
    pairs: [
      { label: '正文 / 背景', fg: '#ddd0c8', bg: '#0a0809' },
      { label: '次要 / 表面', fg: '#b09d95', bg: '#181214' },
      { label: '强调 / 背景', fg: '#e0684f', bg: '#0a0809' },
    ],
  },
];

const LAYOUTS: { key: LayoutKey; name: string; desc: string; tags: string[] }[] = [
  {
    key: 'grid',
    name: '九宫 · 现行',
    desc: '3×3 等权卡片，一眼看全九个入口。信息效率高，但节奏均匀、缺少主次，是「工具页」而非「作品」。',
    tags: ['信息效率最高', '零改造成本', '缺叙事'],
  },
  {
    key: 'editorial',
    name: '卷轴 · 编辑式',
    desc: '超大标题占左，纵向清单占右，故意打破对称留出大片负空间。参考 2026 获奖站的档案索引与破格编排，慢下来读，最有「观象」的气质。',
    tags: ['留白即奢华', '字重强对比', '滚动叙事'],
  },
  {
    key: 'orbit',
    name: '星图 · 沉浸式',
    desc: '中央主视觉（卦象 / 星盘）为锚，九个入口环绕分布，滚动时逐层点亮。最抓人，但需要 3D 或 Canvas 支撑，成本与性能风险最高。',
    tags: ['电影感最强', '需 3D 支撑', '移动端待验证'],
  },
];

const LIBRARIES = [
  { name: '原生 CSS + Web Animations', size: '0 KB', role: '滚动揭示、SVG 描边、悬停、卷轴展开', verdict: '立即用', note: 'scroll-driven animation 跑在合成线程，零 JS；当前测试页全部动效均由它实现' },
  { name: 'Motion（原 Framer Motion）', size: '2.6–18 KB', role: '组件入场/退出、layout 动画、页面转场', verdict: '建议引入', note: 'React 声明式，自动尊重 prefers-reduced-motion；结果页分段展开最合适' },
  { name: 'GSAP + ScrollTrigger', size: '约 23–31 KB', role: '长篇滚动叙事、pin 住场景、复杂时间线', verdict: '暂缓', note: '只有把首页做成叙事长卷时才值得；与 Motion 职责重叠' },
  { name: 'Lenis', size: '约 3 KB', role: '惯性平滑滚动', verdict: '暂缓', note: '通常与 GSAP 成对出现；单独加会改变全站手感，需单独评审' },
  { name: 'Anime.js v4', size: '约 13 KB', role: 'SVG 变形、文字分裂', verdict: '不引入', note: '测试页里 stroke-dasharray 与逐字 stagger 已用原生实现覆盖' },
  { name: 'Three.js / R3F', size: '约 155 KB gzip', role: '3D 星图、粒子场', verdict: '按需', note: '仅当选「星图」布局才引入，必须 next/dynamic + ssr:false 懒加载' },
  { name: 'React Bits / Magic UI', size: '复制粘贴', role: '现成特效组件', verdict: '只借鉴', note: '闭源商用需逐个审许可，不直接引依赖' },
];

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
  const [theme, setTheme] = useState<ThemeKey>('cangbi');
  const [layout, setLayout] = useState<LayoutKey>('editorial');
  const [motion, setMotion] = useState<MotionLevel>('calm');
  const [replay, setReplay] = useState(0);
  const [systemReduced, setSystemReduced] = useState(false);
  const parallaxRef = useRef<HTMLDivElement | null>(null);

  const activeTheme = THEMES.find((item) => item.key === theme) ?? THEMES[1];
  const activeLayout = LAYOUTS.find((item) => item.key === layout) ?? LAYOUTS[1];

  const ratios = useMemo(
    () => activeTheme.pairs.map((pair) => ({ ...pair, value: contrastRatio(pair.fg, pair.bg) })),
    [activeTheme],
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (query.matches) {
      setSystemReduced(true);
      setMotion('off');
    }
  }, []);

  // 进入视口渐显：IntersectionObserver 只切类名，位移与透明度由 CSS 承担
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
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
  }, []);

  // 视差：只在「完整」档绑定，且仅改 transform，不做布局计算
  useEffect(() => {
    if (motion !== 'full' || systemReduced) return;
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
  }, [motion, systemReduced]);

  function handleTilt(event: MouseEvent<HTMLDivElement>) {
    if (motion !== 'full' || systemReduced) return;
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

  return (
    <main
      className={styles.lab}
      style={activeTheme.vars as CSSProperties}
      data-motion={motion}
      data-layout={layout}
    >
      <div className={styles.aurora} ref={parallaxRef} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>
          ← 返回正式站
        </Link>
        <span className={styles.badge}>测试页 · 正式页面布局未改动</span>
        <Link href="/history" className={styles.navLink}>
          问事录 →
        </Link>
      </nav>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>DESIGN LAB · 2026 / VISUAL PROPOSAL</p>
        <h1 className={styles.display}>
          <span>观</span>
          <span>象</span>
          <span className={styles.displayDot}>·</span>
          <span>问</span>
          <span>天</span>
        </h1>
        <p className={styles.tagline}>观象以知变，问天而察机</p>
        <p className={styles.heroNote}>
          三套色谱 · 三种布局 · 八组动效。全部可在下方实时切换对比，确认后再决定是否迁移到正式页面。
        </p>
        <div className={styles.scrollHint} aria-hidden="true">
          <span>向 下 展 开</span>
          <i />
        </div>
      </header>

      <section className={styles.section} id="palette">
        <SectionHead n="01" title="色谱" sub="Color system · 三套方案实时切换，对比度按 WCAG 2.2 实时计算" />

        <div className={styles.switcher} data-reveal>
          {THEMES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.switchBtn} ${theme === item.key ? styles.switchOn : ''}`}
              onClick={() => setTheme(item.key)}
            >
              <span className={styles.swatchMini} style={{ background: item.vars['--lab-accent'] }} />
              <span>
                <strong>{item.name}</strong>
                <small>{item.en}</small>
              </span>
            </button>
          ))}
        </div>

        <div className={styles.paletteGrid} data-reveal>
          <div className={styles.palettePanel}>
            <p className={styles.panelLabel}>色 板 / {activeTheme.name}</p>
            <div className={styles.swatches}>
              {[
                ['底色', '--lab-bg'],
                ['次底', '--lab-bg-2'],
                ['表面', '--lab-surface'],
                ['浮层', '--lab-surface-2'],
                ['主文', '--lab-text'],
                ['正文', '--lab-text-2'],
                ['次要', '--lab-text-3'],
                ['强调', '--lab-accent'],
                ['点睛', '--lab-accent-2'],
                ['描边', '--lab-line'],
              ].map(([label, key]) => (
                <div className={styles.swatch} key={key}>
                  <span style={{ background: activeTheme.vars[key] }} />
                  <b>{label}</b>
                  <code>{activeTheme.vars[key].startsWith('#') ? activeTheme.vars[key] : '光晕'}</code>
                </div>
              ))}
            </div>
            <p className={styles.themeDesc}>{activeTheme.desc}</p>
          </div>

          <div className={styles.contrastPanel}>
            <p className={styles.panelLabel}>可 读 性 / WCAG</p>
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
              正文以 7:1 为硬线。此前你反馈过暗底浅字伤眼，这里所有候选都按高对比设计，绝不靠降低透明度做「高级感」。
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
        <SectionHead n="02" title="布局" sub="Layout system · 迷你首页预览，切换看结构而非换皮" />

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
            <span className={styles.previewDot} />
            <span className={styles.previewDot} />
            <span className={styles.previewDot} />
            <code>wentian / {layout}</code>
          </div>

          <div className={styles.wire} key={layout}>
            {layout === 'grid' && (
              <div className={styles.wireGrid}>
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className={styles.wireCell}>
                    <i />
                    <b />
                  </span>
                ))}
              </div>
            )}
            {layout === 'editorial' && (
              <div className={styles.wireEditorial}>
                <div className={styles.wireBig}>
                  <i />
                  <i />
                  <i />
                </div>
                <div className={styles.wireList}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <span key={i}><i /><b /></span>
                  ))}
                </div>
              </div>
            )}
            {layout === 'orbit' && (
              <div className={styles.wireOrbit}>
                <div className={styles.wireCore} />
                {Array.from({ length: 8 }, (_, i) => (
                  <span
                    key={i}
                    className={styles.wireNode}
                    style={{ transform: `rotate(${(i * 360) / 8}deg) translateY(-96px) rotate(${(-i * 360) / 8}deg)` }}
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
        </div>
      </section>

      <section className={styles.section} id="motion">
        <SectionHead n="03" title="动效" sub="Motion system · 全部为原生实现，零新增依赖；按档位实时开关" />

        <div className={styles.motionBar} data-reveal>
          <div className={styles.motionSwitch}>
            {([
              ['off', '静 态'],
              ['calm', '克 制'],
              ['full', '完 整'],
            ] as [MotionLevel, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.motionBtn} ${motion === key ? styles.motionOn : ''}`}
                onClick={() => setMotion(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.replayBtn} onClick={() => setReplay((n) => n + 1)}>
            ↻ 重播全部
          </button>
          <span className={styles.motionHint}>
            {systemReduced ? '检测到系统「减少动态效果」，已锁定静态' : '建议默认「克制」：动效只作引导，不作装饰'}
          </span>
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
                <path className={styles.strokeLine} d="M20 18 H140" style={{ animationDelay: '120ms' }} />
                <path className={styles.strokeLine} d="M20 48 H62 M98 48 H140" style={{ animationDelay: '260ms' }} />
                <path className={styles.strokeLine} d="M20 78 H140" style={{ animationDelay: '400ms' }} />
              </svg>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>03</span><h3>卷轴展开</h3></header>
            <p className={styles.demoDesc}>scaleX 从中心向两侧徐徐展开，对应「展卷」而非「弹窗」。</p>
            <div className={styles.demoStage} key={`scroll-${replay}`}>
              <div className={styles.scrollOpen}>
                <span>天 地 定位 · 山 泽 通 气</span>
              </div>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>04</span><h3>磁吸倾斜</h3></header>
            <p className={styles.demoDesc}>光标位置驱动 rotateX/Y，只改 transform；「完整」档才启用。</p>
            <div className={styles.demoStage}>
              <div className={styles.tiltCard} onMouseMove={handleTilt} onMouseLeave={resetTilt}>
                <span className={styles.tiltGlyph}>☯</span>
                <b>移动光标试试</b>
              </div>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>05</span><h3>光泽扫过</h3></header>
            <p className={styles.demoDesc}>悬停时一道极窄高光掠过按钮，作为「可点」的确认反馈，不闪烁。</p>
            <div className={styles.demoStage}>
              <button type="button" className={styles.shineBtn}>
                <span>掷 筊 问 事</span>
              </button>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>06</span><h3>逐字揭示</h3></header>
            <p className={styles.demoDesc}>标题按字错峰 60ms，总时长控制在 300ms 内，符合高端站的克制节奏。</p>
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
            <p className={styles.demoDesc}>背景光晕以 0.18 倍速随滚动位移，制造景深；「完整」档才绑定。</p>
            <div className={styles.demoStage}>
              <div className={styles.parallaxDemo}>
                <i /><i /><i />
                <span>近 · 中 · 远</span>
              </div>
            </div>
          </article>

          <article className={styles.demo} data-reveal>
            <header><span>08</span><h3>呼吸光晕</h3></header>
            <p className={styles.demoDesc}>6 秒周期的极缓明灭，幅度仅 0.12。不做脉冲、不做持续旋转。</p>
            <div className={styles.demoStage}>
              <div className={styles.breath}><span>静</span></div>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.section} id="stack">
        <SectionHead n="04" title="选型与落地" sub="Library & rollout · 不堆库，按职责分层引入" />

        <div className={styles.tableWrap} data-reveal>
          <table className={styles.table}>
            <thead>
              <tr><th>工具</th><th>体积</th><th>职责</th><th>结论</th></tr>
            </thead>
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
            <b>阶段 1 · 零依赖</b>
            <p>先换 design token 与字阶，加滚动揭示 / 描边 / 悬停。可整体开关，随时回滚，不动任何页面结构。</p>
          </div>
          <div className={styles.rolloutStep}>
            <b>阶段 2 · 引入 Motion</b>
            <p>做页面转场与结果页分段展开，AnimatePresence 处理退出。约 18 KB，React 生命周期内最省心。</p>
          </div>
          <div className={styles.rolloutStep}>
            <b>阶段 3 · 按需加重</b>
            <p>只有选「星图」布局才评估 GSAP / Lenis / R3F，且必须动态导入、关闭 SSR、移动端实测。</p>
          </div>
        </div>

        <div className={styles.rules} data-reveal>
          <h3>不可越线的四条</h3>
          <ol>
            <li>只动 <code>transform</code> 与 <code>opacity</code>，不碰 width / height / top / left。</li>
            <li>文字类动效 150–300ms，禁止超过 400ms、禁止持续旋转与闪烁闪烁。</li>
            <li>正文对比度 ≥ 7:1，<code>prefers-reduced-motion</code> 全量降级为静态。</li>
            <li>动效必须引导、确认或叙事，不承担信息本身——关掉动效页面依然完整可读。</li>
          </ol>
        </div>
      </section>

      <footer className={styles.footer} data-reveal>
        <p>此页为方案验证，正式页面未做任何布局修改。</p>
        <div className={styles.footerLinks}>
          <Link href="/">返回首页</Link>
          <Link href="/history">查看问事录</Link>
        </div>
      </footer>
    </main>
  );
}
