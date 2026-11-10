/**
 * 匿名占卜历史（本地存储层）
 *
 * 设计约束：
 * - 完全不依赖账号、数据库、AI，匿名可用；
 * - SSR 安全，服务端调用一律返回空值；
 * - 存储配额不足时自动淘汰最旧记录，绝不抛错影响排盘主流程；
 * - 未来接入账号后可整体迁移到 /api/divinations，接口形状与服务端表一致。
 */

const STORAGE_KEY = 'wen.history.v1';
const MAX_ENTRIES = 100;

const DOMAIN_LABELS: Record<string, string> = {
  liuyao: '六爻',
  tarot: '塔罗',
  ziwei: '紫微',
  daliuren: '大六壬',
  almanac: '黄历',
  jiao: '杯筊',
  bazi: '八字',
  meihua: '梅花',
  qimen: '奇门',
  astrology: '占星',
  xiaoliuren: '小六壬',
  taiyi: '太乙',
};

/** 每个域用于生成一句话摘要的候选字段，按优先级排列 */
const SUMMARY_KEYS: Record<string, string[]> = {
  liuyao: ['hexagramName', 'changedHexagramName', 'hexagramGong'],
  tarot: ['spreadName', 'spreadType', 'spread'],
  ziwei: ['mingGong', 'soul', 'fiveElementsClass'],
  daliuren: ['sanChuan', 'threeTransmissions', 'keName'],
  almanac: ['ganZhiDay', 'dayGanZhi', 'yi'],
  jiao: ['label', 'outcome', 'meaning'],
  bazi: ['dayMaster', 'dayGan', 'bazi'],
  meihua: ['hexagramName', 'tiYong', 'bodyRelation'],
  qimen: ['zhiFu', 'zhiShi', 'juName'],
};

export interface HistoryEntry {
  id: string;
  domain: string;
  label: string;
  subtitle: string;
  question: string;
  summary: string;
  effectiveDate: string;
  createdAt: string;
  /** 完整排盘结果，供日后复现与接入服务端历史 */
  payload: unknown;
}

/** 与 /api/divination 返回结构兼容的宽松形状，避免各页具体类型互相冲突 */
export interface ResultLike {
  domain?: string;
  title?: string;
  subtitle?: string;
  payload?: unknown;
  meta?: { effectiveDate?: string } | null;
}

function available(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function read(): HistoryEntry[] {
  if (!available()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]): boolean {
  if (!available()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

/** 在对象树中按候选键名找第一个有意义的标量值，兼容 core 各域的嵌套结构 */
function deepPick(value: unknown, keys: string[], depth = 0): string | null {
  if (depth > 5 || value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    for (const item of value.slice(0, 8)) {
      const found = deepPick(item, keys, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of keys) {
      const candidate = obj[key];
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
      if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
    }
    for (const nested of Object.values(obj)) {
      const found = deepPick(nested, keys, depth + 1);
      if (found) return found;
    }
    return null;
  }

  return null;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function domainLabel(domain: string): string {
  return DOMAIN_LABELS[domain] ?? domain;
}

/** 按时间倒序列出全部记录 */
export function listHistory(): HistoryEntry[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  return read().find((entry) => entry.id === id) ?? null;
}

export function removeHistory(id: string): void {
  write(read().filter((entry) => entry.id !== id));
}

export function clearHistory(): void {
  if (available()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* 忽略：不影响主流程 */
    }
  }
}

/** 排盘成功后调用；失败时静默返回 null，绝不阻断页面 */
export function saveFromResult(result: ResultLike, question?: string): HistoryEntry | null {
  if (!available() || !result?.payload) return null;

  const domain = result.domain ?? 'unknown';
  const picked = deepPick(result.payload, SUMMARY_KEYS[domain] ?? []);
  const entry: HistoryEntry = {
    id: makeId(),
    domain,
    label: domainLabel(domain),
    subtitle: result.subtitle ?? result.title ?? '',
    question: (question ?? '').trim(),
    summary: [result.subtitle, picked].filter(Boolean).join(' · '),
    effectiveDate: result.meta?.effectiveDate ?? '',
    createdAt: new Date().toISOString(),
    payload: result.payload,
  };

  const entries = read();
  entries.unshift(entry);
  let trimmed = entries.slice(0, MAX_ENTRIES);

  // 配额不足时逐步淘汰最旧记录，最多重试 4 轮
  while (!write(trimmed) && trimmed.length > 1) {
    trimmed = trimmed.slice(0, Math.max(1, Math.floor(trimmed.length / 2)));
  }

  return entry;
}

export function formatHistoryTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
