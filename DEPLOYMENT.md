# 部署手册

目标部署方式：GitHub + Vercel + PostgreSQL（Supabase 或 Neon）+ Cloudflare R2。

## 最短流程

1. 创建 PostgreSQL 数据库。推荐继续用 Supabase Postgres，也可以用 Neon。
2. 在 Cloudflare R2 创建 bucket：`product-images`。
3. 给 R2 bucket 绑定生产自定义域名，例如 `https://img.your-domain.com`。不要用 `r2.dev` 做生产图片域名。
4. 在 Cloudflare R2 创建 S3 API token，拿到 `Account ID`、`Access Key ID`、`Secret Access Key`。
5. 复制生产环境变量模板：

```bash
cp .env.production.example .env.production
```

6. 填写 `.env.production`。
7. 本地执行一次初始化：

PowerShell：

```powershell
$env:ENV_FILE=".env.production"; pnpm deploy:init
```

Bash：

```bash
ENV_FILE=.env.production pnpm deploy:init
```

8. 在 Vercel 导入 GitHub 仓库，填写下方“Vercel 环境变量”。
9. 推送代码后，Vercel 自动构建部署。

`pnpm deploy:init` 已包含：生产变量检查、数据库连接检查、R2 bucket 连接检查、数据库迁移、初始管理员和站点配置写入。

## Vercel 环境变量

在 Vercel Project Settings -> Environment Variables 中配置：

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
SESSION_SECRET=replace-with-at-least-32-random-characters
DATABASE_URL=postgres://...
DIRECT_DATABASE_URL=postgres://...
PASSWORD_PEPPER=replace-with-at-least-16-random-characters
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=replace-with-cloudflare-account-id
R2_ACCESS_KEY_ID=replace-with-r2-access-key-id
R2_SECRET_ACCESS_KEY=replace-with-r2-secret-access-key
R2_BUCKET=product-images
R2_PUBLIC_BASE_URL=https://img.your-production-domain.com
```

不要在 Vercel 手工设置 `NODE_ENV`。Vercel 会自动使用 production。

`SEED_ADMIN_PASSWORD` 只用于初始化管理员，不需要长期保存在 Vercel 运行环境中。初始化时放在 `.env.production` 即可。

## 数据库设置

- `DATABASE_URL`：应用运行时使用。如果用 Supabase Postgres，建议使用 Supabase pooler URL。
- `DIRECT_DATABASE_URL`：迁移脚本使用。如果用 Supabase Postgres，建议使用 direct connection URL。
- Vercel 运行时只需要能连接 PostgreSQL，不要求数据库和图片存储都在同一家服务商。

## Cloudflare R2 设置

- `STORAGE_DRIVER=r2`。
- `R2_BUCKET` 默认 `product-images`。
- `R2_PUBLIC_BASE_URL` 必须是绑定到 R2 bucket 的生产自定义域名，例如 `https://img.your-domain.com`。
- `r2.dev` 只适合开发测试，生产不要使用。
- `R2_ENDPOINT` 通常不需要设置，系统会用 `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`。
- 商品图上传后不会保存原图，会在服务端转成两份唯一命名的 WebP：
  - `products/{year}/{month}/{uuid}.webp`：最大宽度 1200px，quality 80，用于商品详情图。
  - `products/{year}/{month}/{uuid}-thumb.webp`：最大宽度 400px，quality 75，用于商品缩略图。
- 每个商品只有一个缩略图 URL，保存在商品表；详情图 URL 保存在 `product_images`，数量不做业务上限限制。
- 这两份文件由应用通过 `sharp` 生成，不使用 Cloudflare 图片转换服务。
- 当前 Cloudflare 官方文档显示：R2 Standard 免费额度包含 10GB-month/月、Class A 100 万次/月、Class B 1000 万次/月，互联网出站流量免费。价格和额度可能调整，正式上线前以 Cloudflare 官方 pricing/docs 为准。
- 2 万张是上限时，按 `详情图 + 缩略图` 合计平均大小估算容量：平均 300KB 约 6GB，平均 500KB 约 10GB，平均 1MB 约 20GB。
- 参考文档：<https://developers.cloudflare.com/r2/pricing/>、<https://developers.cloudflare.com/r2/data-access/public-buckets/>。

## Supabase Storage 备选

如果后续仍想用 Supabase Storage，把 `.env.production` 改成：

```env
STORAGE_DRIVER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=product-images
```

并在 Supabase Storage 创建 public bucket：`product-images`。

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
- R2 bucket `product-images` 存在，并已绑定生产自定义域名。
- Vercel 环境变量不含 placeholder。
- `NEXT_PUBLIC_APP_URL` 是正式 `https://` 域名。
- `STORAGE_DRIVER=r2`。
- `R2_PUBLIC_BASE_URL` 是正式 `https://` 图片域名，不是 `r2.dev`。
- `SESSION_SECRET` 至少 32 位。
- `PASSWORD_PEPPER` 至少 16 位。
- `pnpm deploy:verify` 通过。
