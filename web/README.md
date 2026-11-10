# 观象 · 问天

中文术数文化学习平台。自研前端 + `taibu-core`（MIT）计算引擎 + 自研薄后端，闭源、可商用。

- **前端**：Next.js 15（App Router）+ TypeScript + CSS Modules，暗色低照度视觉，字体全部本地托管，零外部请求
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

访问 `http://localhost:3000`。设计改造测试页在 `/lab`。

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
| `npm run build` | 生产构建，`output: 'standalone'` |
| `npm run start` | 启动生产构建 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | 顺序执行全术数域冒烟、六爻接入、天山遁回归 |
| `npm run db:generate` / `db:push` / `db:studio` | Drizzle 迁移工具 |

`verify` 由 `scripts/verify.mjs` 统一调度，不在 npm script 中使用 `&&` 串联，保证 Windows / Linux 行为一致。

## 生产部署（Ubuntu）

```bash
npm ci
npm run build
pm2 start npm --name wentian -- start
```

Nginx 反代 3000，并对 `/api/ai/interpret` 关闭 `proxy_buffering`（SSE 流式输出）。经 Cloudflare 代理时同样需要对 SSE 路径关闭缓冲、放行 PayPal webhook。

**上线前必须在 Linux 上真实跑一次 `npm run build`**，Windows 通过不代表 Linux 通过（文件系统大小写敏感、行尾 LF、路径分隔符）。

## 跨平台硬约束

- 路径一律 `path.join()`，禁止硬编码 `\` 或 `C:\`
- import 路径大小写必须精确
- npm 脚本不依赖 shell 专有语法，复杂逻辑写成 node 脚本
- 行尾统一 LF（根目录 `.gitattributes`）
- 不使用任何 Windows 专属 API

## 许可边界

`taibu-core` 为 MIT，可商用可闭源。taibu 仓库的 `src/`（Web、服务端、Docker）为 **AGPL-3.0-only，一行未用**；塔罗牌面、仪式素材、字体均为自有。本项目 UI 与后端全部原创。
