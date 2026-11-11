'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  domainLabel,
  formatHistoryTime,
  listHistory,
  type HistoryEntry,
} from '@/lib/history/local-history';
import styles from './HistoryDrawer.module.css';

export type HistoryDrawerProps = {
  /** 只显示某一术数的记录；不传则显示全部 */
  domain?: string;
  label?: string;
  className?: string;
};

export default function HistoryDrawer({
  domain,
  label = '问事录',
  className,
}: HistoryDrawerProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(listHistory().length);
  }, []);

  useEffect(() => {
    if (!open) return;
    const all = listHistory();
    setEntries(all);
    setTotal(all.length);
    setReady(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const visible = domain ? entries.filter((entry) => entry.domain === domain) : entries;

  return (
    <>
      <button
        type="button"
        className={`${styles.trigger}${className ? ` ${className}` : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {label}
        <span className={styles.badge}>{total}</span>
      </button>

      {open ? (
        <div
          className={styles.overlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <aside className={styles.panel} role="dialog" aria-modal="true" aria-label="问事录">
            <span className={styles.handle} aria-hidden="true" />

            <header className={styles.head}>
              <div>
                <h2 className={styles.title}>问事录</h2>
                <p className={styles.sub}>本机留存 · 匿名可用 · 最多 100 条</p>
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </header>

            <div className={styles.meta}>
              <span className={styles.count}>{visible.length} 条</span>
              <span>{domain ? `仅看${domainLabel(domain)}` : '全部术数'}</span>
            </div>

            <div className={styles.body}>
              {!ready ? (
                <p className={styles.hint}>读取中…</p>
              ) : visible.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon} aria-hidden="true">
                    ○
                  </span>
                  <p className={styles.emptyTitle}>还没有记录</p>
                  <p className={styles.emptyDesc}>完成一次起卦后，结果会自动留存在此浏览器。</p>
                </div>
              ) : (
                visible.map((entry) => (
                  <article key={entry.id} className={styles.item}>
                    <div className={styles.itemTop}>
                      <span className={styles.tag}>{domainLabel(entry.domain)}</span>
                      <time className={styles.time}>{formatHistoryTime(entry.createdAt)}</time>
                    </div>
                    <p className={styles.summary}>{entry.summary || entry.label}</p>
                    {entry.question ? (
                      <p className={styles.question}>问：{entry.question}</p>
                    ) : null}
                  </article>
                ))
              )}
            </div>

            <footer className={styles.foot}>
              <Link href="/history" className={styles.link} onClick={() => setOpen(false)}>
                查看全部记录 →
              </Link>
              <span className={styles.footNote}>记录只存在此浏览器</span>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
