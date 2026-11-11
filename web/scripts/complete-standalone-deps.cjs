/**
 * 补齐 standalone 产物里被漏追的生产依赖。
 *
 * taibu-core 在 dist/domains/astrology/calculate.js 里使用
 *   const require = createRequire(import.meta.url);
 * 动态加载占星依赖。@vercel/nft 对这种写法可能漏追，缺包会让
 * /api/divination 在运行时 500，且错误只出现在服务端日志里。
 *
 * 只补 standalone/node_modules 里尚不存在的包，
 * 不覆盖 Next 自己 traced 进来的版本（避免版本错配）。
 * 用法：在 web/ 目录、npm run build 之后执行。
 */
const fs = require('fs');
const path = require('path');

const webRoot = process.cwd();
const src = path.join(webRoot, 'node_modules');
const standalone = path.join(webRoot, '.next', 'standalone');
const dst = path.join(standalone, 'node_modules');

if (!fs.existsSync(path.join(standalone, 'server.js'))) {
  console.error('standalone build not found; run `npm run build` first');
  process.exit(1);
}

fs.mkdirSync(dst, { recursive: true });

const seen = new Set();
const added = [];

function add(name) {
  if (seen.has(name)) return;
  seen.add(name);

  const pkgDir = path.join(src, name);
  const pkgJson = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgJson)) return;

  let deps = {};
  try {
    deps = JSON.parse(fs.readFileSync(pkgJson, 'utf8')).dependencies || {};
  } catch {
    return;
  }
  Object.keys(deps).forEach(add);

  const target = path.join(dst, name);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(pkgDir, target, { recursive: true });
    added.push(name);
  }
}

add('taibu-core');

console.log(
  `checked ${seen.size} packages, added ${added.length}: ${added.join(', ') || '(none)'}`,
);
