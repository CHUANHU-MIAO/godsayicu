'use client';

import { useState } from 'react';
import Sheet from './Sheet';
import styles from './TermTip.module.css';

export type Term = {
  term: string;
  desc: string;
};

export type TermTipProps = {
  terms: Term[];
  label?: string;
  title?: string;
  description?: string;
  className?: string;
  /** 受控模式：由外部操作栏打开术语弹层 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 只渲染弹层，不渲染触发按钮 */
  hideTrigger?: boolean;
};

export default function TermTip({
  terms,
  label = '术语说明',
  title = '术语说明',
  description = '本页出现的传统术语释义，仅供文化学习参考。',
  className,
  open,
  onOpenChange,
  hideTrigger = false,
}: TermTipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;

  function setOpen(next: boolean) {
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  }

  return (
    <>
      {hideTrigger ? null : (
        <button
          type="button"
          className={`${styles.trigger}${className ? ` ${className}` : ''}`}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <span className={styles.mark} aria-hidden="true">
            ?
          </span>
          {label}
        </button>
      )}

      <Sheet
        open={isOpen}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
      >
        <dl className={styles.list}>
          {terms.map((item) => (
            <div key={item.term} className={styles.row}>
              <dt className={styles.term}>{item.term}</dt>
              <dd className={styles.desc}>{item.desc}</dd>
            </div>
          ))}
        </dl>
      </Sheet>
    </>
  );
}
