import { calculateAstrology } from 'taibu-core/astrology';
import type { AstrologyInput, AstrologyOutput } from 'taibu-core/astrology';
import { createMeta, describeError, formatBirthDateTime, normalizeTimezone } from './types';
import type { DivinationResult } from './types';

/** 西洋占星入参较多，这里做薄封装：字段与 core 一致，仅补默认时区与统一结果结构 */
export type CastAstrologyInput = AstrologyInput;

export function castAstrology(input: CastAstrologyInput): DivinationResult<AstrologyOutput> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(input.timezone, warnings);
  const meta = createMeta(
    'astrology',
    timezone,
    formatBirthDateTime(
      input.birthYear,
      input.birthMonth,
      input.birthDay,
      input.birthHour,
      input.birthMinute,
    ),
    'taibu-core',
  );

  try {
    const payload = calculateAstrology({ ...input, timezone });

    return {
      domain: 'astrology',
      title: '西洋占星本命盘',
      subtitle: `${payload.natal.sunSign.label} · ${payload.chartMeta.houseSystem}`,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`占星排盘失败：${describeError(error)}`);
    return {
      domain: 'astrology',
      title: '西洋占星本命盘',
      subtitle: '未能完成排盘',
      payload: null,
      meta,
      warnings,
    };
  }
}
