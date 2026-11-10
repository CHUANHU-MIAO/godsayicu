import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Divider.module.css';

export type DividerProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export default function Divider({
  className,
  children,
  ...rest
}: DividerProps) {
  const classes = [styles.divider, !children && styles.plain, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div {...rest} className={classes} role="separator">
      {children ? <span className={styles.text}>{children}</span> : null}
    </div>
  );
}
