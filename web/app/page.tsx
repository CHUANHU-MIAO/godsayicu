import Link from 'next/link';
import DivinationGlyph from '@/components/icons/DivinationGlyph';
import TodayBar from '@/components/layout/TodayBar';
import styles from './page.module.css';

const ENTRIES = [
  { href: '/liuyao', name: '六爻', sub: '三枚铜钱，六摇成卦', key: 'liuyao' },
  { href: '/tarot', name: '塔罗', sub: '七十八张，观象取意', key: 'tarot' },
  { href: '/ziwei', name: '紫微', sub: '十二宫位，星曜布列', key: 'ziwei' },
  { href: '/daliuren', name: '六壬', sub: '天地盘立，四课三传', key: 'daliuren' },
  { href: '/almanac', name: '黄历', sub: '宜忌神煞，日辰吉凶', key: 'almanac' },
  { href: '/jiao', name: '杯筊', sub: '一正一反，问之于神', key: 'jiao' },
  { href: '/bazi', name: '八字', sub: '四柱排盘，大运流转', key: 'bazi' },
  { href: '/meihua', name: '梅花', sub: '观物取象，随心起卦', key: 'meihua' },
  { href: '/qimen', name: '奇门', sub: '九宫布局，趋避择时', key: 'qimen' },
] as const;

export default function Home() {
  return (
    <main className={styles.home}>
      <div className={styles.atmosphere} aria-hidden="true" />

      <nav className={styles.topbar} aria-label="快捷入口">
        <Link href="/history" className={styles.accountLink}>
          记 录
        </Link>
        <Link href="/account" className={styles.accountLink}>
          我 的
        </Link>
      </nav>

      <header className={styles.hero}>
        <TodayBar />
        <h1 className={styles.title}>观象</h1>
        <p className={styles.tagline}>观象以知变 · 问天而察机</p>
      </header>

      <section className={styles.grid} aria-label="术数分类">
        {ENTRIES.map((item) => (
          <Link key={item.href} href={item.href} className={styles.card}>
            <span className={styles.glyph} aria-hidden="true">
              <DivinationGlyph name={item.key} size={30} />
            </span>
            <span className={styles.cardBody}>
              <span className={styles.name}>{item.name}</span>
              <span className={styles.desc}>{item.sub}</span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </section>

      <footer className={styles.foot}>观象 · 问天</footer>
    </main>
  );
}
