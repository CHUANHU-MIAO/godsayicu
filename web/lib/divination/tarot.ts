import { calculateTarot } from 'taibu-core/tarot';
import type { TarotInput, TarotOutput } from 'taibu-core/tarot';
import { createMeta, describeError, nowInTimezone, normalizeTimezone } from './types';
import type { DivinationResult } from './types';

export type CastTarotInput = TarotInput;

const DEFAULT_SPREAD = 'single';

export async function castTarot(input: CastTarotInput = {}): Promise<DivinationResult<TarotOutput>> {
  const warnings: string[] = [];
  const timezone = normalizeTimezone(undefined, warnings);
  const now = nowInTimezone(timezone);
  const meta = createMeta('tarot', timezone, now.dateTime, 'taibu-core');

  try {
    const payload = await calculateTarot({
      ...input,
      spreadType: input.spreadType ?? DEFAULT_SPREAD,
      question: input.question?.trim() || undefined,
    });

    if (payload.cards.length === 0) {
      warnings.push('牌阵未抽出任何牌，请检查牌阵配置');
    }

    return {
      domain: 'tarot',
      title: '塔罗抽牌',
      subtitle: payload.spreadName,
      payload,
      meta,
      warnings,
    };
  } catch (error) {
    warnings.push(`塔罗抽牌失败：${describeError(error)}`);
    return {
      domain: 'tarot',
      title: '塔罗抽牌',
      subtitle: '未能完成抽牌',
      payload: null,
      meta,
      warnings,
    };
  }
}
