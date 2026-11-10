import Link from 'next/link';
import OrbitStage from '@/components/home/OrbitStage';
import TodayBar from '@/components/layout/TodayBar';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.home}>
      <div className={styles.atmosphere} aria-hidden="true" />

      <nav className={styles.topbar} aria-label="快捷入口">
        <Link href="/history" className={styles.accountLink}>
          记 录
        </Link>
        <Link href="/lab" className={styles.accountLink}>
          实 验 室
        </Link>
        <Link href="/account" className={styles.accountLink}>
          我 的
        </Link>
      </nav>

      <header className={styles.hero}>
        <TodayBar />
        <h1 className={styles.title}>观象 · 问天</h1>
        <p className={styles.tagline}>九门环列 · 择一而入</p>
      </header>

      <OrbitStage />

      <footer className={styles.foot}>观象 · 问天</footer>
    </main>
  );
}
