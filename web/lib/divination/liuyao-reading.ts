/**
 * 六爻本地解读生成器。
 * 只做纯文本推导，不依赖 AI，也不引入 taibu-core 运行时。
 * 入参为 LiuyaoOutput 的子集，字段全部可选，避免结果结构变化时崩溃。
 */

export interface ReadingSection {
  title: string;
  paragraphs: string[];
  notes?: string[];
}

interface YaoLite {
  position: number;
  type: 0 | 1;
  change?: string;
  liuQin?: string;
  naJia?: string;
  wuXing?: string;
  isShiYao?: boolean;
  isYingYao?: boolean;
}

interface YongShenSelected {
  liuQin?: string;
  naJia?: string;
  element?: string;
  position?: number;
  strengthLabel?: string;
  movementLabel?: string;
  specialStatus?: string;
  kongWangState?: string;
  isShiYao?: boolean;
  isYingYao?: boolean;
  evidence?: string[];
}

interface YongShenGroup {
  targetLiuQin?: string;
  selected?: YongShenSelected;
  selectionNote?: string;
}

interface ShenPair {
  targetLiuQin?: string;
  jiShen?: { liuQin?: string; wuXing?: string; positions?: number[] };
  chouShen?: { liuQin?: string; wuXing?: string; positions?: number[] };
}

export interface ReadingPayload {
  hexagramName?: string;
  hexagramGong?: string;
  hexagramElement?: string;
  hexagramBrief?: string;
  changedHexagramName?: string;
  changedHexagramGong?: string;
  changedHexagramElement?: string;
  fullYaos?: YaoLite[];
  yongShen?: YongShenGroup[];
  shenSystemByYongShen?: ShenPair[];
  liuChongGuaInfo?: { isLiuChongGua?: boolean };
  liuHeGuaInfo?: { isLiuHeGua?: boolean };
  guaFanFuYin?: { isFanYin?: boolean; isFuYin?: boolean };
  sanHeAnalysis?: {
    hasFullSanHe?: boolean;
    fullSanHeList?: Array<{ name?: string; description?: string }>;
  };
  timeRecommendations?: Array<{
    targetLiuQin?: string;
    trigger?: string;
    description?: string;
    basis?: string[];
  }>;
  guaShen?: { branch?: string; absent?: boolean };
}

const POSITION_NAMES = ['', '初', '二', '三', '四', '五', '上'];

function positionName(value: number | undefined): string {
  if (!value || value < 1 || value > 6) return '';
  return POSITION_NAMES[value] ?? '';
}

function yaoName(yao: YaoLite): string {
  const numeral = yao.type === 1 ? '九' : '六';
  if (yao.position === 1) return `初${numeral}`;
  if (yao.position === 6) return `上${numeral}`;
  return `${numeral}${positionName(yao.position)}`;
}

