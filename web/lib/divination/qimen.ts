import { calculateQimen } from 'taibu-core/qimen';
import type { QimenInput, QimenOutput } from 'taibu-core/qimen';
import { createMeta, describeError, normalizeTimezone, resolveDateTime } from './types';
import type { DivinationResult } from './types';

export interface CastQimenInput
  extends Omit<QimenInput, 'year' | 'month' | 'day' | 'hour' | 'minute' | 'timezone'> {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  /** 便捷入口：给定时取其年月日时分，显式字段优先 */
  date?: string | Date;
  timezone?: string;
}

export async function castQimen(
  input: CastQimenInput = {},
): Promise<DivinationResult<QimenOutput>> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(input.timezone, warnings);
  const resolved = resolveDateTime(input.date, timezone, warnings, 'now');

  const year = input.year ?? resolved.year;
  const month = input.month ?? resolved.month;
  const day = input.day ?? resolved.day;
  const hour = input.hour ?? resolved.hour;
  const minute = input.minute ?? resolved.minute;
  const meta = createMeta(
    'qimen',
    timezone,
    `${resolved.date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
    'taibu-core',
  );

  try {
    const payload = await calculateQimen({
      ...input,
      year,
      month,
      day,
      hour,
      minute,
      timezone,
      question: input.question?.trim() || undefined,
    });

    return {
      domain: 'qimen',
      title: '奇门遁甲排盘',
      subtitle: `${payload.siZhu.day}日 ${payload.siZhu.hour}时 · ${payload.dunType}遁${payload.juNumber}局`,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`奇门排盘失败：${describeError(error)}`);
    return {
      domain: 'qimen',
      title: '奇门遁甲排盘',
      subtitle: '未能完成排盘',
      payload: null,
      meta,
      warnings,
    };
  }
}
