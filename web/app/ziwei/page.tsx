'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field, Segmented, Spinner } from '@/components/ui';
import styles from './ziwei.module.css';

type Gender = 'male' | 'female';

interface StarInfo {
  name: string;
  type?: string;
  brightness?: string;
  mutagen?: string;
  selfMutagen?: string;
  oppositeMutagen?: string;
}

interface PalaceInfo {
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  isBodyPalace: boolean;
  majorStars: StarInfo[];
  minorStars: StarInfo[];
  adjStars?: StarInfo[];
  changsheng12?: string;
  decadalRange?: [number, number];
}

interface GanZhi {
  gan: string;
  zhi: string;
}

interface ZiweiPayload {
  solarDate: string;
  lunarDate: string;
  fourPillars: {
    year: GanZhi;
    month: GanZhi;
    day: GanZhi;
    hour: GanZhi;
  };
  soul: string;
  body: string;
  fiveElement: string;
  zodiac: string;
  sign: string;
  palaces: PalaceInfo[];
  earthlyBranchOfSoulPalace?: string;
  earthlyBranchOfBodyPalace?: string;
  mutagenSummary?: Array<{ mutagen: string; starName: string; palaceName: string }>;
}

interface ZiweiResult {
  domain: string;
  title: string;
  subtitle: string;
  payload: ZiweiPayload | null;
  warnings: string[];
}

/** 传统命盘方位：巳午未申在上，寅丑子亥在下 */
const PALACE_SLOTS: Record<string, { row: number; col: number }> = {
  巳: { row: 1, col: 1 },
  午: { row: 1, col: 2 },
  未: { row: 1, col: 3 },
  申: { row: 1, col: 4 },
  辰: { row: 2, col: 1 },
  酉: { row: 2, col: 4 },
  卯: { row: 3, col: 1 },
  戌: { row: 3, col: 4 },
  寅: { row: 4, col: 1 },
  丑: { row: 4, col: 2 },
  子: { row: 4, col: 3 },
  亥: { row: 4, col: 4 },
};

const HOURS = [
  { value: 0, label: '子时 · 23–01' },
  { value: 2, label: '丑时 · 01–03' },
  { value: 4, label: '寅时 · 03–05' },
  { value: 6, label: '卯时 · 05–07' },
  { value: 8, label: '辰时 · 07–09' },
  { value: 10, label: '巳时 · 09–11' },
  { value: 12, label: '午时 · 11–13' },
  { value: 14, label: '未时 · 13–15' },
  { value: 16, label: '申时 · 15–17' },
  { value: 18, label: '酉时 · 17–19' },
  { value: 20, label: '戌时 · 19–21' },
  { value: 22, label: '亥时 · 21–23' },
];

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

function MutagenMark({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <em className={styles.mutagen} data-mutagen={value}>
      {value}
    </em>
  );
}

