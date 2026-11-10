import { calculateLiuyao } from 'taibu-core/liuyao';
import type { LiuyaoInput, LiuyaoOutput } from 'taibu-core/liuyao';
import {
  appendWarnings,
  createMeta,
  describeError,
  normalizeTimezone,
  resolveDateTime,
} from './types';
import type { DivinationResult } from './types';

export interface CastLiuyaoInput {
  question?: string;
  yongShenTargets?: LiuyaoInput['yongShenTargets'];
  yaoValues?: number[];
  date?: string | Date;
  timezone?: string;
  method?: LiuyaoInput['method'];
  numbers?: number[];
  seed?: string;
  seedScope?: string;
  detailLevel?: LiuyaoInput['detailLevel'];
}

const DEFAULT_QUESTION = '综合占问';
const DEFAULT_YONG_SHEN: NonNullable<LiuyaoInput['yongShenTargets']> = ['官鬼'];

export async function castLiuyao(
  input: CastLiuyaoInput = {},
): Promise<DivinationResult<LiuyaoOutput>> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(input.timezone, warnings);
  const resolved = resolveDateTime(input.date, timezone, warnings, 'now');
  const method =
    input.method ??
    (input.yaoValues?.length ? 'coins' : input.numbers?.length ? 'number' : 'auto');

  const meta = createMeta('liuyao', timezone, resolved.dateTime, 'taibu-core');

  try {
    const payload = await calculateLiuyao({
      question: input.question?.trim() || DEFAULT_QUESTION,
      yongShenTargets: input.yongShenTargets?.length ? input.yongShenTargets : DEFAULT_YONG_SHEN,
      method,
      yaoValues: input.yaoValues,
      numbers: input.numbers,
      seed: input.seed,
      seedScope: input.seedScope,
      detailLevel: input.detailLevel,
      date: resolved.dateTime,
      timezone,
    });

    appendWarnings(warnings, payload.warnings);

    const subtitle =
      [payload.hexagramName, payload.changedHexagramName].filter(Boolean).join(' → ') || '六爻卦盘';

    return {
      domain: 'liuyao',
      title: '六爻起卦',
      subtitle,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`六爻起卦失败：${describeError(error)}`);
    return {
      domain: 'liuyao',
      title: '六爻起卦',
      subtitle: '未能完成起卦',
      payload: null,
      meta,
      warnings,
    };
  }
}
