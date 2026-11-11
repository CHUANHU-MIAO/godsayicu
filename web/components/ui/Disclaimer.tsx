import type { ReactNode } from 'react';
import styles from './Disclaimer.module.css';

export type DisclaimerProps = {
  children?: ReactNode;
  compact?: boolean;
};

const DEFAULT_TEXT =
  '本页内容为传统术数文化的学习与整理，仅供文化参考，不构成决策、投资、医疗或法律建议。';

export default function Disclaimer({ children, compact = false }: DisclaimerProps) {
  return (
    <p className={`${styles.note}${compact ? ` ${styles.compact}` : ''}`}>
      <span className={styles.mark} aria-hidden="true">
        ※
      </span>
      <span>{children ?? DEFAULT_TEXT}</span>
    </p>
  );
}
