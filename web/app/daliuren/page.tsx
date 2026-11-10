'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field, Spinner } from '@/components/ui';
import styles from './daliuren.module.css';

interface DaliurenDateInfo {
  solarDate: string;
  lunarDate?: string;
  bazi: string;
  ganZhi: { year: string; month: string; day: string; hour: string };
  yueJiang: string;
  yueJiangName: string;
  xun: string;
  kongWang: [string, string];
  yiMa: string;
  dingMa: string;
  tianMa: string;
  diurnal: boolean;
}

interface GongInfo {
  diZhi: string;
  tianZhi: string;
  tianJiang: string;
  tianJiangShort: string;
  dunGan: string;
  changSheng: string;
  wuXing: string;
  wangShuai: '旺' | '相' | '休' | '囚' | '死';
  jianChu: string;
}

interface SiKe {
  yiKe: string[];
  erKe: string[];
  sanKe: string[];
  siKe: string[];
}

interface SanChuan {
  chu: string[];
  zhong: string[];
  mo: string[];
  method: string;
}

interface KetiInfo {
  method: string;
  subTypes: string[];
  extraTypes: string[];
}

interface ShenSha {
  name: string;
  value: string;
  description?: string;
}

interface DaliurenPayload {
  dateInfo: DaliurenDateInfo;
  tianDiPan: {
    diPan: Record<string, string>;
    tianPan: Record<string, string>;
    tianJiang: Record<string, string>;
  };
  siKe: SiKe;
  sanChuan: SanChuan;
  keTi: KetiInfo;
  keName: string;
  shenSha: ShenSha[];
  gongInfos: GongInfo[];
  benMing?: string;
  xingNian?: string;
}

interface DaliurenResult {
  domain: string;
  title: string;
  subtitle: string;
  payload: DaliurenPayload | null;
  warnings: string[];
}

const KE_LABELS = ['一课', '二课', '三课', '四课'];
const CHUAN_LABELS = ['初传', '中传', '末传'];

function splitPair(pair?: string): { upper: string; lower: string } {
  const chars = Array.from(pair ?? '');
  return { upper: chars[0] ?? '—', lower: chars.slice(1).join('') };
}

