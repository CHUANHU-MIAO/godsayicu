'use client';

/**
 * 全局外观（亮 / 暗 / 跟随系统）
 * 单一数据源：写入 document.documentElement.dataset.appearance，
 * 由 app/globals.css 的两套 token 消费。顶层不访问 window，SSR 安全。
 */

export type AppearanceChoice = 'light' | 'dark' | 'system';
export type ResolvedAppearance = 'light' | 'dark';

const STORAGE_KEY = 'wen.appearance';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export interface AppearanceState {
  choice: AppearanceChoice;
  resolved: ResolvedAppearance;
}

let state: AppearanceState = { choice: 'system', resolved: 'dark' };
const listeners = new Set<(next: AppearanceState) => void>();
let initialized = false;
/** URL 预览参数只在首次加载生效，用户手动切换后即失效 */
let urlOverride: ResolvedAppearance | null = null;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readChoice(): AppearanceChoice {
  const raw = storage()?.getItem(STORAGE_KEY);
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia(DARK_QUERY).matches;
}

export function resolveAppearance(choice: AppearanceChoice): ResolvedAppearance {
  if (urlOverride) return urlOverride;
  if (choice === 'light') return 'light';
  if (choice === 'dark') return 'dark';
  return systemPrefersDark() ? 'dark' : 'light';
}

function publish(): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.appearance = state.resolved;
  }
  listeners.forEach((listener) => listener(state));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wen:appearance', { detail: state }));
  }
}

export function getAppearance(): AppearanceState {
  return state;
}

export function subscribeAppearance(listener: (next: AppearanceState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAppearance(choice: AppearanceChoice): void {
  urlOverride = null;
  try {
    storage()?.setItem(STORAGE_KEY, choice);
  } catch {
    /* 隐私模式下忽略 */
  }
  state = { choice, resolved: resolveAppearance(choice) };
  publish();
}

export function initAppearance(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  try {
    const param = new URLSearchParams(window.location.search).get('appearance');
    urlOverride = param === 'light' || param === 'dark' ? param : null;
  } catch {
    urlOverride = null;
  }

  const choice = readChoice();
  state = { choice, resolved: resolveAppearance(choice) };
  publish();

  const query = window.matchMedia?.(DARK_QUERY);
  query?.addEventListener?.('change', () => {
    if (state.choice === 'system') {
      state = { ...state, resolved: resolveAppearance('system') };
      publish();
    }
  });
}
