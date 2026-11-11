'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import InterpretPanel from '@/components/interpret/InterpretPanel';
import { Disclaimer, ResultActions, StatePanel, TermTip, Toast } from '@/components/ui';
import HistoryDrawer from '@/components/history/HistoryDrawer';
import { buildLiuyaoReading, type ReadingPayload } from '@/lib/divination/liuyao-reading';
import { buildFortune, buildSynthesis, buildVerdict } from '@/lib/divination/liuyao-verdict';
import { LIUYAO_TERMS } from '@/lib/divination/liuyao-terms';
import styles from './result.module.css';

interface Yao {
  position: number;
  type: 0 | 1;
  isChanging?: boolean;
  change?: string;
  liuQin?: string;
  liuShen?: string;
  naJia?: string;
  wuXing?: string;
  isShiYao?: boolean;
  isYingYao?: boolean;
  kongWangState?: string;
  changedYao?: { liuQin?: string; naJia?: string; wuXing?: string } | null;
  shenSha?: string[];
}

interface Pillar {
  gan?: string;
  zhi?: string;
}

interface KongWangPillar {
  xun?: string;
  kongDizhi?: string[];
}

interface Payload {
  question?: string;
  hexagramName: string;
  hexagramGong: string;
  hexagramElement: string;
  changedHexagramName?: string;
  changedHexagramGong?: string;
  changedHexagramElement?: string;
  guaCi?: string;
  xiangCi?: string;
  changedGuaCi?: string;
  ganZhiTime?: { year?: Pillar; month?: Pillar; day?: Pillar; hour?: Pillar };
  kongWang?: { xun?: string; kongDizhi?: string[] };
  kongWangByPillar?: {
    year?: KongWangPillar;
    month?: KongWangPillar;
    day?: KongWangPillar;
    hour?: KongWangPillar;
  };
  fullYaos: Yao[];
  nuclearHexagram?: { name?: string };
  oppositeHexagram?: { name?: string };
  reversedHexagram?: { name?: string };
  yongShen?: unknown;
}

interface Result {
  title: string;
  subtitle: string;
  payload: Payload;
  warnings?: string[];
}

const POSITIONS = ['', '初', '二', '三', '四', '五', '上'];

function yaoName(position: number, type: 0 | 1): string {
  const numeral = type === 1 ? '九' : '六';
  if (position === 1) return `初${numeral}`;
  if (position === 6) return `上${numeral}`;
  return `${numeral}${POSITIONS[position] ?? ''}`;
}

function MiniLine({ yin, tone }: { yin: boolean; tone: 'solid' | 'moving' | 'idle' }) {
  return (
    <span className={styles.mini} data-tone={tone}>
      <i />
      {yin ? <i /> : null}
    </span>
  );
}

