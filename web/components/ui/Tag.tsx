import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Tag.module.css';

export type TagTone = 'gold' | 'cinnabar' | 'jade' | 'mute';

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: TagTone;
  children?: ReactNode;
};

export default function Tag({
  tone = 'mute',
  className,
  children,
  ...rest
}: TagProps) {
  const classes = [styles.tag, styles[tone], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span {...rest} className={classes}>
      {children}
    </span>
  );
}
