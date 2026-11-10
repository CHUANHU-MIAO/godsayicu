'use client';

/**
 * 性能自适应动效治理
 *
 * 不靠 UA 猜设备，而是综合硬件信号 + 一次真实 rAF 帧率采样给出档位：
 *   off   全部动画/过渡关闭，重型图层不渲染，不绑定滚动与鼠标监听
 *   calm  保留入场与悬停，关闭无限循环、视差、3D 倾斜、粒子
 *   full  全部启用
 *
 * 结果写入 document.documentElement.dataset.motion，由 globals.css 与各组件消费。
 * 系统「减少动态效果」始终优先，强制 off。
 */

export type MotionTier = 'off' | 'calm' | 'full';
export type MotionChoice = 'auto' | MotionTier;

const STORAGE_KEY = 'wen.motion';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export interface PerfReport {
  cores: number;
  memoryGb: number | null;
  effectiveType: string;
  saveData: boolean;
  mobile: boolean;
  dpr: number;
  fps: number | null;
  reducedMotion: boolean;
  score: number;
  reasons: string[];
}

export interface MotionState {
  choice: MotionChoice;
  tier: MotionTier;
  report: PerfReport | null;
  probing: boolean;
}

let state: MotionState = {
  choice: 'auto',
  tier: 'calm',
  report: null,
  probing: false,
};

const listeners = new Set<(next: MotionState) => void>();
let initialized = false;
let probeToken = 0;

interface NavigatorExtra extends Navigator {
  deviceMemory?: number;
  connection?: { effectiveType?: string; saveData?: boolean };
}

function publish(): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.motion = state.tier;
  }
  listeners.forEach((listener) => listener(state));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wen:motion', { detail: state }));
  }
}

export function getMotion(): MotionState {
  return state;
}

export function subscribeMotion(listener: (next: MotionState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readChoice(): MotionChoice {
  try {
    const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEY);
    return raw === 'off' || raw === 'calm' || raw === 'full' ? raw : 'auto';
  } catch {
    return 'auto';
  }
}

/** 采样真实帧率；页面在后台或卡死时由超时兜底返回 null */
function sampleFps(frames = 48, timeoutMs = 1700): Promise<number | null> {
  return new Promise((resolve) => {
    let count = 0;
    let start = 0;
    let done = false;

    const finish = (value: number | null) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve(value);
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);

    const tick = (now: number) => {
      if (done) return;
      if (!start) start = now;
      count += 1;
      if (count >= frames) {
        finish(Math.round((count * 1000) / Math.max(1, now - start)));
        return;
      }
      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  });
}

function collectSignals() {
  const nav = (typeof navigator === 'undefined' ? {} : navigator) as NavigatorExtra;
  const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 4;
  const memoryGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
  const conn = nav.connection;
  const effectiveType = conn?.effectiveType ?? 'unknown';
  const saveData = Boolean(conn?.saveData);
  const slowNetwork = saveData || /^(slow-)?2g$|^3g$/i.test(effectiveType);
  const mobile =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768);
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const reducedMotion =
    typeof window !== 'undefined' && Boolean(window.matchMedia?.(REDUCED_QUERY).matches);

  return { cores, memoryGb, effectiveType, saveData, slowNetwork, mobile, dpr, reducedMotion };
}

