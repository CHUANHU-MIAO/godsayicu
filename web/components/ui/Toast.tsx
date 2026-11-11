'use client';

import { useEffect } from 'react';
import styles from './Toast.module.css';

export type ToastProps = {
  message: string | null;
  onDismiss?: () => void;
  duration?: number;
};

export default function Toast({ message, onDismiss, duration = 2400 }: ToastProps) {
  useEffect(() => {
    if (!message || !onDismiss) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss, duration]);

  if (!message) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden="true" />
      {message}
    </div>
  );
}
