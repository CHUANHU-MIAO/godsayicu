# ICU

中文术数文化学习平台。自研前端 + `taibu-core`（MIT）计算引擎 + 自研薄后端，闭源、可商用。

- **前端**：Next.js 15（App Router）+ TypeScript + CSS Modules，朱玄 / 月纸双主题 + 性能自适应动效，字体全部本地托管，零外部请求
- **计算**：`taibu-core@4.0.0`（MIT），15 个域全量接入，封装在 `lib/divination/`
- **后端**：`app/api/`，PostgreSQL + Drizzle ORM + scrypt/JWT（HttpOnly Cookie）
- **术数**：六爻、塔罗、紫微、大六壬、黄历、杯筊、八字、梅花、奇门（9 个页面）

计划、决策、许可边界与变更日志见仓库根目录 `记忆.md`。

## 本地启动（Windows）

双击仓库根目录的 `启动开发.bat`，它会自动把便携版 Node 加入 PATH、启动 dev server 并打开浏览器。

手动启动（每个新终端都要先设 PATH）：

```powershell
$env:PATH = "C:\Users\Administrator\.local\lib\node\current;" + $env:PATH
cd C:\Users\Administrator\Desktop\wentian\web
npm run dev
```

访问 `http://localhost:3000`。色谱与外观方案台在 `/lab`，匿名排盘记录在 `/history`。

`?appearance=light` / `?appearance=dark` 可强制预览某一主题（仅首屏生效，手动切换后自动失效）。

## 环境变量

复制 `.env.example` 为 `.env.local` 后填写（`.env*` 已全部被 git 忽略）：

| 变量 | 用途 | 未配置时 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 | 账号、额度、历史相关 API 返回 503 |
| `AUTH_SECRET` | JWT HS256 签名密钥（≥16 位） | 认证不可用 |
| `OPENAI_BASE_URL` | OpenAI 兼容接口 | 默认 `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | AI 解读密钥 | `/api/ai/interpret` 返回 503 |

**排盘（`/api/divination`）不依赖任何环境变量**，仅调用 `taibu-core`，匿名即可使用。

首次启用数据库功能：

```bash
npm run db:generate   # 生成迁移到 lib/db/migrations
npm run db:push       # 或直接把 schema 推到数据库
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 开发服务器（3000） |
| `npm run build` | 生产构建，`output: 'standalone'`（Linux / CI 用这条） |
| `npm run build:win` | Windows 本机生产构建，见下方说明 |
| `npm run start` | 仅本地临时预览；`output: 'standalone'` 下会有警告，生产请用 standalone 入口 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | 顺序执行全术数域冒烟、六爻接入、天山遁回归 |
| `npm run db:generate` / `db:push` / `db:studio` | Drizzle 迁移工具 |

`verify` 由 `scripts/verify.mjs` 统一调度，不在 npm script 中使用 `&&` 串联，保证 Windows / Linux 行为一致。

### Windows 本机构建的已知问题

Next.js 15.5.x 在 Windows 上会在构建开始时打开 `.next/trace` 追加写流，随后 `cleanDistDir` 递归清空 `.next`，被占用文件无法删除，导致：

```text
uncaughtException [Error: EPERM: operation not permitted, open '...\web\.next\trace']
```

这是 Next.js 自身的写入顺序问题，**不是项目代码错误**。`.next/trace` 只是诊断数据，不参与任何产物；`npm run build:win` 通过 `scripts/build-win.mjs` 注入 `scripts/next-trace-noop.cjs`，把该写流替换为内存空写流，其余文件写入不变。Ubuntu / CI 请直接用 `npm run build`，无需该脚本。

构建时会提示 `ESLint must be installed`，属非致命提示（当前未装 ESLint，类型检查由 `npm run typecheck` 承担），构建仍正常产出。

## 外观与动效

