# 部署手册

目标部署方式：GitHub + Vercel + Supabase Postgres + Supabase Storage。

## 最短流程

1. 在 Supabase 创建项目。
2. 在 Supabase Storage 创建公开 bucket：`product-images`。
3. 复制生产环境变量模板：

```bash
cp .env.production.example .env.production
```

4. 填写 `.env.production`。
5. 本地执行一次初始化：

PowerShell：

```powershell
$env:ENV_FILE=".env.production"; pnpm deploy:init
```

Bash：

```bash
ENV_FILE=.env.production pnpm deploy:init
```

6. 在 Vercel 导入 GitHub 仓库，填写下方“Vercel 环境变量”。
7. 推送代码后，Vercel 自动构建部署。

`pnpm deploy:init` 已包含：生产变量检查、数据库连接检查、Supabase Storage bucket 检查、数据库迁移、初始管理员和站点配置写入。

## Vercel 环境变量

在 Vercel Project Settings -> Environment Variables 中配置：

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
SESSION_SECRET=replace-with-at-least-32-random-characters
DATABASE_URL=postgres://...
DIRECT_DATABASE_URL=postgres://...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=product-images
PASSWORD_PEPPER=replace-with-at-least-16-random-characters
STORAGE_DRIVER=supabase
```

不要在 Vercel 手工设置 `NODE_ENV`。Vercel 会自动使用 production。

`SEED_ADMIN_PASSWORD` 只用于初始化管理员，不需要长期保存在 Vercel 运行环境中。初始化时放在 `.env.production` 即可。

## Supabase 设置

数据库：

- `DATABASE_URL`：应用运行时使用，建议使用 Supabase pooler URL。
- `DIRECT_DATABASE_URL`：迁移脚本使用，建议使用 Supabase direct connection URL。

Storage：

- bucket 名称默认 `product-images`。
- bucket 需要设为 public，否则商品图片上传成功后前台可能无法访问。
- `SUPABASE_SERVICE_ROLE_KEY` 必须使用 service role key，不要使用 anon key。

## 常用命令

生产初始化：

```bash
pnpm deploy:init
```

只检查生产环境变量：

```bash
pnpm deploy:check
```

部署前本地回归：

```bash
pnpm deploy:verify
```

单独迁移：

```bash
pnpm db:migrate
```

单独创建或补齐管理员和站点配置：

```bash
pnpm db:seed
```

如果使用 `.env.production`，命令前加 `ENV_FILE=.env.production`。PowerShell 使用 `$env:ENV_FILE=".env.production";`。

## 初始账号

生产环境必须设置强密码：

```env
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=replace-with-strong-admin-password
```

默认 seed 只创建管理员和站点配置，不会写入演示商品和演示顾客。

如确实要导入演示数据，再显式设置：

```env
SEED_DEMO_DATA=true
```

本地演示才允许：

```env
ALLOW_INSECURE_SEED_DEFAULTS=true
```

生产环境不要设置该变量。

## Vercel 构建配置

仓库已包含 `vercel.json`：

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

`package.json` 已指定 Node.js `20.x` 和 pnpm `9.12.1`。

## 上线前检查清单

- `pnpm deploy:check` 通过。
- `pnpm deploy:init` 已对生产数据库执行成功。
- Supabase bucket `product-images` 存在且 public。
- Vercel 环境变量不含 placeholder。
- `NEXT_PUBLIC_APP_URL` 是正式 `https://` 域名。
- `STORAGE_DRIVER=supabase`。
- `SESSION_SECRET` 至少 32 位。
- `PASSWORD_PEPPER` 至少 16 位。
- `pnpm deploy:verify` 通过。

