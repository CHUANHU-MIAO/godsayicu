/**
 * 六爻断语与运势分断。
 * 用神断：基于 core 的用神旺衰、动静、空亡与来源（卦中 / 变出 / 伏藏 / 代用）。
 * 卦象总断：取自本卦的白话数据（gua-baihua）中的运势分项，只看卦辞，不看用神。
 * 合参：两套体系在这里汇合为一句结论，以卦象总断为主、用神断为辅。
 */
import { GUA_FORTUNE } from '@/lib/data/gua-fortune';

export interface VerdictResult {
  level: 'ji' | 'ping' | 'xiong';
  text: string;
  target: string;
  notes: string[];
  /** 用神是否真的现于卦中；不上卦（伏藏 / 月建代用）时为 false */
  manifested: boolean;
  /** 供「合参」复用的一句用神概况 */
  targetSummary: string;
}

export interface FortuneBlock {
  total?: string;
  items: Array<[string, string]>;
}

interface YaoLike {
  isChanging?: boolean;
}

interface SelectedLike {
  strength?: string;
  isChanging?: boolean;
  kongWangState?: string;
  /** 用神来源：board（卦中）/ changed（变出）/ fushen（伏藏）/ temporal（月建日辰代用） */
  source?: string;
  naJia?: string;
  movementLabel?: string;
  evidence?: string[];
}

interface PayloadLike {
  yongShen?: Array<{ targetLiuQin?: string; selected?: SelectedLike }>;
  fullYaos?: YaoLike[];
}

export function buildVerdict(payload: PayloadLike | null | undefined): VerdictResult | null {
  const group = payload?.yongShen?.[0];
  const selected = group?.selected;
  if (!group || !selected) return null;

  const target = group.targetLiuQin ?? '用神';
  const source = selected.source ?? 'board';
  const manifested = source !== 'temporal' && source !== 'fushen';

  let score = 0;
  const notes: string[] = [];
  let targetSummary = `用神${target}气平`;

  if (source === 'temporal') {
    // 用神不上卦、以月建日辰代用：气虽可论，但事无落点，不能当作「用神有气」加分
    const label = selected.movementLabel ?? '月建';
    const branch = selected.naJia ?? '';
    notes.push(`用神${target}不上卦，以${label}${branch}代用，气虽旺而事未落定。`);
    targetSummary = `用神${target}不上卦，借${label}${branch}之气`;
  } else if (source === 'fushen') {
    if (selected.strength === 'strong') {
      score += 1;
      notes.push(`用神${target}伏藏，伏神有用，尚待引出。`);
      targetSummary = `用神${target}伏藏有用`;
    } else if (selected.strength === 'weak') {
      score -= 2;
      notes.push(`用神${target}伏藏且难出，当下无着力处。`);
      targetSummary = `用神${target}伏藏难出`;
    } else {
      notes.push(`用神${target}伏藏，气平，待时而出。`);
      targetSummary = `用神${target}伏藏待出`;
    }
  } else if (selected.strength === 'strong') {
    score += 2;
    notes.push('用神有气，底气较足。');
    targetSummary = `用神${target}有气`;
  } else if (selected.strength === 'weak') {
    score -= 2;
    notes.push('用神无气，当下阻力偏大。');
    targetSummary = `用神${target}无气`;
  }

  if (selected.isChanging) {
    score += 1;
    notes.push('用神发动，事情正在变化。');
  }

  if (selected.kongWangState === 'kong') {
    score -= 1;
    notes.push('用神空亡，所问之事尚未落实。');
  }

  for (const evidence of (selected.evidence ?? []).slice(0, 3)) {
    if (!evidence) continue;
    // 不上卦 / 代用 已按来源说明，避免同一处既写「有气」又写「不上卦」
    if (/不上卦|代用/.test(evidence)) continue;
    if (!notes.includes(evidence)) notes.push(evidence);
  }

  const movingCount = (payload?.fullYaos ?? []).filter((yao) => yao.isChanging).length;
  if (movingCount === 0) notes.push('六爻安静，局面暂时稳定，主动推动才会改变。');
  if (movingCount >= 4) notes.push('动爻偏多，头绪纷乱，宜先抓最关键的一件事。');

  const level: VerdictResult['level'] = score >= 2 ? 'ji' : score <= -2 ? 'xiong' : 'ping';

  return {
    level,
    text: level === 'ji' ? '倾向可行' : level === 'xiong' ? '暂宜缓行' : '宜守待时',
    target,
    notes: notes.slice(0, 5),
    manifested,
    targetSummary,
  };
}

