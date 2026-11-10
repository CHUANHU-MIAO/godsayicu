import { calculateXiaoliurenData } from 'taibu-core/xiaoliuren';
import type { XiaoliurenInput, XiaoliurenOutput } from 'taibu-core/xiaoliuren';
import { createMeta, describeError, normalizeTimezone, resolveDateTime } from './types';
import type { DivinationResult } from './types';

export interface CastXiaoliurenInput extends Omit<XiaoliurenInput, 'hour' | 'date'> {
  /** 0-23 的小时数；省略时取所给日期/当前时刻的小时 */
  hour?: number;
  date?: string | Date;
}

export function castXiaoliuren(
  input: CastXiaoliurenInput = {},
): DivinationResult<XiaoliurenOutput> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(undefined, warnings);
  const useLunarInput = input.lunarMonth !== undefined || input.lunarDay !== undefined;
  if (useLunarInput && input.date !== undefined) {
    warnings.push('已提供农历月日，公历日期被忽略');
  }

  const resolved = resolveDateTime(useLunarInput ? undefined : input.date, timezone, warnings, 'now');
  const hour = input.hour ?? resolved.hour;
  const meta = createMeta('xiaoliuren', timezone, resolved.dateTime, 'taibu-core');

  try {
    const payload = calculateXiaoliurenData({
      ...input,
      date: useLunarInput ? undefined : resolved.date,
      hour,
      hourType: input.hourType ?? 'clock',
      question: input.question?.trim() || undefined,
    });

    return {
      domain: 'xiaoliuren',
      title: '小六壬占断',
      subtitle: `${payload.result.name} · ${payload.result.nature}`,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`小六壬占断失败：${describeError(error)}`);
    return {
      domain: 'xiaoliuren',
      title: '小六壬占断',
      subtitle: '未能完成占断',
      payload: null,
      meta,
      warnings,
    };
  }
}
