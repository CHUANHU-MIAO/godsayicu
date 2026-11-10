import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 产物自包含，可直接在 Ubuntu 上以 node server.js 运行
  output: 'standalone',
  reactStrictMode: true,
  // 关闭开发模式左下角的 "N" 角标（仅 dev 显示，生产构建本就没有）
  devIndicators: false,
};

export default nextConfig;
