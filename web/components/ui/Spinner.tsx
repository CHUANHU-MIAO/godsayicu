import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export type SpinnerProps = {
  size?: SpinnerSize;
  /** 无障碍文案，默认「加载中」 */
  label?: string;
  /** 纯装饰场景（如按钮内部）传 true，不再重复播报 */
  decorative?: boolean;
  className?: string;
};

export default function Spinner({
  size = 'md',
  label = '加载中',
  decorative = false,
  className,
}: SpinnerProps) {
  const classes = [styles.spinner, styles[size], className]
    .filter(Boolean)
    .join(' ');

  if (decorative) {
    return <span className={classes} aria-hidden="true" />;
  }

  return (
    <span className={classes} role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
    </span>
  );
}
