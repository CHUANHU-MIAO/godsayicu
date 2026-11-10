'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field } from '@/components/ui';
import styles from './meihua.module.css';

type Mode = 'time' | 'number_pair';

interface Trigram {
  name: string;
  element: string;
  number: number;
}

interface Hexagram {
  name: string;
  guaCi?: string;
  xiangCi?: string;
  upperTrigram: Trigram;
  lowerTrigram: Trigram;
}

interface MeihuaPayload {
  question: string;
  castMeta: { methodLabel: string; inputSummary: string[] };
  mainHexagram: Hexagram;
  changedHexagram?: Hexagram;
  nuclearHexagram?: Hexagram;
  movingLine: number;
  bodyTrigram: Trigram;
  useTrigram: Trigram;
  bodyUseRelation: { relation: string; favorable: boolean; summary: string };
  interactionReadings: Array<{ stageLabel: string; relation: string; summary: string }>;
  timingHints: Array<{ phase: string; summary: string }>;
  judgement: { outcome: string; summary: string; basis: string[] };
}

interface MeihuaResult {
  subtitle: string;
  payload: MeihuaPayload | null;
  warnings: string[];
}

const LINE_NAMES = ['', '初', '二', '三', '四', '五', '上'];

export default function MeihuaPage() {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<Mode>('time');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [result, setResult] = useState<MeihuaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function cast() {
    setLoading(true);
    setError('');
    setResult(null);

    const input: Record<string, unknown> = {
      question: question.trim() || undefined,
      method: mode,
    };
    if (mode === 'number_pair') {
      const a = Number(first);
      const b = Number(second);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
        setError('请输入两个大于 0 的整数');
        setLoading(false);
        return;
      }
      input.numbers = [Math.floor(a), Math.floor(b)];
    }

    try {
      const response = await fetch('/api/divination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'meihua', input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? '起卦失败');
      if (!data?.payload) throw new Error(data?.warnings?.[0] ?? '未能完成起卦');
      setResult(data as MeihuaResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '起卦失败');
    } finally {
      setLoading(false);
    }
  }

  const payload = result?.payload;

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <p className={styles.eyebrow}>梅花 · 易数</p>
        <h1 className={styles.title}>起 卦</h1>
        <p className={styles.sub}>观物取象，随心而占</p>
      </header>

      <div className={styles.layout}>
        <Card variant="outline" className={styles.panel}>
        <Field
          as="textarea"
          label="所问何事"
          placeholder="心中默念所问，写于此处（可留空）"
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />

        <div className={styles.mode}>
          <span className={styles.modeLabel}>起卦方式</span>
          <div className={styles.modeGroup} role="group" aria-label="起卦方式">
            <button
              type="button"
              className={styles.modeButton}
              data-active={mode === 'time' || undefined}
              onClick={() => setMode('time')}
            >
              时间起卦
            </button>
            <button
              type="button"
              className={styles.modeButton}
              data-active={mode === 'number_pair' || undefined}
              onClick={() => setMode('number_pair')}
            >
              数字起卦
            </button>
          </div>
        </div>

        {mode === 'number_pair' ? (
          <div className={styles.numbers}>
            <Field
              type="number"
              label="第一个数"
              min={1}
              value={first}
              onChange={(event) => setFirst(event.target.value)}
            />
            <Field
              type="number"
              label="第二个数"
              min={1}
              value={second}
              onChange={(event) => setSecond(event.target.value)}
            />
          </div>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={cast}>
          起 卦
        </Button>
        </Card>

        <div className={styles.stage}>
          {payload ? (
            <section className={styles.result}>
              <div className={styles.hexNames}>
                <span className={styles.hexMain}>{payload.mainHexagram.name}</span>
                {payload.changedHexagram ? (
                  <span className={styles.hexArrow}>→ {payload.changedHexagram.name}</span>
                ) : null}
              </div>

              <p className={styles.castMeta}>
                {payload.castMeta.methodLabel} · 动{LINE_NAMES[payload.movingLine] ?? ''}爻
              </p>

              <div className={styles.trigrams}>
                <div className={styles.trigram}>
                  <span className={styles.trigramLabel}>体</span>
                  <span className={styles.trigramName}>
                    {payload.bodyTrigram.name}
                    <em>{payload.bodyTrigram.element}</em>
                  </span>
                </div>
                <div className={styles.trigram}>
                  <span className={styles.trigramLabel}>用</span>
                  <span className={styles.trigramName}>
                    {payload.useTrigram.name}
                    <em>{payload.useTrigram.element}</em>
                  </span>
                </div>
                <div className={styles.trigram}>
                  <span className={styles.trigramLabel}>关系</span>
                  <span className={styles.trigramName}>{payload.bodyUseRelation.relation}</span>
                </div>
              </div>

              <p className={styles.summary}>{payload.bodyUseRelation.summary}</p>

              <div className={styles.judgement} data-outcome={payload.judgement.outcome}>
                <span className={styles.outcome}>{payload.judgement.outcome}</span>
                <span className={styles.outcomeText}>{payload.judgement.summary}</span>
              </div>

              {payload.mainHexagram.guaCi ? (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>本卦 · 卦辞</h2>
                  <p>{payload.mainHexagram.guaCi}</p>
                  {payload.mainHexagram.xiangCi ? (
                    <p className={styles.xiang}>{payload.mainHexagram.xiangCi}</p>
                  ) : null}
                </div>
              ) : null}

              {payload.interactionReadings.length ? (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>生克推演</h2>
                  <ul className={styles.readings}>
                    {payload.interactionReadings.map((item) => (
                      <li key={item.stageLabel}>
                        <strong>{item.stageLabel}</strong>
                        <span>{item.relation}</span>
                        <em>{item.summary}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {payload.timingHints.length ? (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>应期</h2>
                  <ul className={styles.timings}>
                    {payload.timingHints.map((item) => (
                      <li key={item.phase}>{item.summary}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {payload.nuclearHexagram ? (
                <p className={styles.nuclear}>互卦 · {payload.nuclearHexagram.name}</p>
              ) : null}
            </section>
          ) : (
            <p className={styles.placeholder}>心有所感，即可起卦</p>
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
