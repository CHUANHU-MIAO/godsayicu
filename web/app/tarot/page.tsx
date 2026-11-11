'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field } from '@/components/ui';
import styles from './tarot.module.css';

const SPREADS = [
  { value: 'single', label: '单牌', desc: '一张，观当下' },
  { value: 'situation', label: '处境牌阵', desc: '三张，处境 · 障碍 · 建议' },
  { value: 'love', label: '爱情牌阵', desc: '四张，双方与关系' },
  { value: 'decision', label: '决策牌阵', desc: '权衡取舍' },
  { value: 'horseshoe', label: '马蹄牌阵', desc: '七张，全局推演' },
];

interface TarotCardItem {
  position: string;
  card: { name: string; nameChinese: string; keywords: string[] };
  orientation: 'upright' | 'reversed';
  meaning: string;
  element?: string;
}

interface TarotPayload {
  spreadId: string;
  spreadName: string;
  cards: TarotCardItem[];
}

interface TarotResult {
  subtitle: string;
  payload: TarotPayload | null;
  warnings: string[];
}

function imageOf(name: string): string {
  return `/tarot/${name.replace(/\s+/g, '_')}.webp`;
}

export default function TarotPage() {
  const [spread, setSpread] = useState('situation');
  const [question, setQuestion] = useState('');
  const [allowReversed, setAllowReversed] = useState(true);
  const [result, setResult] = useState<TarotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function draw() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/divination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: 'tarot',
          input: {
            spreadType: spread,
            question: question.trim() || undefined,
            allowReversed,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? '抽牌失败');
      if (!data?.payload) throw new Error(data?.warnings?.[0] ?? '未能完成抽牌');
      setResult(data as TarotResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '抽牌失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <p className={styles.eyebrow}>塔罗 · 韦特体系</p>
        <h1 className={styles.title}>抽 牌</h1>
        <p className={styles.sub}>七十八张，取象会意</p>
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

        <Field
          as="select"
          label="牌阵"
          value={spread}
          onChange={(event) => setSpread(event.target.value)}
        >
          {SPREADS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label} —— {item.desc}
            </option>
          ))}
        </Field>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={allowReversed}
            onChange={(event) => setAllowReversed(event.target.checked)}
          />
          <span>允许逆位</span>
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={draw}>
          抽 牌
        </Button>
        </Card>

        <div className={styles.stage}>
          {result?.payload ? (
            <section className={styles.result}>
              <h2 className={styles.resultTitle}>{result.payload.spreadName}</h2>
              <div className={styles.cards}>
                {result.payload.cards.map((item) => (
                  <article key={`${item.position}-${item.card.name}`} className={styles.card}>
                    <span className={styles.position}>{item.position}</span>
                    <div className={styles.figure} data-reversed={item.orientation === 'reversed' || undefined}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageOf(item.card.name)} alt={item.card.nameChinese} loading="lazy" />
                    </div>
                    <p className={styles.cardName}>
                      {item.card.nameChinese}
                      <span className={styles.orientation}>
                        {item.orientation === 'reversed' ? '逆位' : '正位'}
                      </span>
                    </p>
                    <p className={styles.meaning}>{item.meaning}</p>
                    {item.card.keywords.length ? (
                      <p className={styles.keywords}>{item.card.keywords.join(' · ')}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <p className={styles.placeholder}>静心默问，而后抽牌</p>
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
