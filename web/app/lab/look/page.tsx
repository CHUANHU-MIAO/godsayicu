import Link from 'next/link';
import styles from './look.module.css';

/**
 * 新版式样板页（独立预览，不改动任何现有页面）。
 * 用 CSS Modules + globals.css 的 --ds-* 结构变量复刻 taibu 的界面语言：
 * 0.5px 发丝线、环+投影、圆角刻度、32px 控件行高、13px 分区标题、
 * 窄栏 + gap 节奏 + stagger 上浮。配色仍取本站 --c-* 主题变量。
 */

const SPREADS = [
  { value: 'single', label: '单牌', desc: '一张，观当下' },
  { value: 'situation', label: '处境牌阵', desc: '三张，处境 · 障碍 · 建议' },
  { value: 'horseshoe', label: '马蹄牌阵', desc: '七张，全局推演' },
];

const CARDS = [
  { pos: '过去', name: '隐士', orientation: '正位', meaning: '独处与内省，暂缓外求。' },
  { pos: '现在', name: '节制', orientation: '逆位', meaning: '节奏失衡，宜收不宜放。' },
  { pos: '未来', name: '星辰', orientation: '正位', meaning: '长夜将尽，方向渐明。' },
];

function Icon({ name }: { name: 'cards' | 'spark' | 'clock' }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (name === 'cards') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="11" height="15" rx="1.5" />
        <path d="M9 3h9a2 2 0 0 1 2 2v12" />
      </svg>
    );
  }
  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    </svg>
  );
}

export default function LookPreviewPage() {
  return (
    <main className={styles.page}>
      <Link href="/lab" className={styles.back}>
        ← 返回方案台
      </Link>

      <header className={styles.head}>
        <h1 className={styles.title}>抽 牌</h1>
        <p className={styles.sub}>七十八张，观象取意。以结构参数复刻的界面语言样板。</p>
      </header>

      <div className={styles.stack}>
        <section className={styles.card} aria-labelledby="sec-setup">
          <h2 className={styles.sectionTitle} id="sec-setup">
            <Icon name="spark" />
            起 局
          </h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="q">所问何事</label>
            <textarea
              id="q"
              className={styles.textarea}
              rows={3}
              placeholder="心中默念所问，写于此处（可留空）"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>牌阵</span>
            <div className={styles.segmented} role="group" aria-label="牌阵">
              {SPREADS.map((item, index) => (
                <button
                  key={item.value}
                  type="button"
                  className={styles.segment}
                  data-active={index === 1 || undefined}
                  aria-pressed={index === 1}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.checkboxRow}>
            <label className={styles.checkbox}>
              <input type="checkbox" defaultChecked />
              <span>允许逆位</span>
            </label>
            <span className={styles.hint}>选三项之一，共 {SPREADS.length} 种牌阵</span>
          </div>

          <button type="button" className={styles.primary}>
            抽 牌
          </button>
        </section>

        <section className={styles.card} aria-labelledby="sec-result">
          <h2 className={styles.sectionTitle} id="sec-result">
            <Icon name="cards" />
            盘 面
          </h2>

          <div className={styles.cards}>
            {CARDS.map((item) => (
              <article key={item.pos} className={styles.miniCard}>
                <span className={styles.pos}>{item.pos}</span>
                <div className={styles.figure} data-reversed={item.orientation === '逆位' || undefined}>
                  <span className={styles.figureGlyph}>象</span>
                </div>
                <p className={styles.cardName}>{item.name}</p>
                <span className={styles.tag} data-tone={item.orientation === '逆位' ? 'muted' : 'accent'}>
                  {item.orientation}
                </span>
                <p className={styles.meaning}>{item.meaning}</p>
              </article>
            ))}
          </div>

          <div className={styles.divider} />

          <div className={styles.tags}>
            <span className={styles.tag} data-tone="wood">木</span>
            <span className={styles.tag} data-tone="fire">火</span>
            <span className={styles.tag} data-tone="earth">土</span>
            <span className={styles.tag} data-tone="metal">金</span>
            <span className={styles.tag} data-tone="water">水</span>
            <span className={styles.num}>六三 · 九二</span>
          </div>
        </section>

        <section className={styles.empty} aria-label="空状态示例">
          <span className={styles.emptyIcon}>
            <Icon name="clock" />
          </span>
          <h3 className={styles.emptyTitle}>尚无记录</h3>
          <p className={styles.emptyDesc}>静心默问，而后抽牌；所得卦象会存于此处。</p>
        </section>

        <p className={styles.note}>
          本页仅作版式预览：0.5px 发丝线 · 环+投影 · 6/8/10/14 圆角刻度 ·
          32px 控件行高 · 13px 分区标题 · 窄栏 gap 节奏。配色仍走本站主题变量。
        </p>
      </div>
    </main>
  );
}
