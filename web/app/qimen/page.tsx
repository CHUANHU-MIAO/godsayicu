'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field, Spinner } from '@/components/ui';
import styles from './qimen.module.css';

interface QimenPalace {
  palaceIndex: number;
  palaceName: string;
  direction: string;
  element: string;
  earthStem: string;
  heavenStem: string;
  star: string;
  gate: string;
  deity: string;
  formations: string[];
  isKongWang?: boolean;
  isYiMa?: boolean;
  isRuMu?: boolean;
  isMenPo?: boolean;
  isJiXing?: boolean;
}

interface QimenPayload {
  dateInfo: {
    solarDate: string;
    lunarDate: string;
    solarTerm: string;
    solarTermRange?: string;
  };
  siZhu: { year: string; month: string; day: string; hour: string };
  dunType: 'yang' | 'yin';
  juNumber: number;
  yuan: string;
  xunShou: string;
  zhiFu: { star: string; palace: number };
  zhiShi: { gate: string; palace: number };
  palaces: QimenPalace[];
  kongWang: {
    dayKong: { branches: string[]; palaces: number[] };
    hourKong: { branches: string[]; palaces: number[] };
  };
  yiMa: { branch: string; palace: number };
  globalFormations: string[];
  boardFormations?: string[];
  panType: string;
  juMethod: string;
  question?: string;
}

interface QimenResult {
  subtitle: string;
  payload: QimenPayload | null;
  warnings: string[];
  meta?: { timezone: string; effectiveDate: string };
}

const JU_NAMES = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 洛书九宫：上排巽离坤，中排震中兑，下排艮坎乾 */
const PALACE_GRID = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

function nowInputValue(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
}

export default function QimenPage() {
  const [when, setWhen] = useState('');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QimenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setWhen(nowInputValue());
  }, []);

  async function cast() {
    if (!when) {
      setError('请选择占问时间');
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
          domain: 'qimen',
          input: {
            date: when.replace('T', ' '),
            timezone: 'Asia/Shanghai',
            question: question.trim() || undefined,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? '起局失败');
      if (!data?.payload) throw new Error(data?.warnings?.[0] ?? '未能完成起局');
      setResult(data as QimenResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '起局失败');
    } finally {
      setLoading(false);
    }
  }

  const payload = result?.payload;
  const palaceMap = new Map<number, QimenPalace>(
    (payload?.palaces ?? []).map((palace) => [palace.palaceIndex, palace]),
  );
  const palaceName = (index: number) => palaceMap.get(index)?.palaceName ?? String(index);

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <p className={styles.eyebrow}>奇门 · 遁甲</p>
        <h1 className={styles.title}>起 局</h1>
        <p className={styles.sub}>观时取局，九宫推演</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.left}>
      <Card variant="outline" className={styles.panel}>
        <Field
          type="datetime-local"
          label="占问时间"
          value={when}
          onChange={(event) => setWhen(event.target.value)}
        />

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
          起 局
        </Button>

        <p className={styles.hint}>默认以当下时刻起局，转盘 · 拆补法。</p>
      </Card>

      {loading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : null}

      {payload ? (
        <Card variant="outline" className={styles.brief}>
          <span className={styles.briefLabel}>概 要</span>
          <div className={styles.badges}>
            <span className={styles.juBadge}>
              {payload.dunType === 'yang' ? '阳' : '阴'}遁{JU_NAMES[payload.juNumber] ?? payload.juNumber}
              局
            </span>
            <span className={styles.yuanBadge}>{payload.yuan}</span>
            <span className={styles.badge}>值符 {payload.zhiFu.star}</span>
            <span className={styles.badge}>值使 {payload.zhiShi.gate}</span>
          </div>
          <p className={styles.briefMeta}>
            起局方式
            <span>
              {payload.panType} · {payload.juMethod}
            </span>
          </p>
        </Card>
      ) : null}
        </div>

        <div className={styles.right}>
          <section className={styles.stage}>
      {payload ? (
        <>
          <div className={styles.summary}>
            <span className={styles.siZhu}>
              {payload.siZhu.year} {payload.siZhu.month} {payload.siZhu.day} {payload.siZhu.hour}
            </span>
            <span className={styles.summaryMeta}>
              {payload.dateInfo.lunarDate} · {payload.dateInfo.solarTerm}
            </span>
            {payload.question ? <span className={styles.question}>「{payload.question}」</span> : null}
          </div>

          <div className={styles.grid} role="group" aria-label="奇门九宫">
            {PALACE_GRID.map((row) =>
              row.map((index) => {
                const palace = palaceMap.get(index);
                if (!palace) {
                  return <div key={`empty-${index}`} className={styles.cell} />;
                }
                const flags = [
                  palace.isKongWang ? '空' : '',
                  palace.isYiMa ? '马' : '',
                  palace.isRuMu ? '墓' : '',
                  palace.isMenPo ? '迫' : '',
                  palace.isJiXing ? '刑' : '',
                ].filter(Boolean);

                return (
                  <div
                    key={palace.palaceIndex}
                    className={styles.cell}
                    data-center={palace.palaceIndex === 5 || undefined}
                    data-zhifu={palace.palaceIndex === payload.zhiFu.palace || undefined}
                    data-zhishi={palace.palaceIndex === payload.zhiShi.palace || undefined}
                  >
                    <div className={styles.cellHead}>
                      <span className={styles.palaceName}>{palace.palaceName}宫</span>
                      <span className={styles.direction}>{palace.direction}</span>
                    </div>

                    <div className={styles.deity}>{palace.deity}</div>

                    <div className={styles.stems}>
                      <span className={styles.stem}>
                        <em>天</em>
                        {palace.heavenStem}
                      </span>
                      <span className={styles.stem} data-layer="earth">
                        <em>地</em>
                        {palace.earthStem}
                      </span>
                    </div>

                    <div className={styles.cellFoot}>
                      <span>{palace.star}</span>
                      <span>{palace.gate}</span>
                    </div>

                    {flags.length ? <div className={styles.flags}>{flags.join(' ')}</div> : null}
                    {palace.formations.length ? (
                      <div className={styles.formations}>{palace.formations.join(' · ')}</div>
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>

          {payload.globalFormations.length ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>格 局</h2>
              <ul className={styles.list}>
                {payload.globalFormations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>局 象</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>值符</span>
                <span>
                  {payload.zhiFu.star} · {palaceName(payload.zhiFu.palace)}宫
                </span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>值使</span>
                <span>
                  {payload.zhiShi.gate} · {palaceName(payload.zhiShi.palace)}宫
                </span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>旬首</span>
                <span>{payload.xunShou}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>盘式</span>
                <span>
                  {payload.panType} · {payload.juMethod}
                </span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>日空</span>
                <span>
                  {payload.kongWang.dayKong.branches.join('')} ·{' '}
                  {payload.kongWang.dayKong.palaces.map((item) => `${palaceName(item)}宫`).join(' ')}
                </span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>时空</span>
                <span>
                  {payload.kongWang.hourKong.branches.join('')} ·{' '}
                  {payload.kongWang.hourKong.palaces.map((item) => `${palaceName(item)}宫`).join(' ')}
                </span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>驿马</span>
                <span>
                  {payload.yiMa.branch} · {palaceName(payload.yiMa.palace)}宫
                </span>
              </div>
            </div>
          </section>
        </>
      ) : (
        <p className={styles.empty}>尚 未 起 局</p>
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