export function buildLiuyaoReading(payload: ReadingPayload): ReadingSection[] {
  const sections: ReadingSection[] = [];

  // 一、卦象总览
  const gua: string[] = [];
  if (payload.hexagramName) {
    const gong = payload.hexagramGong ? `${payload.hexagramGong}宫` : '';
    const element = payload.hexagramElement ? `属${payload.hexagramElement}` : '';
    const brief = payload.hexagramBrief ? `，卦象主「${payload.hexagramBrief}」` : '';
    gua.push(`本卦为「${payload.hexagramName}」${gong}${element}${brief}。`);
  }

  const moving = (payload.fullYaos ?? []).filter((yao) => yao.change === 'changing');
  if (payload.changedHexagramName) {
    const gong = payload.changedHexagramGong ? `（${payload.changedHexagramGong}宫）` : '';
    gua.push(`动爻既现，变卦为「${payload.changedHexagramName}」${gong}，可参其去向。`);
  }

  if (moving.length > 0) {
    const names = moving
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((yao) => `${yaoName(yao)}（${yao.liuQin ?? ''}${yao.naJia ?? ''}${yao.wuXing ?? ''}）`);
    gua.push(`动爻：${names.join('、')}。动则有变，所问之事的关节多在此处。`);
  } else {
    gua.push('六爻安静，无动爻，格局相对稳定，以卦象与用神旺衰为主断。');
  }

  if (gua.length > 0) {
    sections.push({ title: '卦象', paragraphs: gua });
  }

  // 二、用神
  const yong = payload.yongShen?.[0];
  if (yong?.selected) {
    const selected = yong.selected;
    const lines: string[] = [];

    const role = selected.isShiYao ? '，临世爻' : selected.isYingYao ? '，居应爻' : '';
    lines.push(
      `以「${yong.targetLiuQin ?? '用神'}」为用神。用神取${positionName(selected.position)}爻（${selected.liuQin ?? ''}${selected.naJia ?? ''}${selected.element ?? ''}）${role}。`,
    );

    const states: string[] = [];
    if (selected.strengthLabel) states.push(selected.strengthLabel);
    if (selected.movementLabel) states.push(selected.movementLabel);
    if (selected.kongWangState === 'kong') states.push('空亡');
    if (selected.specialStatus && selected.specialStatus !== 'none') states.push(selected.specialStatus);
    if (states.length > 0) {
      lines.push(`用神状态：${states.join('、')}。`);
    }

    if (yong.selectionNote) {
      lines.push(yong.selectionNote);
    }

    sections.push({ title: '用神', paragraphs: lines, notes: selected.evidence });
  }

  // 三、忌神与仇神
  const shen = payload.shenSystemByYongShen?.[0];
  if (shen?.jiShen || shen?.chouShen) {
    const lines: string[] = [];
    if (shen.jiShen?.liuQin) {
      const positions = (shen.jiShen.positions ?? []).map((n) => positionName(n)).join('、');
      lines.push(
        `忌神为${shen.jiShen.liuQin}（${shen.jiShen.wuXing ?? ''}）${positions ? `，落${positions}爻` : ''}，克制用神则不利。`,
      );
    }
    if (shen.chouShen?.liuQin) {
      const positions = (shen.chouShen.positions ?? []).map((n) => positionName(n)).join('、');
      lines.push(
        `仇神为${shen.chouShen.liuQin}（${shen.chouShen.wuXing ?? ''}）${positions ? `，落${positions}爻` : ''}。`,
      );
    }
    if (lines.length > 0) {
      sections.push({ title: '忌神与仇神', paragraphs: lines });
    }
  }

  // 四、格局
  const patterns: string[] = [];
  if (payload.liuChongGuaInfo?.isLiuChongGua) patterns.push('六冲卦，主散、主动，事多反复。');
  if (payload.liuHeGuaInfo?.isLiuHeGua) patterns.push('六合卦，主合、主成，事多牵连。');
  if (payload.guaFanFuYin?.isFanYin) patterns.push('卦逢反吟，事有反复，进退不定。');
  if (payload.guaFanFuYin?.isFuYin) patterns.push('卦逢伏吟，事多停滞，宜静守。');

  for (const item of payload.sanHeAnalysis?.fullSanHeList ?? []) {
    if (item.name) {
      patterns.push(`三合局：${item.name}。${item.description ?? ''}`.trim());
    }
  }

  if (payload.guaShen) {
    patterns.push(
      payload.guaShen.absent
        ? '卦身不上卦，事无定体，宜审势而行。'
        : `卦身在${payload.guaShen.branch ?? '—'}。`,
    );
  }

  if (patterns.length > 0) {
    sections.push({ title: '格局', paragraphs: patterns });
  }

  // 五、应期
  const times = payload.timeRecommendations ?? [];
  if (times.length > 0) {
    sections.push({
      title: '应期',
      paragraphs: times.map((item) =>
        `${item.trigger ?? ''}：${item.description ?? ''}`.replace(/^：/, ''),
      ),
      notes: times.flatMap((item) => item.basis ?? []),
    });
  }

  return sections;
}
