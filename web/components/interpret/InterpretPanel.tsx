'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Spinner } from '@/components/ui';
import styles from './InterpretPanel.module.css';

interface InterpretMeta {
  model: string;
  cost: number;
  balance: number;
}

interface InterpretPanelProps {
  domain: string;
  payload: unknown;
  question?: string;
}

/**
 * AI 解读面板。
 * 走 /api/ai/interpret 的 SSE 流，逐字渲染；服务端负责鉴权、额度扣减与 key 保护。
 */
export default function InterpretPanel({ domain, payload, question }: InterpretPanelProps) {
  const [text, setText] = useState('');
  const [meta, setMeta] = useState<InterpretMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needLogin, setNeedLogin] = useState(false);
  const [finished, setFinished] = useState(false);

  async function run() {
    setLoading(true);
    setError('');
    setNeedLogin(false);
    setText('');
    setMeta(null);
    setFinished(false);

    try {
      const response = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, payload, question }),
      });

      if (response.status === 401) {
        setNeedLogin(true);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? '解读失败，请稍后重试');
      }

      if (!response.body) throw new Error('服务端未返回数据流');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          for (const line of rawEvent.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const data = trimmed.slice('data:'.length).trim();
            if (!data || data === '[DONE]') continue;

            try {
              const event = JSON.parse(data) as {
                type?: string;
                text?: string;
                message?: string;
                model?: string;
                cost?: number;
                balance?: number;
              };

              if (event.type === 'meta') {
                setMeta({
                  model: event.model ?? '',
                  cost: event.cost ?? 0,
                  balance: event.balance ?? 0,
                });
              } else if (event.type === 'delta' && event.text) {
                accumulated += event.text;
                setText(accumulated);
              } else if (event.type === 'error') {
                setError(event.message ?? '解读过程中断');
              }
            } catch {
              // 忽略非 JSON 心跳
            }
          }

          boundary = buffer.indexOf('\n\n');
        }
      }

      setFinished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解读失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <h2 className={styles.title}>AI 解读</h2>
        {meta ? (
          <span className={styles.meta}>
            {meta.model} · 消耗 {meta.cost} · 余 {meta.balance}
          </span>
        ) : null}
      </div>

      {text ? <p className={styles.text}>{text}</p> : null}

      {loading && !text ? (
        <div className={styles.loading}>
          <Spinner />
          <span>正在解读…</span>
        </div>
      ) : null}

      {needLogin ? (
        <p className={styles.notice}>
          请先<Link href="/login">登录</Link>后使用 AI 解读。
        </p>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      {!text && !loading && !needLogin && !error ? (
        <p className={styles.intro}>
          由 AI 结合卦象给出解读，每次消耗 1 次额度。
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button
          variant={text && finished ? 'ghost' : 'primary'}
          size="md"
          loading={loading}
          onClick={run}
        >
          {text ? (finished ? '再解一次' : '解读中…') : '开始解读'}
        </Button>
      </div>
    </section>
  );
}
