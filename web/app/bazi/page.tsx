'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field, Spinner } from '@/components/ui';
import styles from './bazi.module.css';

interface HiddenStem {
  stem: string;
  qiType: string;
  tenGod: string;
}

interface PillarInfo {
  stem: string;
  branch: string;
  tenGod?: string;
  hiddenStems: HiddenStem[];
  naYin?: string;
  diShi?: string;
  shenSha: string[];
  kongWang: { isKong: boolean };
}

interface DayunStep {
  startYear: number;
  startAge: number;
  ganZhi: string;
  stem: string;
  branch: string;
  tenGod: string;
  branchTenGod: string;
  naYin: string;
  diShi: string;
  shenSha: string[];
}

interface DayunOutput {
  startAge: number;
  startAgeDetail: string;
  startSolar?: string;
  direction?: 'forward' | 'backward';
  yunSect?: 1 | 2;
  list: DayunStep[];
}

interface BaziOutput {
  gender: 'male' | 'female';
  dayMaster: string;
  kongWang: { xun: string; kongZhi: [string, string] };
  fourPillars: {
    year: PillarInfo;
    month: PillarInfo;
    day: PillarInfo;
    hour?: PillarInfo;
  };
  relations: Array<{ type: string; pillars: string[]; description: string }>;
  taiYuan?: string;
  mingGong?: string;
}

interface BaziPayload {
  bazi: BaziOutput;
  dayun: DayunOutput | null;
}

interface BaziResult {
  subtitle: string;
  payload: BaziPayload | null;
  warnings: string[];
  meta?: { timezone: string; effectiveDate: string };
}

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const HOURS = Array.from({ length: 24 }, (_, hour) => {
  const branch = BRANCHES[Math.floor(((hour + 1) % 24) / 2)];
  return { value: hour, label: `${String(hour).padStart(2, '0')} 时 · ${branch}时` };
});

const PILLAR_LABELS = [
  { key: 'year', label: '年柱' },
  { key: 'month', label: '月柱' },
  { key: 'day', label: '日柱' },
  { key: 'hour', label: '时柱' },
] as const;

