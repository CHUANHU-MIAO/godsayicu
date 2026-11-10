'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import styles from './Segmented.module.css';

export type SegmentedOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type SegmentedProps = {
  options: SegmentedOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  disabled?: boolean;
  /** 分组无障碍名称 */
  ariaLabel?: string;
  className?: string;
};

export default function Segmented({
  options,
  value,
  defaultValue,
  onChange,
  size = 'md',
  fullWidth = false,
  disabled = false,
  ariaLabel = '选项',
  className,
}: SegmentedProps) {
  const [innerValue, setInnerValue] = useState(
    defaultValue ?? options[0]?.value,
  );
  const currentValue = value ?? innerValue;

  const handleSelect = (next: string, optionDisabled?: boolean) => {
    if (disabled || optionDisabled) return;
    if (value === undefined) {
      setInnerValue(next);
    }
    onChange?.(next);
  };

  const classes = [
    styles.segmented,
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === currentValue;
        return (
          <button
            key={option.value}
            type="button"
            className={[styles.item, active ? styles.active : null]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={active}
            disabled={disabled || option.disabled}
            onClick={() =>
              handleSelect(option.value, option.disabled)
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
