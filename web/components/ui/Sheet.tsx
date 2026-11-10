'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Sheet.module.css';

export type SheetProps = {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  panelClassName?: string;
};

export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
  panelClassName,
}: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, mounted, closeOnEsc, onClose]);

  if (!mounted || !open) return null;

  const overlayClasses = [styles.overlay, className]
    .filter(Boolean)
    .join(' ');
  const panelClasses = [styles.panel, panelClassName]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      className={overlayClasses}
      onClick={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={panelRef}
        className={panelClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
      >
        <span className={styles.handle} aria-hidden="true" />

        {title || description || onClose ? (
          <header className={styles.header}>
            <div className={styles.heading}>
              {title ? (
                <h2 className={styles.title} id={titleId}>
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className={styles.description} id={descId}>
                  {description}
                </p>
              ) : null}
            </div>
            {onClose ? (
              <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="关闭"
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </header>
        ) : null}

        <div className={styles.body}>{children}</div>

        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
