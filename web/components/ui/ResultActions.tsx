'use client';

import Link from 'next/link';
import styles from './ResultActions.module.css';

export type ResultAction = {
  key: string;
  label: string;
  hint?: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
};

export type ResultActionsProps = {
  items: ResultAction[];
  caption?: string;
};

export default function ResultActions({ items, caption }: ResultActionsProps) {
  function renderItem(item: ResultAction, mobile: boolean) {
    const className = `${styles.action}${mobile ? ` ${styles.actionMobile}` : ''}`;
    const primary = item.primary || undefined;

    if (item.href) {
      return (
        <Link
          key={item.key}
          href={item.href}
          className={className}
          title={item.hint}
          data-primary={primary}
        >
          {item.label}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        className={className}
        title={item.hint}
        data-primary={primary}
        onClick={item.onClick}
      >
        {item.label}
      </button>
    );
  }

  return (
    <>
      <div className={styles.bar}>
        {caption ? <span className={styles.caption}>{caption}</span> : null}
        <div className={styles.group}>{items.map((item) => renderItem(item, false))}</div>
      </div>

      <nav className={styles.mobileBar} aria-label="结果操作">
        {items.map((item) => renderItem(item, true))}
      </nav>
    </>
  );
}
