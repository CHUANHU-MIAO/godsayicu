'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Spinner } from '@/components/ui';
import styles from './account.module.css';

interface User {
  id: string;
  email: string;
  nickname: string;
}

interface CreditEntry {
  id: string;
  delta: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  signup_bonus: '注册赠送',
  ai_interpret: 'AI 解读',
};

function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [entries, setEntries] = useState<CreditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const meResponse = await fetch('/api/auth/me');
        if (meResponse.status === 401) {
          router.replace('/login');
          return;
        }
        const meData = await meResponse.json();
        if (!meResponse.ok) {
          throw new Error(meData?.error?.message ?? '加载用户信息失败');
        }

        const creditsResponse = await fetch('/api/credits');
        const creditsData = await creditsResponse.json();
        if (!creditsResponse.ok) {
          throw new Error(creditsData?.error?.message ?? '加载额度失败');
        }

        if (!cancelled) {
          setUser(meData.user as User);
          setBalance(creditsData.balance as number);
          setEntries((creditsData.entries ?? []) as CreditEntry[]);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <p className={styles.eyebrow}>观象 · 账户</p>
        <h1 className={styles.title}>我 的</h1>
      </header>

      {loading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      {user ? (
        <>
          <Card variant="outline" className={styles.profile}>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>昵称</span>
              <span className={styles.profileName}>{user.nickname}</span>
            </div>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>邮箱</span>
              <span className={styles.profileValue}>{user.email}</span>
            </div>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>额度</span>
              <span className={styles.credits}>
                {balance ?? '—'}
                <em>次</em>
              </span>
            </div>
          </Card>

          <section className={styles.ledger}>
            <h2 className={styles.ledgerTitle}>额度流水</h2>
            {entries.length === 0 ? (
              <p className={styles.empty}>暂无流水</p>
            ) : (
              <ul className={styles.entries}>
                {entries.map((entry) => (
                  <li key={entry.id} className={styles.entry}>
                    <span className={styles.reason}>{reasonLabel(entry.reason)}</span>
                    <span
                      className={styles.delta}
                      data-positive={entry.delta > 0 || undefined}
                    >
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </span>
                    <span className={styles.balance}>余 {entry.balanceAfter}</span>
                    <span className={styles.time}>{formatTime(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className={styles.actions}>
            <Button variant="ghost" size="md" fullWidth onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </>
      ) : null}
    </main>
  );
}
