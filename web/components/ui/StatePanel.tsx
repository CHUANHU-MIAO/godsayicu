import type { ReactNode } from 'react';
import styles from './StatePanel.module.css';

export type StatePanelState = 'loading' | 'empty' | 'error';

export type StatePanelProps = {
  state: StatePanelState;
  title: string;
  description?: string;
  action?: ReactNode;
  skeletonRows?: number;
};

export default function StatePanel({
  state,
  title,
  description,
  action,
  skeletonRows = 3,
}: StatePanelProps) {
  return (
    <div
      className={styles.panel}
      data-state={state}
      role={state === 'loading' ? 'status' : undefined}
      aria-live={state === 'loading' ? 'polite' : undefined}
    >
      {state === 'loading' ? (
        <div className={styles.skeleton} aria-hidden="true">
          {Array.from({ length: skeletonRows }).map((_, index) => (
            <span
              key={index}
              className={styles.bar}
              style={{ width: `${92 - index * 14}%`, animationDelay: `${index * 90}ms` }}
            />
          ))}
        </div>
      ) : (
        <span className={styles.icon} aria-hidden="true">
          {state === 'error' ? '!' : '○'}
        </span>
      )}

      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
