# Light Commerce Platform

Next.js App Router 单体轻量电商系统，覆盖前台商品浏览、注册登录、购物车、下单、我的订单，以及后台分类、商品、订单、顾客、站点配置和图片上传管理。

## 快速启动

1. 复制环境变量：

```bash
cp .env.example .env
```

2. 准备 Postgres 数据库并填写 `DATABASE_URL`。
3. 安装依赖、迁移、创建本地演示数据：

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

PowerShell 创建本地演示数据：

```powershell
$env:ALLOW_INSECURE_SEED_DEFAULTS="true"; $env:SEED_DEMO_DATA="true"; pnpm db:seed
```

Bash 创建本地演示数据：

```bash
ALLOW_INSECURE_SEED_DEFAULTS=true SEED_DEMO_DATA=true pnpm db:seed
```

仅本地演示默认种子管理员：`admin / admin123456`。生产环境必须通过 `SEED_ADMIN_PASSWORD` 改用强密码，并配置随机 `SESSION_SECRET`、`PASSWORD_PEPPER`。

## 生产部署

- Vercel Framework：Next.js
- Build Command：`pnpm build`
- Install Command：`pnpm install`
- Node.js：20.x
- 数据库：Supabase Postgres
- 图片：Supabase Storage，配置 `NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_STORAGE_BUCKET`，并将 `STORAGE_DRIVER=supabase`

详细步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 验证

```bash
pnpm test:round1
pnpm test:round2
pnpm test:round3
```

`pnpm db:seed` 不会默认写入演示顾客和演示商品；如确实需要演示数据，显式设置 `SEED_DEMO_DATA=true` 后再运行。
