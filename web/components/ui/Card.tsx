import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export type CardVariant = 'plain' | 'outline' | 'glow';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  children?: ReactNode;
};

export default function Card({
  variant = 'plain',
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [styles.card, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div {...rest} className={classes}>
      {children}
    </div>
  );
}
