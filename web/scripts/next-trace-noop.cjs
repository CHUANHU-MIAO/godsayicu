/**
 * Windows 本地构建用的 NODE_OPTIONS 预加载脚本。
 *
 * 问题：Next.js 15.5.x 在 `next build` 开始时就为 `.next/trace` 创建追加写流，
 * 随后 `cleanDistDir` 会递归清空 `.next`；在 Windows 上被占用文件无法删除，
 * 写流再次打开时报 `EPERM: operation not permitted, open '.next/trace'`，
 * 并以 uncaughtException 中断构建（Next.js 已知问题，非项目代码错误）。
 *
 * trace 只用于本地性能诊断，不参与任何构建产物。这里把该写流替换为内存空写流，
 * 其余文件写入完全不变。Ubuntu / CI 生产构建不需要此脚本，直接使用 `npm run build`。
 */
const fs = require('node:fs');
const { Writable } = require('node:stream');

const original = fs.createWriteStream;

fs.createWriteStream = function createWriteStreamPatched(file, options) {
  if (typeof file === 'string' && /[\\/]\.next[\\/]trace$/.test(file)) {
    return new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
  }
  return original.call(this, file, options);
};
