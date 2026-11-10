/**
 * 本地白话解读引擎（不依赖 AI、不依赖账号、不依赖网络）
 *
 * 定位：把「原始盘面数据」翻译成普通人能读的中文说明，是六爻 liuyao-reading.ts
 * 那套能力向其余术数的扩展。当前为骨架 + 文案模板，字段按 core 输出做容错提取；
 * 各域字段校核完成后可逐域替换成精确解析，接口保持不变。
 *
 * UI 先在 /lab 测试页展示，确认视觉方案后再接入正式结果页。
 */

export interface ReadingSection {
  heading: string;
  body: string;
  hint?: string;
}

export interface PlainReading {
  domain: string;
  label: string;
  lead: string;
  sections: ReadingSection[];
  footnote: string;
}

type Finder = (keys: string[]) => string | null;
type Builder = (find: Finder, payload: Record<string, unknown>) => ReadingSection[];

const LABELS: Record<string, string> = {
  liuyao: '六爻',
  tarot: '塔罗',
  ziwei: '紫微斗数',
  daliuren: '大六壬',
  almanac: '黄历',
  jiao: '杯筊',
  bazi: '八字',
  meihua: '梅花易数',
  qimen: '奇门遁甲',
};

/** 在对象树中按候选键名找第一个有意义的标量值 */
function makeFinder(payload: unknown): Finder {
  function walk(value: unknown, keys: string[], depth: number): string | null {
    if (depth > 5 || value === null || value === undefined) return null;

    if (Array.isArray(value)) {
      for (const item of value.slice(0, 10)) {
        const found = walk(item, keys, depth + 1);
        if (found) return found;
      }
      return null;
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      for (const key of keys) {
        const candidate = obj[key];
        if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
        if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
      }
      for (const nested of Object.values(obj)) {
        const found = walk(nested, keys, depth + 1);
        if (found) return found;
      }
    }

    return null;
  }

  return (keys: string[]) => walk(payload, keys, 0);
}

function valueOr(find: Finder, keys: string[], fallback: string): string {
  return find(keys) ?? fallback;
}

/** 统计数组型字段中逆位 / 动爻等标记的数量，用于生成分布说明 */
function countFlagged(payload: Record<string, unknown>, arrayKeys: string[], flagKeys: string[]): number {
  for (const key of arrayKeys) {
    const list = payload[key];
    if (!Array.isArray(list)) continue;
    return list.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Record<string, unknown>;
      return flagKeys.some((flag) => obj[flag] === true || obj[flag] === 1);
    }).length;
  }
  return -1;
}

