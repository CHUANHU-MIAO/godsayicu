/**
 * 统一验证入口：跨平台顺序执行所有回归脚本。
 * 不在 npm script 里用 `&&` 串联，避免 Windows / Linux shell 差异。
 * 运行：node scripts/verify.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

const checks = [
  ['全术数域冒烟', 'verify-all-domains.mjs'],
  ['六爻接入', 'verify-liuyao.mjs'],
  ['天山遁回归', 'verify-tianshandun.mjs'],
];

let failed = 0;

for (const [name, file] of checks) {
  console.log(`\n=== ${name} (${file}) ===`);
  const result = spawnSync(process.execPath, [path.join(here, file)], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error(`[verify] ${name} 未通过（exit ${result.status}）`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n[verify] ${failed} / ${checks.length} 项未通过`);
  process.exit(1);
}

console.log(`\n[verify] ${checks.length} / ${checks.length} 项全部通过`);
