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
      </header>

      <OrbitStage />

      <footer className={styles.foot}>
        一念归静 · 万理昭明
        <p className={styles.credit}>
          排盘引擎{' '}
          <a href="https://github.com/hhszzzz/taibu" target="_blank" rel="noopener noreferrer">
            taibu-core
          </a>{' '}
          （MIT）· 开源项目{' '}
          <a href="https://github.com/hhszzzz/taibu" target="_blank" rel="noopener noreferrer">
            太卜
          </a>
          {' · '}
          <a href="/THIRD_PARTY_NOTICES.txt" target="_blank" rel="noopener noreferrer">
            开源许可声明
          </a>
        </p>
      </footer>
    </main>
  );
}
