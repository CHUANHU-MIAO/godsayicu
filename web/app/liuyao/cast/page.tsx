'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Disclaimer, TermTip } from '@/components/ui';
import Coin3D, { type CoinFace } from '@/components/divination/Coin3D';
import HistoryDrawer from '@/components/history/HistoryDrawer';
import { LIUYAO_TERMS } from '@/lib/divination/liuyao-terms';
import styles from './cast.module.css';

const POSITIONS = ['初', '二', '三', '四', '五', '上'];

const FACE_TEXT: Record<number, { detail: string; name: string; yao: string }> = {
  6: { detail: '三字', name: '交', yao: '老阴' },
  7: { detail: '一背二字', name: '单', yao: '少阳' },
  8: { detail: '二背一字', name: '拆', yao: '少阴' },
  9: { detail: '三背', name: '重', yao: '老阳' },
};

function yaoName(position: number, yin: boolean): string {
  const numeral = yin ? '六' : '九';
  if (position === 1) return `初${numeral}`;
  if (position === 6) return `上${numeral}`;
  return `${numeral}${POSITIONS[position - 1]}`;
}

function tossCoins(): { faces: [CoinFace, CoinFace, CoinFace]; value: number } {
  const faces: [CoinFace, CoinFace, CoinFace] = [
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
  ];
  const backs = faces.filter((face) => face === 1).length;
  return { faces, value: 6 + backs };
}

export default function LiuyaoCastPage() {
  const router = useRouter();
  const [tossed, setTossed] = useState<number[]>([]);
  const [faces, setFaces] = useState<[CoinFace, CoinFace, CoinFace] | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [tossing, setTossing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pendingRef = useRef<{ value: number } | null>(null);
  const tossedRef = useRef<number[]>([]);
  tossedRef.current = tossed;

  const setupRef = useRef<{ question?: string; yongShenTargets?: string[] }>({});
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('wen.liuyao.setup');
      if (raw) setupRef.current = JSON.parse(raw);
    } catch {
      setupRef.current = {};
    }
  }, []);

  async function submit(values: number[]) {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/divination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: 'liuyao',
          input: {
            question: setupRef.current.question || undefined,
            yongShenTargets: setupRef.current.yongShenTargets?.length
              ? setupRef.current.yongShenTargets
              : ['官鬼'],
            yaoValues: values,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? '起卦失败');
      if (!data?.payload) throw new Error(data?.warnings?.[0] ?? '未能完成起卦');
      sessionStorage.setItem('wen.liuyao.result', JSON.stringify(data));
      router.push('/liuyao/result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '起卦失败');
      setSubmitting(false);
    }
  }

  function handleToss() {
    if (tossing || submitting || tossed.length >= 6) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(50);
    }
    const toss = tossCoins();
    pendingRef.current = { value: toss.value };
    setFaces(toss.faces);
    setSpinToken((token) => token + 1);
    setTossing(true);
    setError('');
  }

  function handleSettled() {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setTossing(false);
    if (!pending) return;

    const next = [...tossedRef.current, pending.value];
    setTossed(next);
    if (next.length === 6) {
      submit(next);
    }
  }

  const done = tossed.length;
  const currentValue = faces ? 6 + faces.filter((face) => face === 1).length : null;
  const label = currentValue ? FACE_TEXT[currentValue] : null;
  const buttonText =
    done >= 6
      ? '排盘中…'
      : tossing
        ? '抛掷中…'
        : `掷${POSITIONS[done]}爻`;

  return (
    <main className={styles.page}>
      <Link href="/liuyao" className={styles.back}>
        ← 重新选择
      </Link>

      <header className={styles.head}>
        <h1 className={styles.title}>铜钱起卦</h1>
        <p className={styles.sub}>乾隆通宝、道光通宝、嘉庆通宝三枚，逐爻抛掷，自下而上成卦。</p>
        <div className={styles.headTools}>
          <TermTip terms={LIUYAO_TERMS} label="术语说明" />
          <HistoryDrawer domain="liuyao" />
        </div>
      </header>

      <section className={styles.card}>
        <div className={styles.left}>
          <Coin3D faces={faces} spinToken={spinToken} onSettled={handleSettled} />

          <p className={styles.result}>
            {label ? (
              <>
                {label.detail} <b>{label.name}</b> {label.yao}
              </>
            ) : (
              <span className={styles.idle}>铜钱未落</span>
            )}
          </p>

          {error ? <p className={styles.error}>{error}</p> : null}

          <Button
            variant="primary"
            size="lg"
            loading={tossing || submitting}
            onClick={handleToss}
            disabled={done >= 6}
          >
            {buttonText}
          </Button>

          <button
            type="button"
            className={styles.shake}
            onClick={handleToss}
            disabled={tossing || submitting || done >= 6}
          >
            摇一摇 · 同样抛掷一次
          </button>

          {done >= 6 && submitting ? (
            <p className={styles.casting}>
              <span className={styles.bars} aria-hidden="true">
                <i /><i /><i />
              </span>
              卦成，正在排盘
            </p>
          ) : null}
        </div>

        <div className={styles.right}>
          <div className={styles.rightHead}>
            <span className={styles.rightTitle}>卦象</span>
            <span className={styles.count}>已掷 {done} / 6</span>
          </div>

          <div className={styles.progress} aria-label={`已掷 ${done} / 6`}>
            {POSITIONS.map((pos, index) => (
              <span
                key={pos}
                className={styles.progressCell}
                data-done={index < done || undefined}
                data-current={index === done && !submitting || undefined}
                title={`${pos}爻`}
              />
            ))}
          </div>

          <p className={styles.nextHint}>
            {done < 6
              ? `下一掷 · ${POSITIONS[done]}爻（第 ${done + 1} / 6 掷）`
              : '六爻已齐，正在排盘'}
          </p>

          <ol className={styles.lines}>
            {[5, 4, 3, 2, 1, 0].map((index) => {
              const value = tossed[index];
              const has = typeof value === 'number';
              const yin = has && (value === 6 || value === 8);
              const moving = has && (value === 6 || value === 9);
              const active = !has && index === done && !submitting;

              return (
                <li
                  key={index}
                  className={styles.row}
                  data-active={active || undefined}
                >
                  <span className={styles.pos}>{POSITIONS[index]}爻</span>
                  <span
                    className={styles.line}
                    data-state={has ? (yin ? 'yin' : 'yang') : 'idle'}
                    data-moving={moving || undefined}
                  >
                    {has ? (
                      yin ? (
                        <>
                          <i /><i />
                        </>
                      ) : (
                        <i />
                      )
                    ) : (
                      <i />
                    )}
                  </span>
                  <span className={styles.tag}>
                    {has ? (
                      <>
                        {moving ? (yin ? '× ' : '○ ') : ''}
                        {FACE_TEXT[value].name} {FACE_TEXT[value].yao}
                      </>
                    ) : (
                      '待掷'
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className={styles.hint}>
            第一掷为初爻，自下而上。重为老阳 ○、交为老阴 ×，二者为动爻。
          </p>

          <p className={styles.rule}>
            口径：三枚铜钱各掷一次为一爻，共六掷；三背为老阳、三字为老阴，其余为静爻。
          </p>

          <div className={styles.rightTools}>
            <TermTip
              terms={LIUYAO_TERMS}
              label="本页术语"
              description="起卦与排盘中出现的传统术语释义，仅供文化学习参考。"
            />
          </div>
        </div>
      </section>

      <Disclaimer compact />
    </main>
  );
}