export default function DaliurenPage() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<DaliurenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    setDate(now.toLocaleDateString('sv-SE'));
    setTime(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    );
  }, []);

  async function cast() {
    if (!date) {
      setError('请选择占问日期');
      return;
    }
    const [hourText, minuteText] = time.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute)) {
      setError('请选择有效的占问时刻');
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
          domain: 'daliuren',
          input: {
            date,
            hour,
            minute,
            question: question.trim() || undefined,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? '起课失败');
      if (!data?.payload) throw new Error(data?.warnings?.[0] ?? '未能完成起课');
      setResult(data as DaliurenResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '起课失败');
    } finally {
      setLoading(false);
    }
  }

  const payload = result?.payload;
  const info = payload?.dateInfo;
  const keList = payload
    ? [payload.siKe.yiKe, payload.siKe.erKe, payload.siKe.sanKe, payload.siKe.siKe]
    : [];
  const chuanList = payload
    ? [payload.sanChuan.chu, payload.sanChuan.zhong, payload.sanChuan.mo]
    : [];

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <p className={styles.eyebrow}>大六壬 · 课式</p>
        <h1 className={styles.title}>起 课</h1>
        <p className={styles.sub}>{payload ? payload.keName : '月将加时，天地盘成'}</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.left}>
          <Card variant="outline" className={styles.panel}>
            <div className={styles.formGrid}>
              <Field
                type="date"
                label="占问日期"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              <Field
                type="time"
                label="占问时刻"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>

            <Field
              as="textarea"
              label="所问何事"
              placeholder="心中默念所问，写于此处（可留空）"
              rows={3}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />

            {error ? <p className={styles.error}>{error}</p> : null}

            <Button variant="primary" size="lg" fullWidth loading={loading} onClick={cast}>
              起 课
            </Button>

            <p className={styles.hint}>以占问之时定月将，随时起课。</p>
          </Card>

          {loading ? (
            <div className={styles.loading}>
              <Spinner />
            </div>
          ) : null}

          {payload && info ? (
            <>
              <section className={styles.summary}>
                <p className={styles.keName}>{payload.keName}</p>
                <p className={styles.bazi}>{info.bazi}</p>
                <p className={styles.summaryMeta}>
                  {info.solarDate}
                  {info.lunarDate ? ` · 农历${info.lunarDate}` : ''}
                </p>
              </section>

              <section className={styles.rows}>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>月将</span>
                  <span>
                    {info.yueJiang} · {info.yueJiangName}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>旬空</span>
                  <span>
                    {info.xun}旬 · 空亡 {info.kongWang.join(' ')}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowLabel}>昼夜</span>
                  <span>
                    {info.diurnal ? '昼占' : '夜占'} · 驿马 {info.yiMa} · 丁马 {info.dingMa} ·
                    天马 {info.tianMa}
                  </span>
                </div>
                {payload.benMing || payload.xingNian ? (
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>本命</span>
                    <span>
                      本命 {payload.benMing ?? '—'} · 行年 {payload.xingNian ?? '—'}
                    </span>
                  </div>
                ) : null}
                <div className={styles.row}>
                  <span className={styles.rowLabel}>课体</span>
                  <span className={styles.chips}>
                    {[payload.keTi.method, ...payload.keTi.subTypes, ...payload.keTi.extraTypes]
                      .filter((item, index, list) => item && list.indexOf(item) === index)
                      .map((item) => (
                        <span key={item} className={styles.chip}>
                          {item}
                        </span>
                      ))}
                  </span>
                </div>
              </section>
            </>
          ) : null}

          {result?.warnings?.length ? (
            <ul className={styles.warn}>
              {result.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className={styles.right}>
          {payload && info ? (
            <>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>天地盘</h2>
                <div className={styles.pan} role="table" aria-label="天地盘十二位">
                  <div className={`${styles.panRow} ${styles.panHead}`} role="row">
                    <span role="columnheader">地盘</span>
                    <span role="columnheader">天盘</span>
                    <span role="columnheader">天将</span>
                    <span role="columnheader">遁干</span>
                    <span role="columnheader">旺衰</span>
                    <span role="columnheader">建除</span>
                  </div>
                  {payload.gongInfos.map((gong) => (
                    <div key={gong.diZhi} className={styles.panRow} role="row">
                      <span className={styles.diZhi} role="cell">
                        {gong.diZhi}
                      </span>
                      <span className={styles.tianZhi} role="cell">
                        {gong.tianZhi}
                      </span>
                      <span className={styles.jiang} role="cell">
                        {gong.tianJiang}
                      </span>
                      <span className={styles.dunGan} role="cell">
                        {gong.dunGan || '—'}
                      </span>
                      <span className={styles.wangShuai} data-state={gong.wangShuai} role="cell">
                        {gong.wangShuai}
                        <em>{gong.changSheng}</em>
                      </span>
                      <span className={styles.jianChu} role="cell">
                        {gong.jianChu}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>四课</h2>
                <div className={styles.siKe}>
                  {keList.map((ke, index) => {
                    const pair = splitPair(ke[0]);
                    return (
                      <div key={KE_LABELS[index]} className={styles.ke}>
                        <span className={styles.keLabel}>{KE_LABELS[index]}</span>
                        <span className={styles.keUpper}>{pair.upper}</span>
                        <span className={styles.keLower}>{pair.lower || '—'}</span>
                        <span className={styles.keJiang}>{ke[1] ?? '—'}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>三传</h2>
                <div className={styles.sanChuan}>
                  {chuanList.map((chuan, index) => (
                    <div key={CHUAN_LABELS[index]} className={styles.chuan}>
                      <span className={styles.chuanLabel}>{CHUAN_LABELS[index]}</span>
                      <span className={styles.chuanZhi}>{chuan[0] ?? '—'}</span>
                      <span className={styles.chuanMeta}>
                        {[chuan[1], chuan[2], chuan[3] ? `遁${chuan[3]}` : '']
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className={styles.method}>取传 · {payload.sanChuan.method}</p>
              </section>

              {payload.shenSha.length ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>神煞</h2>
                  <div className={styles.shenSha}>
                    {payload.shenSha.map((item) => (
                      <span
                        key={`${item.name}-${item.value}`}
                        className={styles.shaItem}
                        title={item.description}
                      >
                        <em>{item.name}</em>
                        {item.value}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
