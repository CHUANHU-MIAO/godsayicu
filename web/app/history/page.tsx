'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { buildPlainReading } from '@/lib/divination/plain-reading';
import {
  clearHistory,
  domainLabel,
  formatHistoryTime,
  listHistory,
  removeHistory,
  type HistoryEntry,
} from '@/lib/history/local-history';

import styles from './history.module.css';

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEntries(listHistory());
    setLoading(false);
  }, []);

  const domains = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.domain))),
    [entries],
  );
  const visible = filter === 'all' ? entries : entries.filter((entry) => entry.domain === filter);

  function remove(id: string) {
    removeHistory(id);
    setEntries(listHistory());
    if (openId === id) setOpenId(null);
  }

  function clearAll() {
    if (!window.confirm('确定清空全部本地记录？此操作不可撤销。')) return;
    clearHistory();
    setEntries([]);
    setOpenId(null);
    setFilter('all');
  }

  const opened = openId ? entries.find((entry) => entry.id === openId) : null;
  const reading = opened ? buildPlainReading(opened.domain, opened.payload, opened.subtitle) : null;

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <Link href="/" className={styles.back}>
          ← 返 回
        </Link>
        <h1 className={styles.title}>问事录</h1>
        <p className={styles.sub}>
          本机留存 · 匿名可用 · 最多 100 条。记录只存在此浏览器，不上传、不依赖账号。
        </p>
      </header>

      {entries.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.filters} aria-label="按术数筛选">
            <button
              type="button"
              className={`${styles.chip} ${filter === 'all' ? styles.chipOn : ''}`}
              onClick={() => setFilter('all')}
            >
              全部 <span className={styles.count}>{entries.length}</span>
            </button>
            {domains.map((domain) => (
              <button
                key={domain}
                type="button"
                className={`${styles.chip} ${filter === domain ? styles.chipOn : ''}`}
                onClick={() => setFilter(domain)}
              >
                {domainLabel(domain)}
              </button>
            ))}
          </div>
          <button type="button" className={styles.clear} onClick={clearAll}>
            清空
          </button>
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>正在读取本机记录…</p>
      ) : visible.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyMain}>尚无记录</p>
          <p className={styles.emptySub}>
            完成一次排盘后，结果会自动收录于此。可在展开后查看白话解读与原始盘面。
          </p>
          <Link href="/" className={styles.emptyLink}>
            去起一卦 →
          </Link>
        </div>
      ) : (
        <ol className={styles.list}>
          {visible.map((entry) => {
            const isOpen = openId === entry.id;
            return (
              <li key={entry.id} className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
                <button
                  type="button"
                  className={styles.itemHead}
                  onClick={() => setOpenId(isOpen ? null : entry.id)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.badge}>{entry.label}</span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemTitle}>
                      {entry.question || entry.summary || '未记所问'}
                    </span>
                    <span className={styles.itemMeta}>
                      {formatHistoryTime(entry.createdAt)}
                      {entry.summary ? ` · ${entry.summary}` : ''}
                    </span>
                  </span>
                  <span className={styles.chevron} aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && reading && (
                  <div className={styles.detail}>
                    <p className={styles.lead}>{reading.lead}</p>
                    {reading.sections.map((section) => (
                      <section key={section.heading} className={styles.section}>
                        <h3 className={styles.sectionTitle}>{section.heading}</h3>
                        <p className={styles.sectionBody}>{section.body}</p>
                        {section.hint && <p className={styles.hint}>{section.hint}</p>}
                      </section>
                    ))}
                    <p className={styles.footnote}>{reading.footnote}</p>

                    <details className={styles.raw}>
                      <summary className={styles.rawSummary}>查看原始盘面数据</summary>
                      <pre className={styles.pre}>
                        {JSON.stringify(entry.payload, null, 2).slice(0, 6000)}
                      </pre>
                    </details>

                    <div className={styles.actions}>
                      <Link href={`/${entry.domain}`} className={styles.actionLink}>
                        再问一次 →
                      </Link>
                      <button type="button" className={styles.delete} onClick={() => remove(entry.id)}>
                        删除此条
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