/** 卦名在两组数据里可能用「遁 / 遯」等异体字，做一次双向回退 */
function lookupFortune(name: string) {
  return (
    GUA_FORTUNE[name] ??
    GUA_FORTUNE[name.replace('遯', '遁')] ??
    GUA_FORTUNE[name.replace('遁', '遯')]
  );
}

export function buildFortune(hexagramName: string | undefined): FortuneBlock | null {
  if (!hexagramName) return null;

  const section = lookupFortune(hexagramName);
  if (!section) return null;

  const total = typeof section.t === 'string' ? section.t : undefined;
  const items: Array<[string, string]> = Array.isArray(section.it)
    ? section.it.filter(
        (item: unknown): item is [string, string] =>
          Array.isArray(item) && item.length >= 2 && typeof item[0] === 'string' && typeof item[1] === 'string',
      )
    : [];

  if (!total && items.length === 0) return null;
  return { total, items };
}

export interface SynthesisResult {
  level: 'ji' | 'ping' | 'xiong';
  text: string;
}

/**
 * 卦辞基调：只认开头的吉凶定调（「凶中带小吉」「吉中带凶」），
 * 正文里的吉凶字眼不参与判断，避免逐词统计把意思读反。
 */
function fortuneTone(total?: string): 'ji' | 'xiong' | 'neutral' {
  if (!total) return 'neutral';
  const head = total.slice(0, 8);
  if (/^(大)?凶/.test(head)) return 'xiong';
  if (/^(大)?吉/.test(head)) return 'ji';
  return 'neutral';
}

/** 卦辞为主、用神为辅：两套体系的结论只在这里汇合，不再各自另判一次 */
const SYNTHESIS: Record<
  'ji' | 'xiong' | 'neutral',
  Record<VerdictResult['level'], string>
> = {
  xiong: {
    ji: '卦象偏阻，唯用神得气可作支撑，事可为而势未至，宜缓图',
    ping: '卦象偏阻，用神亦无助力，宜守待时',
    xiong: '卦象与用神俱不利，宜止不宜进',
  },
  ji: {
    ji: '卦象顺、用神亦得力，可顺势而进',
    ping: '卦象顺而用神平平，可进，不宜全押',
    xiong: '卦象虽顺，用神无力，宜借势而行，勿独力强推',
  },
  neutral: {
    ji: '卦象平顺，用神得气，可图为上',
    ping: '卦象与用神皆平，事在两可，宜看后续变化',
    xiong: '卦象平平，用神无力，宜退守静观',
  },
};

const VERDICT_ONLY: Record<VerdictResult['level'], string> = {
  ji: '用神得气，可图',
  ping: '事在两可，宜守',
  xiong: '用神无力，宜缓',
};

export function buildSynthesis(
  verdict: VerdictResult | null,
  fortune: FortuneBlock | null,
  meta: { movingCount: number; changedName?: string },
): SynthesisResult | null {
  if (!verdict) return null;

  let tail = '六爻安静，局面暂稳。';
  if (meta.movingCount > 0) {
    const count = meta.movingCount === 1 ? '一爻独发' : `${meta.movingCount}爻发动`;
    tail = meta.changedName
      ? `${count}，之卦${meta.changedName}，转机在变。`
      : `${count}，变数已现。`;
  }

  // 没有卦辞数据时退回用神断，避免只剩半套依据
  if (!fortune) {
    return {
      level: verdict.level,
      text: `${verdict.targetSummary}；${VERDICT_ONLY[verdict.level]}；${tail}`,
    };
  }

  const tone = fortuneTone(fortune.total);
  const body = SYNTHESIS[tone][verdict.level];

  // 卦辞为主（±2），用神为辅（±1）
  const score =
    (tone === 'ji' ? 2 : tone === 'xiong' ? -2 : 0) +
    (verdict.level === 'ji' ? 1 : verdict.level === 'xiong' ? -1 : 0);
  const level: SynthesisResult['level'] = score >= 2 ? 'ji' : score <= -2 ? 'xiong' : 'ping';

  return { level, text: `${verdict.targetSummary}；${body}；${tail}` };
}
