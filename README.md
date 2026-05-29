# Light Commerce Platform

Next.js App Router 单体轻量电商系统，覆盖前台商品浏览、注册登录、购物车、下单、我的订单，以及后台分类、商品、订单、顾客、站点配置和图片上传管理。

## 本地启动

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

创建本地演示数据：

PowerShell：

```powershell
$env:ALLOW_INSECURE_SEED_DEFAULTS="true"; $env:SEED_DEMO_DATA="true"; pnpm db:seed
```

Bash：

```bash
ALLOW_INSECURE_SEED_DEFAULTS=true SEED_DEMO_DATA=true pnpm db:seed
```

本地演示默认管理员：`admin / admin123456`。生产环境必须设置 `SEED_ADMIN_PASSWORD`、`SESSION_SECRET` 和 `PASSWORD_PEPPER`。

## 生产部署

推荐部署到 Vercel + Supabase。

最短流程：

```bash
cp .env.production.example .env.production
pnpm install --frozen-lockfile
ENV_FILE=.env.production pnpm deploy:init
```

然后在 Vercel 导入 GitHub 仓库，配置 `.env.production.example` 中除 `SEED_ADMIN_PASSWORD` 以外的运行时变量。仓库已包含 `vercel.json`，Vercel 会使用 pnpm 安装并执行 `pnpm build`。

详细步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 验证

```bash
pnpm test:round1
pnpm test:round2
pnpm test:round3
```

部署前生产变量检查：

```bash
ENV_FILE=.env.production pnpm deploy:check
```