- **朱玄 / 月纸**：默认暗色为朱玄（墨夜 + 朱砂），`app/globals.css` 提供亮色「月纸」全套 token。组件颜色一律走 `--c-*` 变量（含 `--c-accent-rgb` 等 RGB 分量），**禁止硬编码色值**，否则亮暗切换会残留深色块。语义色 `--c-active-bg` / `--c-idle-line` / `--c-positive` / `--c-negative` / `--c-scrim` / `--c-shadow` / `--c-subtle` 均已按亮暗两套分别定义，新增组件直接引用即可。
- **三态切换**：右下角悬浮按钮提供亮色 / 暗色 / 跟随系统；偏好存 `localStorage.wen.appearance`，`layout.tsx` 的内联脚本在首屏渲染前同步写入 `html[data-appearance]`，避免闪烁。
- **性能自适应**：`lib/motion/governor.ts` 综合 CPU 核数、`deviceMemory`、网络有效性、省流量、触屏、DPR，并采样一次真实 rAF 帧率，输出 `off / calm / full` 写入 `html[data-motion]`。低档关闭全部动画、不绑定滚动/鼠标监听、不渲染粒子层；系统 `prefers-reduced-motion` 强制静态且不可手动覆盖。手动偏好存 `localStorage.wen.motion`，档位可在 `/lab` 性能面板查看与覆盖。
- **星图首页**：`components/home/OrbitStage` 为纯 SVG + CSS 实现（24 刻度、八卦爻线、九门环绕），零 3D 依赖；`≤900px` 自动退化为卡片网格。
- **方案台**：`/lab` 只保留「色谱与外观」——三套配色、亮暗两套色板、WCAG 对比度与实际排版取样；布局、动效、性能诊断等对照区块已移除。性能自适应治理仍由 `lib/motion/governor.ts` 在全站运行，与方案台是否展示无关。
- **开发角标**：`next.config.ts` 设 `devIndicators: false`，关闭开发模式下左下角的 Next.js「N」角标；生产构建本就不显示。

## 生产部署（Ubuntu）

```bash
npm ci
npm run build
cp -r public .next/standalone/          # standalone 产物不含 public
cp -r .next/static .next/standalone/.next/
pm2 start .next/standalone/server.js --name wentian
```

`output: 'standalone'` 下不要用 `npm run start` 对外提供服务（Next 会告警且依赖不完整），入口是 `node .next/standalone/server.js`。

Nginx 反代 3000，并对 `/api/ai/interpret` 关闭 `proxy_buffering`（SSE 流式输出）。经 Cloudflare 代理时同样需要对 SSE 路径关闭缓冲、放行 PayPal webhook。

**上线前必须在 Linux 上真实跑一次 `npm run build`**，Windows 通过不代表 Linux 通过（文件系统大小写敏感、行尾 LF、路径分隔符）。

### CI 构建 + 服务器零构建更新（推荐）

云盘 IOPS 有限时，不要在服务器上跑 `npm ci` / `npm run build`（几万个小文件读写会打满 IOPS，整机连带卡顿）。改为在 GitHub Actions 的 `ubuntu-latest` 上构建，服务器只下载解压产物并跑 `node server.js`。

- `.github/workflows/build-standalone.yml`：push `main`（或手动触发）→ Node 22 → `npm ci` → `npm run build` → 补齐 `public/` 与 `.next/static/` → 打成单个 `icu-standalone.tar.gz` → 发布到固定 tag `standalone-latest` 的 Release（每次覆盖），同时上传保留 7 天的 artifact 备用。
- `web/deploy/update-from-release.sh`：服务器端更新脚本。带 PAT 从 Release 下载 → 解压到 `/opt/icu-app/releases/<sha12>` → 原子切换 `/opt/icu-app/current` 软链 → 重建 PM2 配置并重启 `icu` → 自检 HTTP 200；**失败自动回滚到上一版**，默认保留最近 3 个版本。

服务器首次使用（**仓库已公开，无需任何凭据**；逐条单独执行，纯 ASCII）：

```bash
curl -fsSL -o /opt/update-icu.sh https://raw.githubusercontent.com/CHUANHU-MIAO/godsayicu/main/web/deploy/update-from-release.sh
```

```bash
nohup bash /opt/update-icu.sh > /opt/icu-update.log 2>&1 &
```

```bash
tail -30 /opt/icu-update.log
```

日志出现 `OK: ICU running ... (HTTP 200)` 即完成；断线重连后再粘一次 `tail` 即可接着看。手动回滚：

```bash
ln -sfn /opt/icu-app/releases/<older-id> /opt/icu-app/current
pm2 restart icu --update-env
```

**约束**：产物必须由 Linux 构建，Windows `build:win` 产物不保证能在 Ubuntu 运行。Release 附件走 GitHub 的下载 CDN，国内服务器若访问不稳，脚本会自动重试 5 次并在失败时给出明确提示，必要时改用镜像或云控制台上传。切换后 PM2 的 script 指向 `/opt/icu-app/current/server.js`，与旧的 `/opt/godsayicu/web/.next/standalone/server.js` 不同，确认新服务 HTTP 200 后再清理旧目录。

## 跨平台硬约束

- 路径一律 `path.join()`，禁止硬编码 `\` 或 `C:\`
- import 路径大小写必须精确
- npm 脚本不依赖 shell 专有语法，复杂逻辑写成 node 脚本
- 行尾统一 LF（根目录 `.gitattributes`）
- 不使用任何 Windows 专属 API

## 许可边界

`taibu-core` 为 MIT，可商用可闭源。taibu 仓库的 `src/`（Web、服务端、Docker）为 **AGPL-3.0-only，一行未用**；塔罗牌面、仪式素材、字体均为自有。本项目 UI 与后端全部原创。