const BUILDERS: Record<string, Builder> = {
  liuyao: (find) => [
    {
      heading: '本卦 · 当前局面',
      body: `得「${valueOr(find, ['hexagramName', 'guaName'], '本卦')}」，${valueOr(find, ['hexagramGong'], '卦宫')}所属。本卦说的是事情此刻的状态，先看清自己站在哪里，再谈进退。`,
    },
    {
      heading: '动爻 · 变化的起点',
      body: `变卦为「${valueOr(find, ['changedHexagramName', 'bianGuaName'], '依动爻而变')}」。动爻是整卦中最不安分的位置，它指向事情从哪里开始松动、往哪个方向走。`,
      hint: '世爻代表自己，应爻代表对方或外部环境，两者关系决定主动权在谁手里。',
    },
    {
      heading: '读卦次序',
      body: '先看本卦定基调，再看动爻找变量，最后看变卦知归趋。三者一致则势顺，彼此矛盾则宜缓，不宜只看一句吉凶。',
    },
  ],

  tarot: (find, payload) => {
    const cardCount = valueOr(find, ['cardCount', 'totalCards'], '若干');
    const reversed = countFlagged(payload, ['cards', 'drawnCards', 'positions'], ['reversed', 'isReversed']);
    return [
      {
        heading: '牌阵 · 提问的框架',
        body: `本次使用「${valueOr(find, ['spreadName', 'spread', 'spreadType'], '牌阵')}」，共 ${cardCount} 张牌。牌阵的每个位置各有职责——过去、当下、结果或阻碍——先认位置，再读牌义。`,
      },
      {
        heading: '正逆位 · 能量的方向',
        body:
          reversed >= 0
            ? `本阵出现 ${reversed} 张逆位。逆位不等于「坏」，更像是能量被压住、延后或转向内在；顺位牌是顺畅流动的部分，逆位牌是需要留意的提醒。`
            : '正位多主能量顺畅外显，逆位多主延后、内收或需再确认。读牌时把正逆位当作语气，而非好坏标签。',
      },
      {
        heading: '如何落地',
        body: '把整阵连成一句话：起因是什么、此刻卡在哪、往哪走会松。单张牌只给线索，牌与牌之间的关系才是答案。',
      },
    ];
  },

  meihua: (find) => [
    {
      heading: '体用 · 我与事',
      body: `本卦「${valueOr(find, ['hexagramName', 'benGuaName'], '依数起卦')}」，体卦代表问卦者，用卦代表所问之事。体用定下来，后面所有生克才有落点。`,
    },
    {
      heading: '生克 · 顺势与阻力',
      body: `体用关系判为「${valueOr(find, ['tiYongRelation', 'relation', 'shengKe'], '依卦气五行而断')}」。用生体、比和为顺；体生用为耗；用克体则阻力明显。吉凶不在卦名，在这层关系。`,
      hint: '梅花重「触机」，起卦那一刻的时间、数字、外物都是信息，不宜反复重起同一问题。',
    },
    {
      heading: '应期 · 何时见分晓',
      body: `应期参考「${valueOr(find, ['yingQi', 'timing'], '卦气旺衰与卦数')}」。动静之间，近应看日辰，远应看月令；卦气旺则速，衰则缓。`,
    },
  ],

  almanac: (find) => [
    {
      heading: '宜 · 顺势可为',
      body: `今日所宜「${valueOr(find, ['yi', 'suitable', 'goodFor'], '依干支神煞而定')}」。宜项是顺势的窗口，适合把已有准备的事推进一步。`,
    },
    {
      heading: '忌 · 宜避之事',
      body: `今日所忌「${valueOr(find, ['ji', 'avoid', 'badFor'], '依干支神煞而定')}」。忌项不是禁止，而是提醒同样的事今天要花更大力气，可另择日。`,
    },
    {
      heading: '冲煞与时辰',
      body: `日辰冲煞为「${valueOr(find, ['chongSha', 'chong', 'sha'], '依日干支推算')}」。一日之中十二时辰吉凶起伏，重要事项优先落在吉时。`,
      hint: '黄历是择时工具，用来减少阻力，不替代对事情本身的判断。',
    },
  ],

  jiao: (find) => [
    {
      heading: '筊相 · 得到的回应',
      body: `掷得「${valueOr(find, ['label', 'outcome'], '一筊')}」，其义为「${valueOr(find, ['meaning', 'interpretation'], '依筊相而定')}」。`,
    },
    {
      heading: '三筊之别',
      body: '一阴一阳为圣杯，表示允可与顺；两阳为笑杯，多是问法未清或时机未到；两阴为阴杯，示意此事不宜。',
    },
    {
      heading: '再问的分寸',
      body: '同一问题不宜连掷不休。若得笑杯，先把问题说得更具体；若得阴杯，隔日或换个角度再问更合适。',
    },
  ],

  bazi: (find) => [
    {
      heading: '四柱 · 时间的骨架',
      body: `四柱依「${valueOr(find, ['fourPillars', 'pillars', 'bazi'], '年月日时')}」排列。年柱看根基，月柱看格局，日柱看自身，时柱看归趋与晚景。`,
    },
    {
      heading: '日主 · 命局的中心',
      body: `日主为「${valueOr(find, ['dayMaster', 'dayGan', 'riZhu'], '依日柱天干而定')}」。其余七个字都围绕它论生克制化，先辨强弱，再谈喜忌。`,
      hint: '十神是关系词，不是褒贬：官杀管约束，印星管资源，财星管掌控，食伤管表达，比劫管同侪。',
    },
    {
      heading: '大运 · 流动的阶段',
      body: `大运「${valueOr(find, ['dayun', 'currentFortune', 'luckCycle'], '依阴阳顺逆排布')}」。命局是底色，大运是阶段性的天气，同一八字在不同运里表现可以很不一样。`,
    },
  ],

  ziwei: (find) => [
    {
      heading: '命宫 · 全盘的锚点',
      body: `命宫主星为「${valueOr(find, ['mingGongMainStar', 'mainStar', 'mingGong'], '依命宫星曜而定')}」，五行局「${valueOr(find, ['fiveElementsClass', 'wuXingJu'], '依命宫干支而定')}」。命宫定主题，其余十一宫都是它的展开。`,
    },
    {
      heading: '三方四正 · 别只看一宫',
      body: '命宫、财帛、官禄、迁移合看才完整。单宫星曜再好，也要看对宫有没有冲、会照的星是助力还是牵制；四化飞星则指出能量往哪里流动。',
      hint: '庙旺利落是星曜的亮度，不等于事情一定成；还要看宫位与四化。',
    },
    {
      heading: '大限 · 时间轴',
      body: `当前大限「${valueOr(find, ['daXian', 'currentDecade', 'majorLimit'], '依命宫起限')}」。本命盘讲禀赋，大限讲这十年被放大的是哪一组宫位。`,
    },
  ],

  qimen: (find) => [
    {
      heading: '局象 · 时空的切面',
      body: `此局「${valueOr(find, ['juName', 'ju', 'yinYang'], '依节气符头起局')}」，值符「${valueOr(find, ['zhiFu', 'valueSymbol'], '随时干而转')}」、值使「${valueOr(find, ['zhiShi', 'valueEnvoy'], '随时宫而落')}」。九宫是地图，八神九星八门是落在地图上的力量。`,
    },
    {
      heading: '用神落宫 · 事在何处',
      body: '先看所问之事对应哪一宫，再看该宫的门、星、神是吉是凶、是否门迫或击刑。宫位之间的生克，比单个符号更说明问题。',
      hint: '三奇六仪与天地盘干的关系，决定这件事是明面上推进，还是暗中有变。',
    },
    {
      heading: '方位与时机',
      body: '奇门原本用于择方择时。得吉门吉星之宫，可作为行动方位参考；凶格之宫宜避其锋，不必硬碰。',
    },
  ],

  daliuren: (find) => [
    {
      heading: '天地盘 · 底盘',
      body: `天地盘依「${valueOr(find, ['tianDiPan', 'panName', 'juName'], '月将加时')}」布列。天盘动、地盘静，两盘叠加之后，十二天将各归其位。`,
    },
    {
      heading: '四课 · 事情的来路',
      body: '四课由日干支逐级推出，从第一课到第四课，事情由近及远、由内而外展开。课中见克，是矛盾所在；课气相生，则脉络较顺。',
    },
    {
      heading: '三传 · 事情的走势',
      body: `三传为「${valueOr(find, ['sanChuan', 'threeTransmissions', 'chuan'], '初传、中传、末传')}」。初传看发端，中传看过程，末传看归结；三传的进退，就是这件事的时间线。`,
      hint: '六壬重「课传一体」，单看一传容易误判，须与四课、天将合参。',
    },
  ],
};

