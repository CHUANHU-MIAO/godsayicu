'use client';

import { useEffect, useState } from 'react';
import styles from './TodayBar.module.css';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

export default function TodayBar() {
  const [text, setText] = useState('');

  useEffect(() => {
    const now = new Date();
    setText(
      `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${WEEK[now.getDay()]}`,
    );
  }, []);

  return <p className={styles.bar}>{text}</p>;
}
