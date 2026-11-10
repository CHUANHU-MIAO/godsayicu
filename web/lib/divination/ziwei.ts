import { calculateZiwei } from 'taibu-core/ziwei';
import type { ZiweiInput, ZiweiOutput } from 'taibu-core/ziwei';
import { createMeta, describeError, formatBirthDateTime, normalizeTimezone } from './types';
import type { DivinationResult } from './types';

export type CastZiweiInput = ZiweiInput;

export function castZiwei(input: CastZiweiInput): DivinationResult<ZiweiOutput> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(input.timezone, warnings);
  const meta = createMeta(
    'ziwei',
    timezone,
    formatBirthDateTime(input.birthYear, input.birthMonth, input.birthDay, input.birthHour, input.birthMinute),
    'taibu-core',
  );

  try {
    const payload = calculateZiwei({ ...input, timezone });
    const soulPalace = payload.earthlyBranchOfSoulPalace
      ? `命宫在${payload.earthlyBranchOfSoulPalace}`
      : '';
    const subtitle = [payload.fiveElement, soulPalace].filter(Boolean).join(' · ') || payload.solarDate;

    return {
      domain: 'ziwei',
      title: '紫微斗数排盘',
      subtitle,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`紫微排盘失败：${describeError(error)}`);
    return {
      domain: 'ziwei',
      title: '紫微斗数排盘',
      subtitle: '未能完成排盘',
      payload: null,
      meta,
      warnings,
    };
  }
}
