import type { Metadata } from 'next';
import HistoryBridge from '@/components/history/HistoryBridge';
import MotionGovernor from '@/components/motion/MotionGovernor';
import AppearanceToggle from '@/components/theme/AppearanceToggle';
import './globals.css';

/** 首屏渲染前同步应用外观与保守动效档，避免亮暗闪烁 */
const BOOT_SCRIPT = `(function(){try{var p=new URLSearchParams(location.search).get('appearance');var a=(p==='light'||p==='dark')?p:(localStorage.getItem('wen.appearance')||'system');var d=a==='dark'||(a==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.appearance=d?'dark':'light';var m=localStorage.getItem('wen.motion')||'auto';var r=matchMedia('(prefers-reduced-motion: reduce)').matches;document.documentElement.dataset.motion=r?'off':(m==='off'||m==='calm'||m==='full')?m:'calm';}catch(e){document.documentElement.dataset.appearance='dark';document.documentElement.dataset.motion='calm';}})();`;

export const metadata: Metadata = {
  title: '观象 · 问天',
  description: '观象以知变，问天而察机。',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <MotionGovernor />
        <HistoryBridge />
        {children}
        <AppearanceToggle />
      </body>
    </html>
  );
}