function scoreSignals(signals: ReturnType<typeof collectSignals>, fps: number | null) {
  const reasons: string[] = [];
  let score = 50;

  if (signals.cores >= 8) {
    score += 20;
    reasons.push(`${signals.cores} 核 CPU，余量充足`);
  } else if (signals.cores >= 4) {
    score += 8;
    reasons.push(`${signals.cores} 核 CPU，中等`);
  } else {
    score -= 16;
    reasons.push(`仅 ${signals.cores} 核 CPU，需保守`);
  }

  if (signals.memoryGb === null) {
    reasons.push('浏览器未公开内存，按中等估算');
  } else if (signals.memoryGb >= 8) {
    score += 15;
    reasons.push(`内存 ${signals.memoryGb} GB`);
  } else if (signals.memoryGb >= 4) {
    score += 5;
    reasons.push(`内存 ${signals.memoryGb} GB`);
  } else {
    score -= 12;
    reasons.push(`内存仅 ${signals.memoryGb} GB`);
  }

  if (signals.slowNetwork) {
    score -= 30;
    reasons.push('弱网或开启省流量，禁用重型动效');
  }
  if (signals.mobile) {
    score -= 12;
    reasons.push('触屏 / 小屏设备，降低负载');
  }
  if (signals.dpr > 2.5) {
    score -= 8;
    reasons.push(`像素比 ${signals.dpr.toFixed(1)}，合成成本较高`);
  }

  if (fps === null) {
    score -= 10;
    reasons.push('帧率采样超时，按保守处理');
  } else if (fps >= 55) {
    score += 12;
    reasons.push(`实测 ${fps} FPS，流畅`);
  } else if (fps >= 40) {
    reasons.push(`实测 ${fps} FPS，一般`);
  } else {
    score -= 25;
    reasons.push(`实测 ${fps} FPS，明显掉帧`);
  }

  return { score, reasons };
}

function decideTier(score: number, fps: number | null, reducedMotion: boolean): MotionTier {
  if (reducedMotion) return 'off';
  if (fps !== null && fps < 25) return 'off';
  if (score >= 68) return 'full';
  if (score >= 38) return 'calm';
  return 'off';
}

async function probe(): Promise<void> {
  const token = ++probeToken;
  state = { ...state, probing: true };
  publish();

  const signals = collectSignals();
  const fps = signals.reducedMotion ? null : await sampleFps();
  if (token !== probeToken) return;

  const { score, reasons } = scoreSignals(signals, fps);
  if (signals.reducedMotion) reasons.unshift('系统开启「减少动态效果」，强制静态');

  const report: PerfReport = {
    cores: signals.cores,
    memoryGb: signals.memoryGb,
    effectiveType: signals.effectiveType,
    saveData: signals.saveData,
    mobile: signals.mobile,
    dpr: signals.dpr,
    fps,
    reducedMotion: signals.reducedMotion,
    score,
    reasons,
  };

  const tier = decideTier(score, fps, signals.reducedMotion);
  state = {
    choice: state.choice,
    tier,
    report,
    probing: false,
  };
  publish();
}

export function setMotionChoice(choice: MotionChoice): void {
  try {
    if (typeof window !== 'undefined') {
      if (choice === 'auto') window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, choice);
    }
  } catch {
    /* 隐私模式下忽略 */
  }

  const reduced =
    typeof window !== 'undefined' && Boolean(window.matchMedia?.(REDUCED_QUERY).matches);

  state = { ...state, choice, tier: reduced ? 'off' : choice === 'auto' ? state.tier : choice };
  publish();

  if (choice === 'auto' && !reduced) void probe();
}

export function refreshMotion(): void {
  if (state.choice === 'auto') void probe();
}

export function initMotion(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const choice = readChoice();
  const reduced = Boolean(window.matchMedia?.(REDUCED_QUERY).matches);
  state = {
    choice,
    tier: reduced ? 'off' : choice === 'auto' ? 'calm' : choice,
    report: null,
    probing: false,
  };
  publish();

  window.matchMedia?.(REDUCED_QUERY).addEventListener?.('change', (event) => {
    if (event.matches) {
      state = { ...state, tier: 'off' };
      publish();
    } else if (state.choice === 'auto') {
      void probe();
    }
  });

  // 页面切回前台时重新采样，避免后台标签页的低帧率误判
  document.addEventListener?.('visibilitychange', () => {
    if (!document.hidden && state.choice === 'auto' && !state.probing) void probe();
  });

  if (choice === 'auto' && !reduced) void probe();
}
