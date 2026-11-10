/**
 * Windows 本地生产构建入口。
 *
 * 用 Node 子进程启动 next build，并注入 next-trace-noop.cjs 预加载脚本，
 * 绕开 Next 15.5.x 在 Windows 上的 `.next/trace` EPERM 问题。
 * 不用 shell 的 `&&` / `set` 串联，保证跨平台一致。
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const preload = path.join(here, 'next-trace-noop.cjs').replace(/\\/g, '/');
const nextBin = path.join(here, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

const existing = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : '';
const env = {
  ...process.env,
  NODE_OPTIONS: `${existing}--require="${preload}"`,
  NEXT_TELEMETRY_DISABLED: '1',
};

const result = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env,
});

if (result.error) {
  console.error('[build:win] 启动失败：', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
