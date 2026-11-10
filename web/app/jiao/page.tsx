'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field } from '@/components/ui';
import styles from './jiao.module.css';

type Face = '正' | '反';

interface JiaoPayload {
  result: 'sheng' | 'xiao' | 'yin';
  label: string;
  meaning: string;
  faces: [Face, Face];
}

interface JiaoResult {
  subtitle: string;
  payload: JiaoPayload | null;
  warnings: string[];
}

const NOTES: Record<JiaoPayload['result'], string> = {
  sheng: '一平一凸，神明应允，所问可行。',
  xiao: '两平相对，陈述未明，宜再问或换一种问法。',
  yin: '两凸相对，神明不允，此事宜缓。',
};

export default function JiaoPage() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<JiaoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function cast() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/divination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'jiao', input: {} }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? '掷筊失败');
      setResult(data as JiaoResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '掷筊失败');
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
        <p className={styles.eyebrow}>杯筊 · 问神</p>
        <h1 className={styles.title}>掷 筊</h1>
        <p className={styles.sub}>一正一反，听之于神</p>
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

        {error ? <p className={styles.error}>{error}</p> : null}

        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={cast}>
          掷 筊
        </Button>

        <p className={styles.hint}>心诚则灵，问事先问己。</p>
        </Card>

        <div className={styles.stage}>
          <div className={styles.board} aria-label="筊杯">
            {[0, 1].map((index) => {
              const face = payload?.faces[index];
              return (
                <figure key={index} className={styles.cup}>
                  <div className={styles.cupFigure} data-face={face ?? 'idle'}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/ritual/jiao.png" alt={`筊杯${index + 1}`} data-flip={face === '正' || undefined} />
                  </div>
                  <figcaption className={styles.cupFace}>{face ?? '—'}</figcaption>
                </figure>
              );
            })}
          </div>

          {payload ? (
            <section className={styles.result} data-outcome={payload.result}>
              <p className={styles.outcome}>{payload.label}</p>
              <p className={styles.meaning}>{payload.meaning}</p>
              <p className={styles.note}>{NOTES[payload.result]}</p>
            </section>
          ) : (
            <p className={styles.placeholder}>筊杯未落，静心叩问</p>
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
