'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import InterpretPanel from '@/components/interpret/InterpretPanel';
import { buildLiuyaoReading, type ReadingPayload } from '@/lib/divination/liuyao-reading';
import { buildFortune, buildSynthesis, buildVerdict } from '@/lib/divination/liuyao-verdict';
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
        <p className={styles.empty}>尚无卦象</p>
        <Link href="/liuyao" className={styles.back}>
          前往起卦 →
        </Link>
      </main>
    );
  }

  if (!result) {
    return (
      <main className={styles.page}>
        <p className={styles.empty}>载入中…</p>
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

  return (
    <main className={styles.page}>
      <Link href="/liuyao" className={styles.back}>
        ← 重新起卦
      </Link>

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
                        {shenSha.slice(0, 2).join(' ')}
                        {shenSha.length > 2 ? <em> +{shenSha.length - 2}</em> : null}
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
    </main>
  );
}
