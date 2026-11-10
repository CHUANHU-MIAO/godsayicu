import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 产物自包含，可直接在 Ubuntu 上以 node server.js 运行
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