export default function BaziPage() {
  const [year, setYear] = useState('1990');
  const [month, setMonth] = useState('6');
  const [day, setDay] = useState('15');
  const [hour, setHour] = useState('14');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<BaziResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function cast() {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    const h = Number(hour);
    if (
      !Number.isInteger(y) ||
      y < 1900 ||
      y > 2100 ||
      !Number.isInteger(m) ||
      m < 1 ||
      m > 12 ||
      !Number.isInteger(d) ||
      d < 1 ||
      d > 31
    ) {
      setError('请输入有效的出生年月日');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/divination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: 'bazi',
          input: {
            birthYear: y,
            birthMonth: m,
            birthDay: d,
            birthHour: h,
            gender,
            timezone: 'Asia/Shanghai',
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? '排盘失败');
      if (!data?.payload) throw new Error(data?.warnings?.[0] ?? '未能完成排盘');
      setResult(data as BaziResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '排盘失败');
    } finally {
      setLoading(false);
    }
  }

  const bazi = result?.payload?.bazi;
  const dayun = result?.payload?.dayun;
  const pillars = bazi
    ? PILLAR_LABELS.map((item) => ({
        ...item,
        pillar: bazi.fourPillars[item.key],
      })).filter((item): item is typeof item & { pillar: PillarInfo } => Boolean(item.pillar))
    : [];

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <p className={styles.eyebrow}>八字 · 子平</p>
        <h1 className={styles.title}>排 盘</h1>
        <p className={styles.sub}>四柱八字，大运流转</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.left}>
      <Card variant="outline" className={styles.panel}>
        <div className={styles.dateRow}>
          <Field
            type="number"
            label="年"
            min={1900}
            max={2100}
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
          <Field
            type="number"
            label="月"
            min={1}
            max={12}
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
          <Field
            type="number"
            label="日"
            min={1}
            max={31}
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
        </div>

        <div className={styles.metaRow}>
          <Field
            as="select"
            label="出生时辰"
            value={hour}
            onChange={(event) => setHour(event.target.value)}
          >
            {HOURS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Field>
          <Field
            as="select"
            label="性别"
            value={gender}
            onChange={(event) => setGender(event.target.value as 'male' | 'female')}
          >
            <option value="male">乾造 · 男</option>
            <option value="female">坤造 · 女</option>
          </Field>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={cast}>
          排 盘
        </Button>

        <p className={styles.hint}>默认按北京时间排盘，出生时辰未知可暂选一柱参考。</p>
      </Card>

      {loading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : null}

      {bazi && result?.payload ? (
        <Card variant="outline" className={styles.brief}>
          <span className={styles.briefLabel}>概 要</span>
          <div className={styles.briefGrid}>
            <div className={styles.briefItem}>
              <em>日主</em>
              <span>{bazi.dayMaster}</span>
            </div>
            <div className={styles.briefItem}>
              <em>月令</em>
              <span>{bazi.fourPillars.month.branch}</span>
            </div>
            <div className={styles.briefItem}>
              <em>起运</em>
              <span>{dayun ? `${dayun.startAge} 岁` : '—'}</span>
            </div>
            <div className={styles.briefItem}>
              <em>空亡</em>
              <span>{bazi.kongWang.kongZhi.join('')}</span>
            </div>
          </div>
        </Card>
      ) : null}
        </div>

        <div className={styles.right}>
          <section className={styles.stage}>
      {bazi && result?.payload ? (
        <>
          <div className={styles.summary}>
            <span className={styles.summaryPillars}>{result.subtitle}</span>
            <span className={styles.summaryMeta}>
              {bazi.gender === 'male' ? '乾造' : '坤造'} · 空亡{' '}
              {bazi.kongWang.kongZhi.join('')}（{bazi.kongWang.xun}）
            </span>
          </div>

          <div
            className={styles.pillarTable}
            style={{ gridTemplateColumns: `4.2rem repeat(${pillars.length}, minmax(0, 1fr))` }}
          >
            <div className={styles.cornerCell}>四柱</div>
            {pillars.map((item) => (
              <div key={`head-${item.key}`} className={styles.headCell}>
                {item.label}
              </div>
            ))}

            <div className={styles.rowLabel}>天干</div>
            {pillars.map((item) => (
              <div key={`stem-${item.key}`} className={styles.valueCell}>
                <span className={styles.stemChar}>{item.pillar.stem}</span>
                {item.pillar.tenGod ? (
                  <em className={styles.tenGod}>{item.pillar.tenGod}</em>
                ) : (
                  <em className={styles.tenGod} data-daymaster="true">
                    日主
                  </em>
                )}
              </div>
            ))}

            <div className={styles.rowLabel}>地支</div>
            {pillars.map((item) => (
              <div key={`branch-${item.key}`} className={styles.valueCell}>
                <span className={styles.branchChar}>{item.pillar.branch}</span>
                {item.pillar.kongWang.isKong ? <em className={styles.kong}>空</em> : null}
              </div>
            ))}

            <div className={styles.rowLabel}>十神</div>
            {pillars.map((item) => (
              <div key={`god-${item.key}`} className={styles.valueCell}>
                <span className={styles.plain}>{item.pillar.tenGod ?? '日主'}</span>
              </div>
            ))}

            <div className={styles.rowLabel}>藏干</div>
            {pillars.map((item) => (
              <div key={`hidden-${item.key}`} className={styles.valueCell}>
                {item.pillar.hiddenStems.length ? (
                  item.pillar.hiddenStems.map((hidden) => (
                    <span key={hidden.stem} className={styles.hidden} title={hidden.qiType}>
                      {hidden.stem}
                      <em>{hidden.tenGod}</em>
                    </span>
                  ))
                ) : (
                  <span className={styles.plain}>—</span>
                )}
              </div>
            ))}

            <div className={styles.rowLabel}>纳音</div>
            {pillars.map((item) => (
              <div key={`nayin-${item.key}`} className={styles.valueCell}>
                <span className={styles.plain}>{item.pillar.naYin ?? '—'}</span>
              </div>
            ))}

            <div className={styles.rowLabel}>神煞</div>
            {pillars.map((item) => (
              <div key={`sha-${item.key}`} className={styles.valueCell}>
                {item.pillar.shenSha.length ? (
                  <span className={styles.shaList}>{item.pillar.shenSha.join(' · ')}</span>
                ) : (
                  <span className={styles.plain}>—</span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.extraRow}>
            {bazi.taiYuan ? <span>胎元 {bazi.taiYuan}</span> : null}
            {bazi.mingGong ? <span>命宫 {bazi.mingGong}</span> : null}
            {pillars.map((item) =>
              item.pillar.diShi ? (
                <span key={`diShi-${item.key}`}>
                  {item.label.slice(0, 1)}地势 {item.pillar.diShi}
                </span>
              ) : null,
            )}
          </div>

          {bazi.relations.length ? (
            <p className={styles.relations}>
              {bazi.relations.map((item) => item.description).join('；')}
            </p>
          ) : null}

          {dayun ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>大 运</h2>
              <p className={styles.dayunMeta}>
                起运 {dayun.startAge} 岁 · {dayun.startAgeDetail}
                {dayun.direction
                  ? ` · ${dayun.direction === 'forward' ? '顺行' : '逆行'}`
                  : ''}
                {dayun.startSolar ? ` · 交运 ${dayun.startSolar}` : ''}
              </p>

              <div className={styles.dayunScroll}>
                <div className={styles.dayunTrack}>
                  {dayun.list.map((step) => (
                    <div key={`${step.startYear}-${step.ganZhi}`} className={styles.dayunStep}>
                      <span className={styles.dayunGanZhi}>{step.ganZhi}</span>
                      <span className={styles.dayunGod}>{step.tenGod}</span>
                      <span className={styles.dayunYear}>{step.startYear}</span>
                      <span className={styles.dayunAge}>{step.startAge} 岁</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className={styles.empty}>尚 未 排 盘</p>
      )}
          </section>

          {result?.warnings?.length ? (
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
