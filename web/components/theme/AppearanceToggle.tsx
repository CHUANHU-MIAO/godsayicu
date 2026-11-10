'use client';

import { useEffect, useRef, useState } from 'react';

import {
  getAppearance,
  initAppearance,
  setAppearance,
  subscribeAppearance,
  type AppearanceChoice,
  type AppearanceState,
} from '@/lib/theme/appearance';

import styles from './AppearanceToggle.module.css';

const OPTIONS: { key: AppearanceChoice; label: string; hint: string }[] = [
  { key: 'light', label: '亮色', hint: '月纸 · 朱砂' },
  { key: 'dark', label: '暗色', hint: '墨夜 · 朱砂' },
  { key: 'system', label: '跟随系统', hint: '随系统偏好自动切换' },
];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M20.2 14.6A8.5 8.5 0 0 1 9.4 3.8a8.5 8.5 0 1 0 10.8 10.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
    </svg>
  );
}

const ICONS: Record<AppearanceChoice, () => React.JSX.Element> = {
  light: SunIcon,
  dark: MoonIcon,
  system: SystemIcon,
};

export default function AppearanceToggle() {
  const [state, setState] = useState<AppearanceState>({ choice: 'system', resolved: 'dark' });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initAppearance();
    setState(getAppearance());
    return subscribeAppearance(setState);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const TriggerIcon = ICONS[state.resolved === 'light' ? 'light' : 'dark'];

  return (
    <div className={styles.root} ref={rootRef}>
      {open && (
        <div className={styles.panel} role="menu" aria-label="外观模式">
          <p className={styles.panelHead}>外 观</p>
          {OPTIONS.map((option) => {
            const Icon = ICONS[option.key];
            const active = state.choice === option.key;
            return (
              <button
                key={option.key}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`${styles.option} ${active ? styles.optionOn : ''}`}
                onClick={() => {
                  setAppearance(option.key);
                  setState(getAppearance());
                  setOpen(false);
                }}
              >
                <span className={styles.optionIcon}><Icon /></span>
                <span className={styles.optionText}>
                  <b>{option.label}</b>
                  <small>{option.hint}</small>
                </span>
                {active && <span className={styles.check} aria-hidden="true">·</span>}
              </button>
            );
          })}
          <p className={styles.panelFoot}>
            当前：{state.resolved === 'light' ? '亮色' : '暗色'}
            {state.choice === 'system' ? '（跟随系统）' : ''}
          </p>
        </div>
      )}

      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`切换外观，当前${state.resolved === 'light' ? '亮色' : '暗色'}`}
        title="亮色 / 暗色 / 跟随系统"
      >
        <TriggerIcon />
      </button>
    </div>
  );
}
