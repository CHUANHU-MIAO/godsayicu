'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Field } from '@/components/ui';
import styles from './login.module.css';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body =
      mode === 'login' ? { email, password } : { email, password, nickname };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error?.message ?? '操作失败，请稍后重试');
      }
      router.push('/account');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← 返回
      </Link>

      <header className={styles.head}>
        <p className={styles.eyebrow}>一念归静 · 万理昭明</p>
        <h1 className={styles.title}>{mode === 'login' ? '登 录' : '注 册'}</h1>
        <p className={styles.sub}>
          {mode === 'login' ? '以邮箱登录，查看记录与额度' : '注册即赠 3 次解读额度'}
        </p>
      </header>

      <Card variant="outline" className={styles.panel}>
        <div className={styles.tabs} role="tablist" aria-label="登录或注册">
          <button
            type="button"
            className={styles.tab}
            data-active={mode === 'login' || undefined}
            onClick={() => switchMode('login')}
            role="tab"
            aria-selected={mode === 'login'}
          >
            登录
          </button>
          <button
            type="button"
            className={styles.tab}
            data-active={mode === 'register' || undefined}
            onClick={() => switchMode('register')}
            role="tab"
            aria-selected={mode === 'register'}
          >
            注册
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <Field
              label="昵称"
              type="text"
              autoComplete="nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              required
              maxLength={32}
            />
          ) : null}

          <Field
            label="邮箱"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Field
            label="密码"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            hint={mode === 'register' ? '至少 8 位' : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={mode === 'register' ? 8 : 1}
          />

          {error ? <p className={styles.error}>{error}</p> : null}

          <Button variant="primary" size="lg" fullWidth loading={loading} type="submit">
            {mode === 'login' ? '登 录' : '注 册'}
          </Button>
        </form>

        <p className={styles.hint}>
          登录状态保存在浏览器 HttpOnly Cookie 中，有效期 7 天。
        </p>
      </Card>
    </main>
  );
}
