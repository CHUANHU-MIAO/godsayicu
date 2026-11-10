import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '观象 · 问天',
  description: '观象以知变，问天而察机。',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
