'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from './Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'ghost' | 'seal' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const ariaLabel =
    rest['aria-label'] ?? (children ? undefined : '按钮');

  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={classes}
    >
      {loading ? (
        <Spinner size="sm" decorative className={styles.spinner} />
      ) : null}
      {children ? <span className={styles.label}>{children}</span> : null}
    </button>
  );
}
