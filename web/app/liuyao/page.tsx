'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Disclaimer, Field, TermTip } from '@/components/ui';
import HistoryDrawer from '@/components/history/HistoryDrawer';
import { HEXAGRAM_LIST } from '@/lib/data/hexagram-list';
import { LIUYAO_TERMS } from '@/lib/divination/liuyao-terms';
import styles from './liuyao.module.css';

const TARGETS = [
  { value: '父母', label: '父母 · 学业与文书' },
  { value: '官鬼', label: '官鬼 · 工作与压力' },
  { value: '妻财', label: '妻财 · 钱和资源' },
  { value: '子孙', label: '子孙 · 子女后辈 / 医药' },
  { value: '兄弟', label: '兄弟 · 同辈 / 合作 / 竞争' },
];

const POSITIONS = ['初', '二', '三', '四', '五', '上'];

function tossOnce(): number {
  let backs = 0;
  for (let i = 0; i < 3; i += 1) {
    if (Math.random() > 0.5) backs += 1;
  }
  return 6 + backs;
}

function CoinIcon() {
  return (
    <svg width="34" height="20" viewBox="0 0 34 20" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="7" cy="10" r="6" />
      <rect x="5.6" y="8.6" width="2.8" height="2.8" />
      <circle cx="17" cy="10" r="6" />
      <rect x="15.6" y="8.6" width="2.8" height="2.8" />
      <circle cx="27" cy="10" r="6" />
      <rect x="25.6" y="8.6" width="2.8" height="2.8" />
    </svg>
  );
}

function BurstIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M13 2v5M13 19v5M2 13h5M19 13h5M5.2 5.2l3.5 3.5M17.3 17.3l3.5 3.5M20.8 5.2l-3.5 3.5M8.7 17.3l-3.5 3.5" />
    </svg>
  );
}

function LinesIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 6h18" />
      <path d="M4 13h8M14 13h8" />
      <path d="M4 20h18" />
    </svg>
  );
}

