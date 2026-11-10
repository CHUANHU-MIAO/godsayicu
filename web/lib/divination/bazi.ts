import { calculateBazi } from 'taibu-core/bazi';
import { calculateBaziDayun } from 'taibu-core/bazi-dayun';
import type { BaziInput, BaziOutput } from 'taibu-core/bazi';
import type { DayunOutput } from 'taibu-core/bazi-dayun';
import { createMeta, describeError, formatBirthDateTime, normalizeTimezone } from './types';
import type { DivinationResult } from './types';

export interface CastBaziInput extends Omit<BaziInput, 'timezone'> {
  timezone?: string;
  /** 大运起运流派：1 = 按天数折算，2 = 按节气精确折算 */
  yunSect?: 1 | 2;
}

export interface BaziPayload {
  bazi: BaziOutput;
  /** 大运计算失败时为 null，错误写入 warnings */
  dayun: DayunOutput | null;
}

function pillarText(value: { stem: string; branch: string } | undefined): string {
  return value ? `${value.stem}${value.branch}` : '';
}

export function castBazi(input: CastBaziInput): DivinationResult<BaziPayload> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(input.timezone, warnings);
  const meta = createMeta(
    'bazi',
    timezone,
    formatBirthDateTime(
      input.birthYear,
      input.birthMonth,
      input.birthDay,
      input.birthHour ?? 0,
      input.birthMinute,
    ),
    'taibu-core',
  );

  let bazi: BaziOutput;
  try {
    bazi = calculateBazi({ ...input, timezone });
  } catch (error) {
    warnings.push(`八字排盘失败：${describeError(error)}`);
    return {
      domain: 'bazi',
      title: '八字排盘',
      subtitle: '未能完成排盘',
      payload: null,
      meta,
      warnings,
    };
  }

  let dayun: DayunOutput | null = null;
  try {
    dayun = calculateBaziDayun({ ...input, timezone, yunSect: input.yunSect });
  } catch (error) {
    warnings.push(`大运计算失败：${describeError(error)}`);
  }

  const subtitle =
    [
      pillarText(bazi.fourPillars.year),
      pillarText(bazi.fourPillars.month),
      pillarText(bazi.fourPillars.day),
      pillarText(bazi.fourPillars.hour),
    ]
      .filter(Boolean)
      .join(' ') || `${input.birthYear}-${input.birthMonth}-${input.birthDay}`;

  return {
    domain: 'bazi',
    title: '八字排盘',
    subtitle,
    payload: { bazi, dayun },
    meta,
    warnings,
  };
}
