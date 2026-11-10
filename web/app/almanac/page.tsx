'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Field, Spinner } from '@/components/ui';
import styles from './almanac.module.css';

interface HourFortune {
  ganZhi: string;
  startTime: string;
  endTime: string;
  tianShen: string;
  tianShenLuck: string;
  chong: string;
  sha: string;
}

interface AlmanacPayload {
  date: string;
  dayInfo: { stem: string; branch: string; ganZhi: string };
  almanac: {
    lunarDate: string;
    zodiac: string;
    suitable: string[];
    avoid: string[];
    chongSha: string;
    pengZuBaiJi: string;
    jishen: string[];
    xiongsha: string[];
    directions: Record<string, string>;
    dayOfficer: string;
    tianShen: string;
    tianShenType: string;
    tianShenLuck: string;
    lunarMansion: string;
    lunarMansionLuck: string;
    nayin: string;
    taiShen: string;
    hourlyFortune: HourFortune[];
  };
}

interface AlmanacResult {
  subtitle: string;
  payload: AlmanacPayload | null;
  warnings: string[];
}

const DIRECTION_LABELS: Record<string, string> = {
  caiShen: '财神',
  xiShen: '喜神',
  fuShen: '福神',
  yangGui: '阳贵',
  yinGui: '阴贵',
};

export default function AlmanacPage() {
  const [date, setDate] = useState('');
  const [result, setResult] = useState<AlmanacResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDate(new Date().toLocaleDateString('sv-SE'));
  }, []);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/divination', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: 'almanac', input: { date } }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message ?? '查询失败');
        if (!cancelled) setResult(data as AlmanacResult);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '查询失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const info = result?.payload?.almanac;

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <p className={styles.eyebrow}>黄历 · 日课</p>
        <h1 className={styles.title}>今 日</h1>
        {info ? <p className={styles.sub}>{info.lunarDate} · 属{info.zodiac}</p> : null}
      </header>

      <div className={styles.layout}>
        <div className={styles.left}>
          <Field
            type="date"
            label="择日查询"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            wrapperClassName={styles.dateField}
          />

          {loading ? (
            <div className={styles.loading}>
              <Spinner />
            </div>
          ) : null}

          {error ? <p className={styles.error}>{error}</p> : null}

          {info && result?.payload ? (
            <section className={styles.ganzhi}>
              <span className={styles.ganzhiMain}>{result.payload.dayInfo.ganZhi}日</span>
              <span className={styles.ganzhiMeta}>
                值神 {info.tianShen} · {info.tianShenType} · {info.tianShenLuck}
              </span>
              <span className={styles.ganzhiMeta}>
                建除 {info.dayOfficer} · 纳音 {info.nayin}
              </span>
            </section>
          ) : null}
        </div>

        <div className={styles.stage}>
          {info && result?.payload ? (
            <>
              <section className={styles.yiji}>
                <div className={styles.yi}>
                  <h2 className={styles.yijiTitle}>宜</h2>
                  <p>{info.suitable.join('　') || '—'}</p>
                </div>
                <div className={styles.ji}>
                  <h2 className={styles.yijiTitle}>忌</h2>
                  <p>{info.avoid.join('　') || '—'}</p>
                </div>
              </section>

              <section className={styles.rows}>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>冲煞</span>
                  <span>{info.chongSha}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>彭祖</span>
                  <span>{info.pengZuBaiJi}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>吉神</span>
                  <span>{info.jishen.join(' · ') || '—'}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>凶煞</span>
                  <span>{info.xiongsha.join(' · ') || '—'}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>方位</span>
                  <span>
                    {Object.entries(info.directions)
                      .map(([key, value]) => `${DIRECTION_LABELS[key] ?? key}${value}`)
                      .join('　')}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>星宿</span>
                  <span>
                    {info.lunarMansion}宿 · {info.lunarMansionLuck} · 胎神 {info.taiShen}
                  </span>
                </div>
              </section>

              <section className={styles.hours}>
                <h2 className={styles.hoursTitle}>时辰吉凶</h2>
                <ul className={styles.hourList}>
                  {info.hourlyFortune.map((hour) => (
                    <li key={hour.ganZhi} className={styles.hour} data-luck={hour.tianShenLuck}>
                      <span className={styles.hourTime}>
                        {hour.startTime}–{hour.endTime}
                      </span>
                      <span className={styles.hourGanzhi}>{hour.ganZhi}</span>
                      <span className={styles.hourShen}>{hour.tianShen}</span>
                      <span className={styles.hourLuck}>{hour.tianShenLuck}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <p className={styles.placeholder}>择一日期，以观宜忌</p>
          )}

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