export default function ZiweiPage() {
  const [year, setYear] = useState('1990');
  const [month, setMonth] = useState('6');
  const [day, setDay] = useState('15');
  const [hour, setHour] = useState('12');
  const [gender, setGender] = useState<Gender>('male');
  const [result, setResult] = useState<ZiweiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function cast() {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!Number.isInteger(y) || y < 1900 || y > 2100) {
      setError('生年需在 1900 – 2100 之间');
      return;
    }
    const maxDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (d < 1 || d > maxDay) {
      setError(`所选月份只有 ${maxDay} 天`);
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
          domain: 'ziwei',
          input: {
            birthYear: y,
            birthMonth: m,
            birthDay: d,
            birthHour: Number(hour),
            gender,
            calendarType: 'solar',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? '排盘失败');
      if (!data?.payload) throw new Error(data?.warnings?.[0] ?? '未能完成排盘');
      setResult(data as ZiweiResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '排盘失败');
    } finally {
      setLoading(false);
    }
  }

  const payload = result?.payload;
  const fourPillars = payload
    ? [
        { label: '年柱', value: payload.fourPillars.year },
        { label: '月柱', value: payload.fourPillars.month },
        { label: '日柱', value: payload.fourPillars.day },
        { label: '时柱', value: payload.fourPillars.hour },
      ]
    : [];

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <p className={styles.eyebrow}>紫微 · 斗数</p>
        <h1 className={styles.title}>排 盘</h1>
        <p className={styles.sub}>{payload ? result?.subtitle : '安星布宫，观命身之机'}</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.left}>
          <Card variant="outline" className={styles.panel}>
            <div className={styles.formGrid}>
              <Field
                type="number"
                label="生年"
                min={1900}
                max={2100}
                inputMode="numeric"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
              <Field
                as="select"
                label="生月"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              >
                {MONTHS.map((item) => (
                  <option key={item} value={item}>
                    {item} 月
                  </option>
                ))}
              </Field>
              <Field
                as="select"
                label="生日"
                value={day}
                onChange={(event) => setDay(event.target.value)}
              >
                {DAYS.map((item) => (
                  <option key={item} value={item}>
                    {item} 日
                  </option>
                ))}
              </Field>
              <Field
                as="select"
                label="生时"
                value={hour}
                onChange={(event) => setHour(event.target.value)}
              >
                {HOURS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Field>
            </div>

            <div className={styles.gender}>
              <span className={styles.fieldLabel}>性别</span>
              <Segmented
                ariaLabel="性别"
                fullWidth
                value={gender}
                onChange={(value) => setGender(value as Gender)}
                options={[
                  { value: 'male', label: '乾造 · 男' },
                  { value: 'female', label: '坤造 · 女' },
                ]}
              />
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}

            <Button variant="primary" size="lg" fullWidth loading={loading} onClick={cast}>
              起 盘
            </Button>
          </Card>

          {loading ? (
            <div className={styles.loading}>
              <Spinner />
            </div>
          ) : null}

          {payload ? (
            <section className={styles.meta}>
              <p className={styles.metaDates}>
                公历 {payload.solarDate} · 农历 {payload.lunarDate}
              </p>
              <p className={styles.metaDates}>
                属{payload.zodiac} · {payload.sign}
              </p>
              <div className={styles.pillars}>
                {fourPillars.map((item) => (
                  <div key={item.label} className={styles.pillar}>
                    <span>{item.label}</span>
                    <strong>
                      {item.value.gan}
                      {item.value.zhi}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
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
          {payload ? (
            <div className={styles.chart} role="group" aria-label="紫微斗数十二宫">
              {payload.palaces.map((palace) => {
                const slot = PALACE_SLOTS[palace.earthlyBranch];
                return (
                  <div
                    key={`${palace.name}-${palace.earthlyBranch}`}
                    className={styles.palace}
                    data-soul={palace.name === '命宫' ? 'true' : undefined}
                    style={
                      slot
                        ? { gridRow: String(slot.row), gridColumn: String(slot.col) }
                        : undefined
                    }
                  >
                    <div className={styles.palaceHead}>
                      <span className={styles.palaceName}>{palace.name}</span>
                      {palace.isBodyPalace ? <span className={styles.bodyFlag}>身</span> : null}
                      <span className={styles.palaceStem}>
                        {palace.heavenlyStem}
                        {palace.earthlyBranch}
                      </span>
                    </div>

                    <div className={styles.majorStars}>
                      {palace.majorStars.length ? (
                        palace.majorStars.map((star) => (
                          <span key={star.name} className={styles.majorStar}>
                            {star.name}
                            {star.brightness ? (
                              <em className={styles.brightness}>{star.brightness}</em>
                            ) : null}
                            <MutagenMark value={star.mutagen} />
                          </span>
                        ))
                      ) : (
                        <span className={styles.noStar}>空宫</span>
                      )}
                    </div>

                    {palace.minorStars.length ? (
                      <p className={styles.minorStars}>
                        {palace.minorStars.map((star) => (
                          <span key={star.name}>
                            {star.name}
                            <MutagenMark value={star.mutagen} />
                          </span>
                        ))}
                      </p>
                    ) : null}

                    {palace.adjStars?.length ? (
                      <p className={styles.adjStars}>
                        {palace.adjStars.map((star) => star.name).join(' ')}
                      </p>
                    ) : null}

                    <div className={styles.palaceFoot}>
                      <span>
                        {palace.decadalRange
                          ? `大限 ${palace.decadalRange[0]}–${palace.decadalRange[1]}`
                          : ''}
                      </span>
                      <span>{palace.changsheng12}</span>
                    </div>
                  </div>
                );
              })}

              <div className={styles.center}>
                <p className={styles.centerLabel}>五行局</p>
                <p className={styles.centerValue}>{payload.fiveElement}</p>
                <div className={styles.centerGrid}>
                  <span>命主</span>
                  <strong>{payload.soul}</strong>
                  <span>身主</span>
                  <strong>{payload.body}</strong>
                  <span>命宫</span>
                  <strong>{payload.earthlyBranchOfSoulPalace ?? '—'}宫</strong>
                  <span>身宫</span>
                  <strong>{payload.earthlyBranchOfBodyPalace ?? '—'}宫</strong>
                </div>
                {payload.mutagenSummary?.length ? (
                  <div className={styles.mutagens}>
                    {payload.mutagenSummary.map((item) => (
                      <span
                        key={`${item.mutagen}-${item.starName}`}
                        className={styles.mutagenChip}
                        data-mutagen={item.mutagen}
                        title={`${item.palaceName}宫`}
                      >
                        {item.starName}
                        {item.mutagen}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
