import { DEFAULT_DIVINATION_TIMEZONE, getZonedDateTimeParts } from 'taibu-core/timezone-utils';

/** 全术数域的统一标识 */
export type DivinationDomain =
  | 'liuyao'
  | 'tarot'
  | 'ziwei'
  | 'daliuren'
  | 'almanac'
  | 'bazi'
  | 'meihua'
  | 'qimen'
  | 'astrology'
  | 'xiaoliuren'
  | 'taiyi'
  | 'jiao';

export interface DivinationMeta {
  domain: DivinationDomain;
  /** 本次排盘使用的 IANA 时区 */
  timezone: string;
  /** 实际参与计算的时间（YYYY-MM-DDTHH:mm:ss，本地墙钟时间） */
  effectiveDate: string;
  /** 结果生成时刻（ISO 8601，UTC） */
  generatedAt: string;
  /** taibu-core 为 SDK 计算，local 为自研实现 */
  source: 'taibu-core' | 'local';
}

/**
 * 各域适配函数的统一返回结构。
 * payload 保留 core 的原始返回（或自研域的完整结果），不做裁剪。
 */
export interface DivinationResult<TPayload> {
  domain: DivinationDomain;
  title: string;
  subtitle: string;
  payload: TPayload | null;
  meta: DivinationMeta;
  /** 可展示给用户的提示；计算失败时错误信息也写在这里 */
  warnings: string[];
}

export interface ResolvedDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** YYYY-MM-DD */
  date: string;
  /** YYYY-MM-DDTHH:mm:ss */
  dateTime: string;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;
const OFFSET_SUFFIX_RE = /(?:[zZ]|[+-]\d{2}:\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function fromParts(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}): ResolvedDateTime {
  const date = `${String(parts.year).padStart(4, '0')}-${pad2(parts.month)}-${pad2(parts.day)}`;
  return {
    ...parts,
    date,
    dateTime: `${date}T${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`,
  };
}

export function nowInTimezone(timezone: string): ResolvedDateTime {
  return fromParts(getZonedDateTimeParts(new Date(), timezone));
}

/** 校验并归一化时区；非法时区回退到 Asia/Shanghai 并记录 warning */
export function normalizeTimezone(input: string | undefined, warnings: string[]): string {
  if (!input) return DEFAULT_DIVINATION_TIMEZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: input }).format(0);
    return input;
  } catch {
    warnings.push(`时区 "${input}" 无效，已回退到 ${DEFAULT_DIVINATION_TIMEZONE}`);
    return DEFAULT_DIVINATION_TIMEZONE;
  }
}

/**
 * 把外部传入的时间归一化为指定时区的墙钟时间。
 * - 省略时取该时区的当前时间
 * - 仅日期时，按 dateOnlyTime 决定用 00:00:00 还是当前时刻
 * - 带 Z/偏移的 ISO 时间会换算到目标时区
 * - 无法解析时回退到当前时间并记录 warning
 */
export function resolveDateTime(
  value: string | Date | undefined,
  timezone: string,
  warnings: string[],
  dateOnlyTime: 'midnight' | 'now' = 'midnight',
): ResolvedDateTime {
  const fallback = (): ResolvedDateTime => nowInTimezone(timezone);

  if (value === undefined || value === null || value === '') {
    return fallback();
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      warnings.push('传入的时间对象无效，已回退到当前时间');
      return fallback();
    }
    return fromParts(getZonedDateTimeParts(value, timezone));
  }

  const raw = value.trim();
  if (!raw) return fallback();

  if (OFFSET_SUFFIX_RE.test(raw)) {
    const instant = new Date(raw);
    if (!Number.isNaN(instant.getTime())) {
      return fromParts(getZonedDateTimeParts(instant, timezone));
    }
    warnings.push(`时间 "${raw}" 无法解析，已回退到当前时间`);
    return fallback();
  }

  const match = DATE_TIME_RE.exec(raw);
  if (match) {
    return fromParts({
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
      second: match[6] ? Number(match[6]) : 0,
    });
  }

  if (DATE_ONLY_RE.test(raw)) {
    const now = nowInTimezone(timezone);
    const [year, month, day] = raw.split('-').map(Number);
    return fromParts({
      year,
      month,
      day,
      hour: dateOnlyTime === 'now' ? now.hour : 0,
      minute: dateOnlyTime === 'now' ? now.minute : 0,
      second: dateOnlyTime === 'now' ? now.second : 0,
    });
  }

  warnings.push(`时间 "${raw}" 格式无法识别，已回退到当前时间`);
  return fallback();
}

/** 把出生信息格式化为 meta.effectiveDate 使用的本地时间字符串 */
export function formatBirthDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): string {
  return `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00`;
}

export function createMeta(
  domain: DivinationDomain,
  timezone: string,
  effectiveDate: string,
  source: DivinationMeta['source'],
): DivinationMeta {
  return {
    domain,
    timezone,
    effectiveDate,
    generatedAt: new Date().toISOString(),
    source,
  };
}

/** 把 unknown 异常收敛成可展示文本 */
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** 把 core 返回的 warnings 追加到统一 warnings 中（去重） */
export function appendWarnings(target: string[], source: readonly string[] | undefined): void {
  if (!source) return;
  for (const item of source) {
    if (item && !target.includes(item)) target.push(item);
  }
}