export default function LiuyaoResultPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [missing, setMissing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [expandedShenSha, setExpandedShenSha] = useState<number[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem('wen.liuyao.result');
    if (!raw) {
      setMissing(true);
      return;
    }
    try {
      setResult(JSON.parse(raw) as Result);
    } catch {
      setMissing(true);
    }
  }, []);

  if (missing) {
    return (
      <main className={styles.page}>
        <StatePanel
          state="empty"
          title="尚无卦象"
          description="请先完成一次起卦，排盘结果会显示在这里。"
          action={
            <Link href="/liuyao" className={styles.back}>
              前往起卦 →
            </Link>
          }
        />
      </main>
    );
  }

  if (!result) {
    return (
      <main className={styles.page}>
        <StatePanel state="loading" title="载入中…" skeletonRows={4} />
      </main>
    );
  }

  const payload = result.payload;
  const yaos = [...payload.fullYaos].sort((a, b) => b.position - a.position);
  const reading = buildLiuyaoReading(payload as unknown as ReadingPayload);
  const verdict = buildVerdict(payload as never);
  const fortune = buildFortune(payload.hexagramName);
  const movingCount = payload.fullYaos.filter((yao) => yao.isChanging).length;
  const synthesis = buildSynthesis(verdict, fortune, {
    movingCount,
    changedName: payload.changedHexagramName,
  });

  const pillars = [
    { key: 'year', label: '年' },
    { key: 'month', label: '月' },
    { key: 'day', label: '日' },
    { key: 'hour', label: '时' },
  ] as const;

  /** 把本页全部可见信息整理为纯文本，供「复制全文」使用 */
  function buildPlainText(): string {
    const lines: string[] = [];
    lines.push(
      `六爻 · ${payload.hexagramName}${payload.changedHexagramName ? ` 之 ${payload.changedHexagramName}` : ''}`,
    );
    lines.push(
      `${payload.hexagramGong}宫 · ${payload.hexagramElement}${
        payload.changedHexagramName
          ? `　→　${payload.changedHexagramGong ?? ''}宫 · ${payload.changedHexagramElement ?? ''}`
          : ''
      }`,
    );
    if (payload.question) lines.push(`所问：${payload.question}`);
    if (payload.ganZhiTime) {
      const gz = payload.ganZhiTime;
      lines.push(
        `四柱：${pillars
          .map((item) => `${item.label} ${gz[item.key]?.gan ?? ''}${gz[item.key]?.zhi ?? ''}`)
          .join('　')}`,
      );
    }
    lines.push('');
    lines.push('六爻详表（自上而下）：');
    yaos.forEach((yao) => {
      lines.push(
        [
          yaoName(yao.position, yao.type),
          yao.liuShen ?? '—',
          `${yao.liuQin ?? '—'} ${yao.naJia ?? ''}${yao.wuXing ?? ''}`,
          yao.isShiYao ? '世' : '',
          yao.isYingYao ? '应' : '',
          yao.kongWangState === 'kong' ? '旬空' : '',
          yao.isChanging ? '动爻' : '',
          yao.shenSha?.length ? yao.shenSha.join(' ') : '',
        ]
          .filter(Boolean)
          .join('　'),
      );
    });
    lines.push(
      `互卦 ${payload.nuclearHexagram?.name ?? '—'}　错卦 ${payload.oppositeHexagram?.name ?? '—'}　综卦 ${payload.reversedHexagram?.name ?? '—'}`,
    );
    if (verdict) {
      lines.push('');
      lines.push(`用神断（辅）：${verdict.text} · 用神 ${verdict.target}`);
      verdict.notes.forEach((note) => lines.push(`　${note}`));
    }
    if (fortune) {
      lines.push('');
      lines.push('卦象总断（主）');
      if (synthesis) lines.push(`合参：${synthesis.text}`);
      if (fortune.total) lines.push(`总断：${fortune.total}`);
      fortune.items.forEach(([name, text]) => lines.push(`${name}：${text}`));
    }
    if (payload.guaCi) {
      lines.push('');
      lines.push(`卦辞 · ${payload.hexagramName}：${payload.guaCi}`);
      if (payload.xiangCi) lines.push(`象辞：${payload.xiangCi}`);
    }
    if (payload.changedGuaCi) {
      lines.push(`变卦 · ${payload.changedHexagramName ?? ''}：${payload.changedGuaCi}`);
    }
    if (reading.length > 0) {
      lines.push('');
      lines.push('基础解读');
      reading.forEach((section) => {
        lines.push(`【${section.title}】`);
        section.paragraphs.forEach((text) => lines.push(text));
        section.notes?.forEach((note) => lines.push(`· ${note}`));
      });
    }
    const warnings = result?.warnings ?? [];
    if (warnings.length) {
      lines.push('');
      lines.push('提示');
      warnings.forEach((item) => lines.push(`· ${item}`));
    }
    lines.push('');
    lines.push('内容仅供传统术数文化学习参考，不构成决策建议。');
    return lines.join('\n');
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(buildPlainText());
      setToast('排盘全文已复制');
    } catch {
      setToast('复制未成功，请手动选取文字');
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/liuyao" className={styles.back}>
        ← 重新起卦
      </Link>

      <ResultActions
        caption="排盘完成 · 可复制留存或查阅术语"
        items={[
          {
            key: 'copy',
            label: '复制全文',
            hint: '把本页排盘内容复制为纯文本',
            onClick: copyAll,
            primary: true,
          },
          {
            key: 'terms',
            label: '术语说明',
            hint: '查看六爻术语释义',
            onClick: () => setTermsOpen(true),
          },
          {
            key: 'history',
            label: '问事录',
            hint: '查看本机留存的全部记录',
            href: '/history',
          },
          {
            key: 'again',
            label: '重新起卦',
            hint: '回到六爻入口',
            href: '/liuyao',
          },
        ]}
      />

      <div className={styles.layout}>
        {/* ================= 左：排盘 ================= */}
        <div className={styles.left}>
          <header className={styles.panHead}>
            <h1 className={styles.panTitle}>
              {payload.hexagramName}
              {payload.changedHexagramName ? (
                <em> 之 {payload.changedHexagramName}</em>
              ) : null}
            </h1>
            <p className={styles.panSub}>
              {payload.hexagramGong}宫 · {payload.hexagramElement}
              {payload.changedHexagramName
                ? `　→　${payload.changedHexagramGong ?? ''}宫 · ${payload.changedHexagramElement ?? ''}`
                : ''}
            </p>
            <div className={styles.headTools}>
              <HistoryDrawer domain="liuyao" />
            </div>
          </header>

          {payload.ganZhiTime ? (
            <div className={styles.pillars}>
              {pillars.map((item) => {
                const gz = payload.ganZhiTime?.[item.key];
                const kong = payload.kongWangByPillar?.[item.key]?.kongDizhi;
                return (
                  <div key={item.key} className={styles.pillar}>
                    <span className={styles.pillarLabel}>{item.label}</span>
                    <span className={styles.pillarGz}>
                      {gz?.gan ?? '—'}
                      {gz?.zhi ?? ''}
                    </span>
                    {kong && kong.length > 0 ? (
                      <span className={styles.pillarKong}>空{kong.join('')}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className={styles.table}>
            <div className={`${styles.tr} ${styles.thead}`}>
              <span>爻位</span>
              <span>六神</span>
              <span>六亲 · 干支</span>
              <span className={styles.center}>{payload.hexagramName}</span>
              <span className={styles.center}>
                {payload.changedHexagramName ?? '变卦'}
              </span>
              <span>变出</span>
              <span>神煞</span>
            </div>

            {yaos.map((yao) => {
              const yin = yao.type === 0;
              const changing = yao.isChanging ?? yao.change === 'changing';
              const changedYin = changing ? !yin : yin;
              const kong = yao.kongWangState === 'kong';
              const shenSha = yao.shenSha ?? [];

              return (
                <div key={yao.position} className={styles.tr} data-moving={changing || undefined}>
                  <span className={styles.cellPos}>{yaoName(yao.position, yao.type)}</span>
                  <span className={styles.cellShen}>{yao.liuShen ?? '—'}</span>
                  <span className={styles.cellQin}>
                    {yao.liuQin ?? '—'} {yao.naJia ?? ''}
                    {yao.wuXing ?? ''}
                    {kong ? <em className={styles.kong}> 旬空</em> : null}
                    {yao.isShiYao ? <b className={styles.shiying}>世</b> : null}
                    {yao.isYingYao ? <b className={styles.shiying}>应</b> : null}
                  </span>
                  <span className={styles.center}>
                    <MiniLine yin={yin} tone="solid" />
                  </span>
                  <span className={styles.center}>
                    <MiniLine yin={changedYin} tone={changing ? 'moving' : 'idle'} />
                  </span>
                  <span className={styles.cellChanged}>
                    {yao.changedYao?.liuQin
                      ? `${yao.changedYao.liuQin} ${yao.changedYao.naJia ?? ''}${yao.changedYao.wuXing ?? ''}`
                      : '—'}
                  </span>
                  <span className={styles.cellShenSha}>
                    {shenSha.length > 0 ? (
                      <>
                        {(expandedShenSha.includes(yao.position)
                          ? shenSha
                          : shenSha.slice(0, 2)
                        ).join(' ')}
                        {shenSha.length > 2 ? (
                          <button
                            type="button"
                            className={styles.more}
                            aria-expanded={expandedShenSha.includes(yao.position)}
                            onClick={() =>
                              setExpandedShenSha((prev) =>
                                prev.includes(yao.position)
                                  ? prev.filter((item) => item !== yao.position)
                                  : [...prev, yao.position],
                              )
                            }
                          >
                            {expandedShenSha.includes(yao.position)
                              ? ' 收起'
                              : ` +${shenSha.length - 2}`}
                          </button>
                        ) : null}
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.derived}>
            <span>互卦 {payload.nuclearHexagram?.name ?? '—'}</span>
            <span>错卦 {payload.oppositeHexagram?.name ?? '—'}</span>
            <span>综卦 {payload.reversedHexagram?.name ?? '—'}</span>
            <span className={styles.legend}>
              <b data-moving>×</b> 老阴动　<b>○</b> 老阳动
            </span>
          </div>

          {verdict ? (
            <section className={styles.verdict}>
              <div className={styles.verdictHead}>
                <div className={styles.verdictLead}>
                  <span className={styles.verdictLevel} data-level={verdict.level}>
                    {verdict.text}
                  </span>
                  <span className={styles.verdictKind}>用神断 · 辅</span>
                </div>
                <span className={styles.verdictTarget}>用神 · {verdict.target}</span>
              </div>
              <ul className={styles.verdictNotes}>
                {verdict.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p className={styles.disclaimer}>
                用神断依旺衰 / 动静 / 空亡，为辅助依据；下方卦象总断依本卦卦辞，不计用神与动变，为主。
              </p>
            </section>
          ) : null}

          {fortune ? (
            <section className={styles.fortune}>
              <h3 className={styles.fortuneTitle}>
                卦象总断
                <span className={styles.fortuneKind}>主</span>
              </h3>
              <p className={styles.fortuneBasis}>依本卦卦辞，不计用神与动变</p>
              {synthesis ? (
                <div className={styles.synthesis} data-level={synthesis.level}>
                  <em>合参</em>
                  <span>{synthesis.text}</span>
                </div>
              ) : null}
              {fortune.total ? (
                <div className={styles.fortuneTotal}>
                  <em>总断</em>
                  <span>{fortune.total}</span>
                </div>
              ) : null}
              {fortune.items.length > 0 ? (
                <div className={styles.fortuneGrid}>
                  {fortune.items.map(([name, text]) => (
                    <div key={name} className={styles.fortuneItem}>
                      <em>{name}</em>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        {/* ================= 右：卦辞与解读 ================= */}
        <div className={styles.right}>
          {payload.guaCi ? (
            <section className={styles.text}>
              <h2 className={styles.textTitle}>卦辞 · {payload.hexagramName}</h2>
              <p>{payload.guaCi}</p>
              {payload.xiangCi ? <p className={styles.xiang}>{payload.xiangCi}</p> : null}
            </section>
          ) : null}

          {payload.changedGuaCi ? (
            <section className={styles.text}>
              <h2 className={styles.textTitle}>变卦 · {payload.changedHexagramName}</h2>
              <p>{payload.changedGuaCi}</p>
            </section>
          ) : null}

          {reading.length > 0 ? (
            <section className={styles.reading}>
              <h2 className={styles.readingTitle}>基础解读</h2>
              {reading.map((section) => (
                <div key={section.title} className={styles.readingBlock}>
                  <h3 className={styles.readingHead}>{section.title}</h3>
                  {section.paragraphs.map((text, index) => (
                    <p key={index}>{text}</p>
                  ))}
                  {section.notes?.length ? (
                    <ul className={styles.notes}>
                      {section.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          <InterpretPanel domain="liuyao" payload={payload} question={payload.question} />

          {result.warnings?.length ? (
            <ul className={styles.warn}>
              {result.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <Disclaimer />
      <TermTip
        terms={LIUYAO_TERMS}
        hideTrigger
        open={termsOpen}
        onOpenChange={setTermsOpen}
        title="六爻术语说明"
      />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