export default function LiuyaoEntryPage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [targets, setTargets] = useState<string[]>(['官鬼']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [hexName, setHexName] = useState('乾为天');
  const [moving, setMoving] = useState<number[]>([]);

  function toggleTarget(value: string) {
    setTargets((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  }

  async function submit(values: number[]) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/divination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: 'liuyao',
          input: {
            question: question.trim() || undefined,
            yongShenTargets: targets.length > 0 ? targets : ['官鬼'],
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
      setLoading(false);
    }
  }

  function startQuick() {
    if (loading) return;
    submit(Array.from({ length: 6 }, () => tossOnce()));
  }

  function startCoin() {
    sessionStorage.setItem(
      'wen.liuyao.setup',
      JSON.stringify({ question, yongShenTargets: targets }),
    );
    router.push('/liuyao/cast');
  }

  function startPicked() {
    const found = HEXAGRAM_LIST.find(([name]) => name === hexName);
    const code = found?.[1] ?? '111111';
    const values = code.split('').map((char, index) => {
      const yang = char === '1';
      const isMoving = moving.includes(index + 1);
      if (isMoving) return yang ? 9 : 6;
      return yang ? 7 : 8;
    });
    setPicking(false);
    submit(values);
  }

  const pickedCode = HEXAGRAM_LIST.find(([name]) => name === hexName)?.[1] ?? '111111';
  const changedCode = pickedCode
    .split('')
    .map((char, index) => (moving.includes(index + 1) ? (char === '1' ? '0' : '1') : char))
    .join('');
  const changedHexName = moving.length
    ? HEXAGRAM_LIST.find(([, code]) => code === changedCode)?.[0] ?? '—'
    : null;
  const movingText = moving.length
    ? moving.map((position) => POSITIONS[position - 1]).join('、')
    : '—';

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <h1 className={styles.title}>六爻占卜</h1>
        <p className={styles.sub}>源自《易经》。一事一占，先想清楚要问什么。</p>
        <div className={styles.headTools}>
          <TermTip terms={LIUYAO_TERMS} label="术语说明" />
          <HistoryDrawer domain="liuyao" />
        </div>
      </header>

      <Card variant="outline" className={styles.panel}>
        <Field
          as="textarea"
          label="所问之事 · 选填"
          placeholder="例如：这次合作能否顺利达成？"
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />

        <div className={styles.targetBlock}>
          <p className={styles.targetLabel}>
            分析目标 <em>决定取哪一类用神，可多选</em>
          </p>
          <div className={styles.chips}>
            {TARGETS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={styles.chip}
                data-active={targets.includes(item.value) || undefined}
                onClick={() => toggleTarget(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error ? <p className={styles.error}>{error}</p> : null}

      <h2 className={styles.sectionTitle}>选择起卦方式</h2>

      <div className={styles.methods}>
        <button type="button" className={styles.method} onClick={startCoin}>
          <span className={styles.methodIcon}>
            <CoinIcon />
          </span>
          <span className={styles.methodName}>铜钱起卦</span>
          <span className={styles.methodDesc}>
            三枚铜钱逐爻抛掷，亲手感应卦象，保留古法的仪式感。
          </span>
          <span className={styles.methodGo}>开始抛掷 →</span>
        </button>

        <button type="button" className={styles.method} onClick={startQuick} disabled={loading}>
          <span className={styles.methodIcon}>
            <BurstIcon />
          </span>
          <span className={styles.methodName}>快速起卦</span>
          <span className={styles.methodDesc}>
            随机生成卦象，适合不方便手动起卦、想马上得到指引时。
          </span>
          <span className={styles.methodGo}>{loading ? '生成中…' : '立即生成 →'}</span>
        </button>

        <button type="button" className={styles.method} onClick={() => setPicking(true)}>
          <span className={styles.methodIcon}>
            <LinesIcon />
          </span>
          <span className={styles.methodName}>选卦起卦</span>
          <span className={styles.methodDesc}>
            已有卦象时，手动选择本卦与动爻，直接排盘分析。
          </span>
          <span className={styles.methodGo}>选择卦象 →</span>
        </button>
      </div>

      <details className={styles.guide}>
        <summary>
          起卦前须知
          <em>展开阅读</em>
        </summary>
        <ol>
          <li>一事一占：先想清楚要问什么，同一问题不反复起卦，心念专一才有参照价值。</li>
          <li>
            三枚铜钱：字为阴、背为阳。三背为「重」（老阳 ○）、三字为「交」（老阴 ×），二者为动爻。
          </li>
          <li>自下而上：第一掷为初爻，第六掷为上爻；动爻阴阳互变之后的卦称为变卦。</li>
          <li>选填的所问之事与分析目标，会一并带入排盘，用来确定取哪一类用神。</li>
        </ol>
      </details>

      {picking ? (
        <div className={styles.modal} role="dialog" aria-modal="true" aria-label="选择卦象">
          <div className={styles.modalPanel}>
            <h3 className={styles.modalTitle}>选择本卦</h3>

            <select
              className={styles.modalSelect}
              value={hexName}
              onChange={(event) => setHexName(event.target.value)}
            >
              {HEXAGRAM_LIST.map(([name]) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <p className={styles.modalLabel}>动爻 <em>可不选</em></p>
            <div className={styles.movingRow}>
              {POSITIONS.map((label, index) => {
                const value = index + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    className={styles.movingBtn}
                    data-active={moving.includes(value) || undefined}
                    onClick={() =>
                      setMoving((prev) =>
                        prev.includes(value)
                          ? prev.filter((item) => item !== value)
                          : [...prev, value],
                      )
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className={styles.preview}>
              <span className={styles.previewLabel}>实时预览 · 本卦之变卦</span>
              <div className={styles.previewNames}>
                <strong>{hexName}</strong>
                <span className={styles.previewArrow}>之</span>
                <strong>{changedHexName ?? '无动爻'}</strong>
              </div>
              <span className={styles.previewNote}>
                动爻 {moving.length} 处 · {movingText} 爻 · 自下而上
              </span>
            </div>

            <div className={styles.modalActions}>
              <Button variant="ghost" size="md" onClick={() => setPicking(false)}>
                取消
              </Button>
              <Button variant="primary" size="md" loading={loading} onClick={startPicked}>
                开始排盘
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Disclaimer />
    </main>
  );
}
