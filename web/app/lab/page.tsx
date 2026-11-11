'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';

import {
  getAppearance,
  initAppearance,
  setAppearance,
  subscribeAppearance,
  type AppearanceChoice,
  type AppearanceState,
} from '@/lib/theme/appearance';

import styles from './lab.module.css';

type ThemeKey = 'xuanjin' | 'cangbi' | 'zhuxuan';

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

const APPEARANCE_OPTIONS: { key: AppearanceChoice; label: string }[] = [
  { key: 'light', label: '亮 色' },
  { key: 'dark', label: '暗 色' },
  { key: 'system', label: '跟随系统' },
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
    <div className={styles.sectionHead}>
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
  const [appearance, setAppearanceState] = useState<AppearanceState>({ choice: 'system', resolved: 'dark' });

  const activeTheme = THEMES.find((item) => item.key === theme) ?? THEMES[2];
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

  return (
    <main
      className={styles.lab}
      style={activeVars as CSSProperties}
      data-appearance={appearance.resolved}
    >
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>← 返回正式站</Link>
        <span className={styles.badge}>色谱与外观 · 方案台</span>
        <Link href="/history" className={styles.navLink}>问事录 →</Link>
      </nav>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>DESIGN LAB · 2026 / COLOR &amp; APPEARANCE</p>
        <h1 className={styles.display}>
          <span>观</span><span>象</span>
          <span className={styles.displayDot}>·</span>
          <span>问</span><span>天</span>
        </h1>
        <p className={styles.heroNote}>
          此页只保留色谱与外观对照：三套配色、亮暗两套色板、WCAG 对比度与实际排版取样，可直接切换验证。
        </p>
      </header>

      <section className={styles.section} id="palette">
        <SectionHead n="01" title="色谱与外观" sub="Color system · 朱玄为选定暗色，配套「月纸」亮色；三态切换全站生效" />

        <div className={styles.appearanceBar}>
          <span className={styles.appearanceLabel}>外 观</span>
          <div className={styles.appearanceSwitch}>
            {APPEARANCE_OPTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.motionBtn} ${appearance.choice === item.key ? styles.motionOn : ''}`}
                onClick={() => setAppearance(item.key)}
                aria-pressed={appearance.choice === item.key}
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

        <div className={styles.switcher}>
          {THEMES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.switchBtn} ${theme === item.key ? styles.switchOn : ''}`}
              onClick={() => setTheme(item.key)}
              aria-pressed={theme === item.key}
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

        <div className={styles.paletteGrid}>
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

      <footer className={styles.footer}>
        <p>朱玄 + 月纸已落地正式站；此页仅用于色谱与外观对照。</p>
        <div className={styles.footerLinks}>
          <Link href="/">返回首页</Link>
          <Link href="/history">查看问事录</Link>
          <Link href="/lab/look">新版式样板 →</Link>
        </div>
      </footer>
    </main>
  );
}
