import { calculateDaliuren } from 'taibu-core/daliuren';
import type { DaliurenInput, DaliurenOutput } from 'taibu-core/daliuren';
import { createMeta, describeError, normalizeTimezone, resolveDateTime } from './types';
import type { DivinationResult } from './types';

export interface CastDaliurenInput
  extends Omit<DaliurenInput, 'date' | 'hour' | 'minute' | 'timezone'> {
  date?: string | Date;
  hour?: number;
  minute?: number;
  timezone?: string;
}

export function castDaliuren(input: CastDaliurenInput = {}): DivinationResult<DaliurenOutput> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(input.timezone, warnings);
  const resolved = resolveDateTime(input.date, timezone, warnings, 'now');
  const hour = input.hour ?? resolved.hour;
  const minute = input.minute ?? resolved.minute;
  const meta = createMeta('daliuren', timezone, `${resolved.date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`, 'taibu-core');

  try {
    const payload = calculateDaliuren({
      ...input,
      date: resolved.date,
      hour,
      minute,
      timezone,
      question: input.question?.trim() || undefined,
    });

    return {
      domain: 'daliuren',
      title: '大六壬排盘',
      subtitle: [payload.dateInfo.bazi, payload.keName].filter(Boolean).join(' · ') || resolved.date,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`大六壬排盘失败：${describeError(error)}`);
    return {
      domain: 'daliuren',
      title: '大六壬排盘',
      subtitle: '未能完成排盘',
      payload: null,
      meta,
      warnings,
    };
  }
}
