import { calculateTaiyi } from 'taibu-core/taiyi';
import type { TaiyiInput, TaiyiMode, TaiyiOutput } from 'taibu-core/taiyi';
import { createMeta, describeError, normalizeTimezone, resolveDateTime } from './types';
import type { DivinationResult } from './types';

export interface CastTaiyiInput
  extends Omit<TaiyiInput, 'mode' | 'date' | 'hour' | 'minute' | 'timezone'> {
  /** 默认按小时盘 */
  mode?: TaiyiMode;
  date?: string | Date;
  hour?: number;
  minute?: number;
  timezone?: string;
}

export function castTaiyi(input: CastTaiyiInput = {}): DivinationResult<TaiyiOutput> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(input.timezone, warnings);
  const resolved = resolveDateTime(input.date, timezone, warnings, 'now');
  const hour = input.hour ?? resolved.hour;
  const minute = input.minute ?? resolved.minute;
  const meta = createMeta(
    'taiyi',
    timezone,
    `${resolved.date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
    'taibu-core',
  );

  try {
    const payload = calculateTaiyi({
      ...input,
      mode: input.mode ?? 'hour',
      date: resolved.date,
      hour,
      minute,
      timezone,
      question: input.question?.trim() || undefined,
    });

    return {
      domain: 'taiyi',
      title: '太乙神数',
      subtitle: `${payload.datetimeContext.dayGanZhi}日 · ${payload.boardMeta.modeLabel}`,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`太乙排盘失败：${describeError(error)}`);
    return {
      domain: 'taiyi',
      title: '太乙神数',
      subtitle: '未能完成排盘',
      payload: null,
      meta,
      warnings,
    };
  }
}
