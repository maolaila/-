# 部署手册

## 1. Supabase

1. 创建 Supabase 项目。
2. 在 Vercel 环境变量中配置：

```env
DATABASE_URL=
DIRECT_DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=product-images
STORAGE_DRIVER=supabase
SESSION_SECRET=
PASSWORD_PEPPER=
NEXT_PUBLIC_APP_URL=
```

3. 创建 Storage bucket：`product-images`。
4. 运行迁移：

```bash
pnpm db:migrate
```

5. 创建初始管理员和站点配置：

```bash
SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD=your-strong-password pnpm db:seed
```

生产环境必须使用高强度 `SESSION_SECRET`、`PASSWORD_PEPPER` 和管理员密码。生产环境默认不会创建演示顾客和演示商品；如要导入演示数据，显式增加 `SEED_DEMO_DATA=true`。

## 2. Vercel

- Framework Preset：Next.js
- Install Command：`pnpm install`
- Build Command：`pnpm build`
- Node.js Version：20.x
- Output Directory：默认

推送到 GitHub 后，在 Vercel 连接仓库并配置上述环境变量即可自动部署。

## 3. 上线前检查

```bash
pnpm test:round1
pnpm db:migrate
pnpm db:seed
pnpm test:round2
pnpm test:round3
```

验收覆盖：

- 游客浏览首页、商品列表、商品详情。
- 未登录加入购物车跳转登录。
- 顾客注册、登录、加入购物车、提交订单、查看订单。
- 管理员登录、查看订单、维护付款状态、查看顾客。
- 商品详情 SEO metadata、robots、sitemap。
- 订单创建事务内保存商品快照并扣减库存。
