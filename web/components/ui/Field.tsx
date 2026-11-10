'use client';

import { useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import styles from './Field.module.css';

type CommonProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  className?: string;
  wrapperClassName?: string;
  children?: ReactNode;
};

export type FieldProps =
  | (CommonProps & { as?: 'input' } & Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'id' | 'children'
    >)
  | (CommonProps & { as: 'textarea' } & Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      'id' | 'children'
    >)
  | (CommonProps & { as: 'select' } & Omit<
      SelectHTMLAttributes<HTMLSelectElement>,
      'id' | 'children'
    >);

export default function Field(props: FieldProps) {
  const {
    as,
    label,
    hint,
    error,
    id,
    className,
    wrapperClassName,
    children,
    ...rest
  } = props;

  const control = as ?? 'input';
  const generatedId = useId();
  const controlId =
    id ?? `field-${generatedId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const controlClassName = [
    styles.control,
    error ? styles.invalid : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const shared = {
    id: controlId,
    className: controlClassName,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  };

  return (
    <div
      className={[styles.field, wrapperClassName]
        .filter(Boolean)
        .join(' ')}
    >
      {label ? (
        <label className={styles.label} htmlFor={controlId}>
          {label}
        </label>
      ) : null}

      {control === 'textarea' ? (
        <textarea
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          {...shared}
        />
      ) : control === 'select' ? (
        <select
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
          {...shared}
        >
          {children}
        </select>
      ) : (
        <input
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          {...shared}
        />
      )}

      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