const DEFAULT_BUILDER: Builder = (find) => [
  {
    heading: '盘面结构',
    body: `本次排盘已生成完整结构「${valueOr(find, ['name', 'title', 'label'], '依输入参数而定')}」。建议先辨认各字段的层级关系，再看彼此的生克与呼应。`,
  },
  {
    heading: '读盘次序',
    body: '由整体到局部：先定基调，再找最关键的一两处变化，最后回到所问之事上落地。避免只盯着单一吉凶词。',
  },
];

/**
 * 生成白话解读。payload 允许为任意 core 输出，缺字段时自动降级为通用说明。
 */
export function buildPlainReading(domain: string, payload: unknown, subtitle?: string): PlainReading {
  const find = makeFinder(payload);
  const obj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const builder = BUILDERS[domain] ?? DEFAULT_BUILDER;

  return {
    domain,
    label: LABELS[domain] ?? domain,
    lead: subtitle
      ? `${LABELS[domain] ?? domain} · ${subtitle}。以下按盘面结构逐层说明，供理解象意，不替代自己的判断。`
      : `${LABELS[domain] ?? domain} 排盘已成。以下按盘面结构逐层说明，供理解象意，不替代自己的判断。`,
    sections: builder(find, obj),
    footnote: '以上为依据盘面结构的白话说明，用于术数学习与参考，不构成投资、医疗、法律或重大决策建议。',
  };
}
