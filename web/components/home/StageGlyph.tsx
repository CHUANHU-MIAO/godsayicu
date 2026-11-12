'use client';

/**
 * 首页星环用图标。
 *
 * 与 `DivinationGlyph` 的区别：这里是「首页大门」的一套，线更简、内圈更满，
 * 在 66px 圆环里不会显得空。两套并存是刻意的 —— 内页用细线图标（跟正文节奏一致），
 * 首页用这套（远看要有形）。新增门类时两套都要补。
 */

type GlyphName =
  | 'liuyao'
  | 'tarot'
  | 'ziwei'
  | 'daliuren'
  | 'almanac'
  | 'jiao'
  | 'bazi'
  | 'meihua'
  | 'qimen';

const solidLine = (y: number) => <line key={`s${y}`} x1="7" y1={y} x2="33" y2={y} />;
const brokenLine = (y: number) => (
  <g key={`b${y}`}>
    <line x1="7" y1={y} x2="17" y2={y} />
    <line x1="23" y1={y} x2="33" y2={y} />
  </g>
);

function Body({ name }: { name: GlyphName }) {
  switch (name) {
    case 'liuyao':
      /* 地山谦：下艮（阴阴阳）上坤（阴阴阴） */
      return (
        <>
          {solidLine(31)}
          {brokenLine(26)}
          {brokenLine(21)}
          {brokenLine(16)}
          {brokenLine(11)}
          {brokenLine(6)}
        </>
      );
    case 'tarot':
      return (
        <>
          <rect x="12" y="5" width="16" height="30" rx="2.5" />
          <path d="M20 13.5l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
        </>
      );
    case 'ziwei':
      return (
        <>
          <circle cx="20" cy="20" r="12" />
          <circle cx="20" cy="20" r="4.5" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = ((i * 30) * Math.PI) / 180;
            return (
              <circle
                key={i}
                cx={(20 + 12 * Math.cos(a)).toFixed(1)}
                cy={(20 + 12 * Math.sin(a)).toFixed(1)}
                r="1.5"
                fill="currentColor"
                stroke="none"
              />
            );
          })}
        </>
      );
    case 'daliuren':
      return (
        <>
          <circle cx="20" cy="20" r="13" />
          <circle cx="20" cy="20" r="7" />
          <line x1="7" y1="20" x2="33" y2="20" opacity=".55" />
          <line x1="20" y1="7" x2="20" y2="33" opacity=".55" />
        </>
      );
    case 'almanac':
      return (
        <>
          {Array.from({ length: 9 }, (_, i) => {
            const r = Math.floor(i / 3);
            const c = i % 3;
            return <rect key={i} x={8 + c * 8} y={8 + r * 8} width="6" height="6" rx="1" />;
          })}
        </>
      );
    case 'jiao':
      /* 两片筊一俯一仰：上下各一条弧，中间断开留缝。
         端点不要碰在一起，否则会连成一个椭圆，看着像一根线。 */
      return (
        <>
          <path d="M11 19a9 9 0 0 1 18 0" />
          <path d="M11 21a9 9 0 0 0 18 0" />
        </>
      );
    case 'bazi':
      return (
        <>
          {Array.from({ length: 4 }, (_, k) => (
            <line key={`v${k}`} x1={9 + k * 7.5} y1="7" x2={9 + k * 7.5} y2="33" />
          ))}
          <line x1="6" y1="15" x2="34" y2="15" opacity=".5" />
          <line x1="6" y1="25" x2="34" y2="25" opacity=".5" />
        </>
      );
    case 'meihua':
      return (
        <>
          {Array.from({ length: 5 }, (_, n) => {
            const ang = ((-90 + n * 72) * Math.PI) / 180;
            return (
              <circle
                key={n}
                cx={(20 + 11 * Math.cos(ang)).toFixed(1)}
                cy={(20 + 11 * Math.sin(ang)).toFixed(1)}
                r="5.4"
              />
            );
          })}
          <circle cx="20" cy="20" r="2.6" fill="currentColor" stroke="none" />
        </>
      );
    case 'qimen':
      return (
        <>
          <rect x="7" y="7" width="26" height="26" rx="1.5" />
          <line x1="15.7" y1="7" x2="15.7" y2="33" />
          <line x1="24.3" y1="7" x2="24.3" y2="33" />
          <line x1="7" y1="15.7" x2="33" y2="15.7" />
          <line x1="7" y1="24.3" x2="33" y2="24.3" />
        </>
      );
    default:
      return <circle cx="20" cy="20" r="12" />;
  }
}

export default function StageGlyph({
  name,
  size = 26,
  keepStroke = false,
}: {
  name: GlyphName;
  size?: number;
  /** 放大成水印时按比例压细描边，否则大图会变成粗条纹；保留 0.32 下限 */
  keepStroke?: boolean;
}) {
  const sw = keepStroke ? Math.max(0.32, (1.6 * 40) / size).toFixed(2) : '1.6';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <Body name={name} />
    </svg>
  );
}

export type { GlyphName };
