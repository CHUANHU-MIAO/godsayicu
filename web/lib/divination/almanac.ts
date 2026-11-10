import { calculateDailyAlmanac } from 'taibu-core/almanac';
import type { AlmanacInput, AlmanacOutput } from 'taibu-core/almanac';
import { createMeta, describeError, normalizeTimezone, resolveDateTime } from './types';
import type { DivinationResult } from './types';

export interface CastAlmanacInput extends Omit<AlmanacInput, 'date' | 'timezone'> {
  date?: string | Date;
  timezone?: string;
}

export async function castAlmanac(
  input: CastAlmanacInput = {},
): Promise<DivinationResult<AlmanacOutput>> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(input.timezone, warnings);
  const resolved = resolveDateTime(input.date, timezone, warnings);
  const meta = createMeta('almanac', timezone, resolved.dateTime, 'taibu-core');

  try {
    const payload = await calculateDailyAlmanac({
      dayMaster: input.dayMaster,
      birthYear: input.birthYear,
      birthMonth: input.birthMonth,
      birthDay: input.birthDay,
      birthHour: input.birthHour,
      date: resolved.date,
      timezone,
    });

    return {
      domain: 'almanac',
      title: '每日黄历',
      subtitle: `${payload.date} ${payload.dayInfo.ganZhi} · ${payload.almanac.lunarDate}`,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`黄历查询失败：${describeError(error)}`);
    return {
      domain: 'almanac',
      title: '每日黄历',
      subtitle: '未能完成查询',
      payload: null,
      meta,
      warnings,
    };
  }
}
