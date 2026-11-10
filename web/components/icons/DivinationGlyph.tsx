export type GlyphName =
  | 'liuyao'
  | 'tarot'
  | 'ziwei'
  | 'daliuren'
  | 'almanac'
  | 'jiao'
  | 'bazi'
  | 'meihua'
  | 'qimen';

const GLYPHS: Record<GlyphName, React.ReactNode> = {
  // 六爻：地山谦（上坤下艮，六爻皆吉）—— 自上而下为坤三爻（三阴）覆艮三爻（下二阴、上一阳）
  liuyao: (
    <>
      <path d="M6 8h13M25 8h13" />
      <path d="M6 14h13M25 14h13" />
      <path d="M6 20h13M25 20h13" />
      <path d="M6 26h32" />
      <path d="M6 32h13M25 32h13" />
      <path d="M6 38h13M25 38h13" />
    </>
  ),
  // 塔罗：牌框 + 星
  tarot: (
    <>
      <rect x="11" y="5.5" width="22" height="33" rx="2.5" />
      <circle cx="22" cy="10.5" r="1.1" />
      <path d="M22 17l1.9 3.9 4.3.6-3.1 3 .7 4.3L22 26.8l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
      <path d="M17 34.5h10" />
    </>
  ),
  // 紫微：十二宫格
  ziwei: (
    <>
      <rect x="5.5" y="5.5" width="33" height="33" />
      <path d="M14 5.5v33M30 5.5v33M5.5 14h33M5.5 30h33" />
      <circle cx="22" cy="22" r="3" />
    </>
  ),
  // 六壬：天地盘
  daliuren: (
    <>
      <circle cx="22" cy="22" r="16.5" />
      <circle cx="22" cy="22" r="9" />
      <path d="M22 5.5v6M22 32.5v6M5.5 22h6M32.5 22h6" />
      <circle cx="22" cy="22" r="1.4" />
    </>
  ),
  // 黄历：日历
  almanac: (
    <>
      <rect x="6.5" y="9.5" width="31" height="28" rx="1.5" />
      <path d="M6.5 17h31M13.5 5.5v7M30.5 5.5v7" />
      <path d="M13 23h4M20 23h4M27 23h4M13 29h4M20 29h4" />
    </>
  ),
  // 杯筊：两片月牙
  jiao: (
    <>
      <path d="M15.5 12c-5.5 4-5.5 15 0 19" />
      <path d="M20 8.5c-6.5 5-6.5 21 0 26" />
      <path d="M28.5 12c5.5 4 5.5 15 0 19" />
      <path d="M24 8.5c6.5 5 6.5 21 0 26" />
    </>
  ),
  // 八字：四柱
  bazi: (
    <>
      <rect x="6" y="8" width="6" height="28" />
      <rect x="15" y="8" width="6" height="28" />
      <rect x="24" y="8" width="6" height="28" />
      <rect x="33" y="8" width="5" height="28" />
    </>
  ),
  // 梅花：五瓣
  meihua: (
    <>
      <path d="M22 7.5c3 4.5 3 6.5 0 10.5-3-4-3-6 0-10.5z" />
      <path d="M34.5 16c-5 1.5-6.8 3-8.2 7.8 4.8 1 6.6.2 10-3.2" />
      <path d="M30.5 31c-3.5-3.8-5.5-4.5-9.8-4.2 1 4.8 2.4 6.2 7 7.6" />
      <path d="M13.5 31c3.5-3.8 5.5-4.5 9.8-4.2-1 4.8-2.4 6.2-7 7.6" />
      <path d="M9.5 16c5 1.5 6.8 3 8.2 7.8-4.8 1-6.6.2-10-3.2" />
      <circle cx="22" cy="21.5" r="2" />
    </>
  ),
  // 奇门：九宫
  qimen: (
    <>
      <rect x="5.5" y="5.5" width="33" height="33" />
      <path d="M16.5 5.5v33M27.5 5.5v33M5.5 16.5h33M5.5 27.5h33" />
      <circle cx="22" cy="22" r="1.3" />
    </>
  ),
};

export default function DivinationGlyph({
  name,
  size = 44,
}: {
  name: GlyphName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPHS[name]}
    </svg>
  );
}
