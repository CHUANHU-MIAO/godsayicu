import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 产物自包含，可直接在 Ubuntu 上以 node server.js 运行
  output: 'standalone',
  reactStrictMode: true,
  // 关闭开发模式左下角的 "N" 角标（仅 dev 显示，生产构建本就没有）
  devIndicators: false,
  // taibu-core 内部用 createRequire(import.meta.url) 动态加载占星依赖。
  // 一旦被 webpack 打包，import.meta.url 会被固化成构建机的绝对 file URL
  // （例如 file:///home/runner/work/...），standalone 产物换机运行时会抛
  // ERR_INVALID_ARG_VALUE / MODULE_NOT_FOUND，导致 /api/divination 500。
  // 保持为运行时外部依赖，让 ESM 文件保留真实的 import.meta.url。
  serverExternalPackages: ['taibu-core'],
};

export default nextConfig;
