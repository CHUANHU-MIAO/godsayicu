import { calculateMeihua } from 'taibu-core/meihua';
import type { MeihuaInput, MeihuaOutput } from 'taibu-core/meihua';
import {
  appendWarnings,
  createMeta,
  describeError,
  normalizeTimezone,
  resolveDateTime,
} from './types';
import type { DivinationResult } from './types';

export interface CastMeihuaInput extends Omit<MeihuaInput, 'date' | 'question'> {
  question?: string;
  date?: string | Date;
  /** 梅花核心固定使用 Asia/Shanghai；传入其他时区会给出提示 */
  timezone?: string;
}

const DEFAULT_QUESTION = '综合占问';

export function castMeihua(input: CastMeihuaInput = {}): DivinationResult<MeihuaOutput> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(input.timezone, warnings);
  if (timezone !== 'Asia/Shanghai') {
    warnings.push('梅花易数核心固定按 Asia/Shanghai 计算，已忽略传入时区');
  }
  const resolved = resolveDateTime(input.date, timezone, warnings);
  const meta = createMeta('meihua', timezone, resolved.dateTime, 'taibu-core');

  try {
    const payload = calculateMeihua({
      ...input,
      question: input.question?.trim() || DEFAULT_QUESTION,
      date: resolved.dateTime,
      method: input.method ?? 'time',
    });

    appendWarnings(warnings, payload.warnings);

    const subtitle = payload.changedHexagram
      ? `${payload.mainHexagram.name} → ${payload.changedHexagram.name}`
      : payload.mainHexagram.name;

    return {
      domain: 'meihua',
      title: '梅花易数',
      subtitle,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`梅花易数起卦失败：${describeError(error)}`);
    return {
      domain: 'meihua',
      title: '梅花易数',
      subtitle: '未能完成起卦',
      payload: null,
      meta,
      warnings,
    };
  }
}
