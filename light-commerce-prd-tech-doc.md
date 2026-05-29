# Light Commerce Platform PRD 与技术设计文档

轻量电商系统 · 产品需求与前后台前后端技术方案

版本：v0.2  
更新日期：2026-05-29

# 文档说明

本文档面向一个小规模真实销售场景的轻量电商系统，覆盖产品需求、前台功能、后台功能、前台前端、前台后端、后台前端、后台后端、数据库、鉴权、安全、部署与验收标准。

系统目标是实现完整的商品展示、顾客注册登录、购物车、订单提交、订单状态管理、后台商品管理和后台订单处理流程。系统不接入在线支付，付款状态由管理员在后台手动维护。

# 一、PRD：产品需求文档

## 1. 产品定位

**产品名称：Light Commerce Platform**

系统定位：面向小规模真实销售场景的轻量级电商系统。系统支持顾客浏览商品、注册登录、加入购物车、提交订单、查看订单状态；管理员可通过后台维护商品、分类、库存、订单状态、付款状态、物流信息和顾客信息。

系统特点：

- 轻量：不引入秒杀、优惠券、积分、会员等级等复杂营销模块。
- 完整：覆盖商品、顾客、购物车、订单、后台管理的核心业务闭环。
- 可维护：前后台共用一套 Next.js 应用，减少部署和维护复杂度。
- SEO 友好：前台商城使用 Next.js App Router，商品详情页可被搜索引擎抓取。
- 人工处理：不接入在线支付，付款和发货状态由管理员手动维护。

## 2. 目标用户与角色

| 角色 | 说明 | 核心行为 |
|---|---|---|
| 游客 | 未登录访问者 | 浏览首页、商品列表、商品详情 |
| 顾客 | 注册并登录的用户 | 加入购物车、提交订单、查看订单 |
| 管理员 | 后台运营人员 | 管理商品、分类、订单、顾客和站点配置 |

## 3. 业务规模假设

| 项目 | 初期规模 | 后期规模 |
|---|---:|---:|
| 顾客数量 | 10-30 人 | 50-100 人 |
| 商品数量 | 20-100 个 | 100-500 个 |
| 日订单量 | 0-10 单 | 5-30 单 |
| 管理员数量 | 1 人 | 1-3 人 |

该规模不需要微服务、消息队列、独立缓存集群或复杂营销系统。数据库、文件存储和应用服务均可使用托管平台完成。

## 4. 核心业务原则

1. 游客可直接浏览商品，不强制登录。
2. 只有点击“加入购物车”时才提示登录。
3. 注册账号不限制邮箱、手机号或字符格式。
4. 账号不可重复，账号和密码都设置最大长度。
5. 密码只保存哈希，不保存明文。
6. 不接入在线支付，付款状态由管理员维护。
7. 不做秒杀、优惠券、拼团、积分、会员等级。
8. 商品详情页要具备 SEO 信息。
9. 后台要简洁，适合少量管理员日常维护。
10. 历史订单必须保存商品快照，不能被后续商品改价影响。

## 5. 功能总览

### 5.1 前台商城功能

| 模块 | 功能 |
|---|---|
| 首页 | 店铺信息、公告、推荐商品、最新商品、分类入口 |
| 商品列表 | 商品浏览、分类筛选、关键词搜索、排序、分页 |
| 商品详情 | 商品图、价格、库存、规格、说明、加入购物车 |
| 注册登录 | 账号密码注册、登录、退出、当前用户信息 |
| 购物车 | 加入商品、修改数量、删除商品、结算入口 |
| 结算 | 填写收货信息、提交订单 |
| 我的订单 | 查看订单列表、订单详情、订单状态 |
| 个人信息 | 修改密码、维护基础收货信息 |

### 5.2 后台管理功能

| 模块 | 功能 |
|---|---|
| 后台登录 | 管理员登录、权限校验 |
| 数据概览 | 商品数、订单数、待处理订单、最近订单 |
| 商品管理 | 新增、编辑、上下架、库存、图片、规格 |
| 分类管理 | 新增、编辑、隐藏、排序、删除 |
| 订单管理 | 查看订单、修改订单状态、付款状态、物流信息 |
| 顾客管理 | 查看顾客、禁用顾客、重置密码、查看订单历史 |
| 站点配置 | 店铺名称、公告、订单说明、售后说明 |
| 文件上传 | 商品图片上传、图片记录管理 |

# 二、前台商城 PRD

## 1. 首页

路径：`/`

首页用于展示商城基础信息、分类入口和重点商品。

| 区域 | 内容 |
|---|---|
| 顶部导航 | Logo、分类导航、搜索框、购物车、登录状态 |
| 公告栏 | 店铺公告、订单说明、发货说明 |
| 推荐商品 | 后台标记或按配置展示的商品 |
| 最新商品 | 最近上架商品 |
| 分类入口 | 启用状态的商品分类 |
| 页脚 | 联系方式、售后说明、隐私说明 |

业务规则：

- 未登录用户可以访问首页。
- 下架商品不展示。
- 售罄商品可以展示，但按钮显示“已售罄”。
- 首页商品模块建议最多展示 8-12 个商品。

## 2. 商品列表页

路径：`/products`

顾客可以浏览所有上架商品。

| 功能 | 说明 |
|---|---|
| 分类筛选 | 按分类查看商品 |
| 关键词搜索 | 按商品名称、简介搜索 |
| 排序 | 最新、价格升序、价格降序 |
| 库存筛选 | 全部、有货、售罄 |
| 分页 | 每页默认 20 个商品 |

商品卡片展示字段：

| 字段 | 说明 |
|---|---|
| 商品主图 | 必填 |
| 商品名称 | 必填 |
| 售价 | 必填 |
| 库存状态 | 有货、少量、售罄 |
| 标签 | 新品、现货、预订等 |
| 分类 | 可选展示 |

列表规则：

- 仅展示 `status = active` 的商品。
- 默认按创建时间倒序展示。
- 搜索词最大 50 字符。
- 搜索为空时展示空状态页面。

## 3. 商品详情页

路径：`/products/[slug]`

商品详情页是主要 SEO 页面，需要服务端渲染商品核心内容。

| 模块 | 内容 |
|---|---|
| 商品基础信息 | 商品名称、价格、库存、标签 |
| 商品图片 | 主图、多图轮播 |
| 商品规格 | 颜色、尺寸、容量等 |
| 数量选择 | 默认 1，最大不超过库存 |
| 加入购物车 | 登录后可加入 |
| 商品详情 | 富文本说明 |
| 购买说明 | 发货周期、售后说明、注意事项 |
| SEO 信息 | title、description、OG image |

加入购物车规则：

| 状态 | 处理 |
|---|---|
| 未登录 | 弹出登录提示或跳转登录页 |
| 已登录且商品正常 | 加入购物车 |
| 库存不足 | 提示库存不足 |
| 商品下架 | 提示商品已下架 |
| 规格未选 | 提示选择规格 |
| 已在购物车 | 数量累加 |

规格规则：

- MVP 支持单规格和多规格商品。
- 底层统一使用 `product_variants` 表。
- 单规格商品也创建一个默认规格，避免后续重构。

## 4. 注册页

路径：`/register`

| 字段 | 是否必填 | 限制 |
|---|---:|---|
| 账号 | 是 | 最大 64 字符 |
| 密码 | 是 | 最大 128 字符 |
| 确认密码 | 是 | 必须和密码一致 |

账号规则：

- 不限制邮箱格式。
- 不限制手机号格式。
- 不限制字符类型。
- 前后空格自动 trim。
- trim 后不能为空。
- 大小写不敏感唯一。
- `Alice` 和 `alice` 视为同一个账号。

密码规则：

- 不限制复杂度。
- 不强制数字、大小写或特殊字符。
- 最大 128 字符。
- 不能保存明文密码。
- 只能保存密码哈希。

注册成功后：

- 自动创建顾客账号。
- 自动登录。
- 跳转到注册前目标页面；没有目标页面则跳转首页。

## 5. 登录页

路径：`/login`

| 字段 | 是否必填 | 限制 |
|---|---:|---|
| 账号 | 是 | 最大 64 字符 |
| 密码 | 是 | 最大 128 字符 |

登录规则：

- 账号 trim 后查询。
- 登录失败统一提示：“账号或密码错误”。
- 不暴露账号是否存在。
- 禁用用户不能登录。
- 登录成功后写入 HttpOnly Session Cookie。
- 登录成功后跳回来源页面。

## 6. 购物车页

路径：`/cart`

仅登录顾客可访问。未登录访问时跳转到 `/login?redirect=/cart`。

| 功能 | 说明 |
|---|---|
| 查看购物车 | 展示所有购物车商品 |
| 修改数量 | 数量最小 1，最大不超过库存 |
| 删除商品 | 从购物车移除 |
| 清空购物车 | 可选功能 |
| 去结算 | 跳转结算页 |

购物车字段：

| 字段 | 说明 |
|---|---|
| 商品图片 | 当前商品主图 |
| 商品名称 | 当前商品名称 |
| 规格 | variant 规格 |
| 单价 | 当前销售价 |
| 数量 | 购物车数量 |
| 小计 | 单价 × 数量 |
| 状态 | 正常、库存不足、已下架 |

业务规则：

- 购物车展示当前售价。
- 提交订单时再次校验商品状态、规格状态、库存和价格。
- 订单创建成功后保存价格快照。
- 已下架商品在购物车内提示不可结算。
- 库存不足商品提示顾客调整数量。

## 7. 结算页

路径：`/checkout`

仅登录顾客可访问。

| 字段 | 是否必填 | 最大长度 |
|---|---:|---:|
| 收货人 | 是 | 50 |
| 联系方式 | 是 | 100 |
| 收货地址 | 是 | 300 |
| 顾客备注 | 否 | 500 |

提交订单规则：

1. 顾客必须登录。
2. 购物车不能为空。
3. 至少选择 1 个商品。
4. 商品必须仍然上架。
5. 商品规格必须有效。
6. 库存必须足够。
7. 服务端在事务中创建订单、订单明细、扣减库存、清理购物车。
8. 订单创建成功后跳转订单详情页。

不包含内容：

- 不接入在线支付。
- 不生成支付二维码。
- 不自动确认付款。
- 不自动发货。
- 不自动查询物流轨迹。

## 8. 我的订单页

路径：`/orders`

| 功能 | 说明 |
|---|---|
| 查看订单列表 | 顾客只能查看自己的订单 |
| 按状态筛选 | 可选 |
| 查看订单详情 | 点击进入订单详情页 |

订单列表字段：

| 字段 | 说明 |
|---|---|
| 订单号 | 顾客可见 |
| 下单时间 | 年月日时分 |
| 商品数量 | 商品总数量 |
| 订单金额 | 商品金额合计 |
| 订单状态 | 当前订单状态 |
| 付款状态 | 后台手动维护 |
| 操作 | 查看详情 |

## 9. 订单详情页

路径：`/orders/[orderNo]`

| 模块 | 字段 |
|---|---|
| 订单基础信息 | 订单号、下单时间、订单状态、付款状态 |
| 商品明细 | 商品图、名称、规格、单价、数量、小计 |
| 收货信息 | 收货人、联系方式、地址 |
| 物流信息 | 物流公司、物流单号 |
| 备注信息 | 顾客备注、管理员公开备注 |
| 状态记录 | 状态变更时间线 |

顾客操作：

| 操作 | 条件 |
|---|---|
| 查看订单 | 始终支持 |
| 申请取消 | 仅待确认状态可用，可选实现 |

# 三、后台管理 PRD

## 1. 后台登录

路径：`/admin/login`

规则：

- 管理员和顾客共用用户表。
- 通过 `role` 区分权限。
- 只有 `role = admin` 的用户可以进入后台。
- 顾客访问后台页面时返回 403 或跳转前台首页。
- 后台登录成功后跳转 `/admin`。

## 2. 后台首页

路径：`/admin`

| 指标 | 说明 |
|---|---|
| 今日订单数 | 当天创建的订单数量 |
| 待确认订单 | `pending_confirm` 状态订单 |
| 待处理异常 | `exception` 状态订单 |
| 上架商品数 | `active` 状态商品 |
| 售罄规格数 | 库存为 0 的规格数量 |
| 顾客总数 | role 为 customer 的用户数量 |

最近订单展示最近 10 条订单，包括订单号、顾客账号、金额、状态和下单时间。

## 3. 商品管理

路径：`/admin/products`

| 功能 | 说明 |
|---|---|
| 商品列表 | 分页展示商品 |
| 搜索商品 | 按名称、SKU 搜索 |
| 分类筛选 | 按分类筛选 |
| 状态筛选 | 草稿、上架、下架 |
| 新增商品 | 创建商品 |
| 编辑商品 | 修改商品信息 |
| 上下架 | 控制前台是否展示 |
| 删除商品 | 无订单商品可删除，有订单商品只能下架 |
| 图片管理 | 上传、删除、排序 |
| 规格管理 | 添加、编辑、删除规格 |

商品状态：

| 状态 | 说明 |
|---|---|
| `draft` | 草稿，不展示 |
| `active` | 上架，前台展示 |
| `inactive` | 下架，不展示 |

商品字段：

| 字段 | 是否必填 | 说明 |
|---|---:|---|
| 商品名称 | 是 | 最大 120 字符 |
| Slug | 是 | URL 唯一标识 |
| 分类 | 是 | 选择分类 |
| 主图 | 是 | 商品主图 |
| 轮播图 | 否 | 最多 8 张 |
| 商品简介 | 否 | 最大 300 字符 |
| 商品详情 | 否 | 最大 5000 字符 |
| 购买说明 | 否 | 最大 2000 字符 |
| 标签 | 否 | 新品、现货、预订等 |
| SEO 标题 | 否 | 最大 70 字符 |
| SEO 描述 | 否 | 最大 160 字符 |
| 状态 | 是 | 草稿、上架、下架 |

规格字段：

| 字段 | 是否必填 | 说明 |
|---|---:|---|
| SKU | 否 | 商品规格编码 |
| 规格值 | 是 | JSON 格式，如颜色、尺码 |
| 售价 | 是 | 顾客看到的价格 |
| 成本价 | 否 | 后台可见 |
| 库存 | 是 | 当前库存 |
| 状态 | 是 | 启用、禁用 |

## 4. 分类管理

路径：`/admin/categories`

| 功能 | 说明 |
|---|---|
| 新增分类 | 创建商品分类 |
| 编辑分类 | 修改名称、slug、排序 |
| 隐藏分类 | 前台不展示 |
| 删除分类 | 分类下无商品时可删除 |

分类字段：

| 字段 | 是否必填 | 说明 |
|---|---:|---|
| 分类名称 | 是 | 最大 50 字符 |
| Slug | 是 | 唯一 |
| 排序值 | 否 | 数字越小越靠前 |
| 是否显示 | 是 | 前台是否展示 |

## 5. 订单管理

路径：`/admin/orders`

| 功能 | 说明 |
|---|---|
| 订单列表 | 查看所有订单 |
| 订单搜索 | 订单号、顾客账号、联系方式 |
| 状态筛选 | 按订单状态筛选 |
| 付款筛选 | 按付款状态筛选 |
| 日期筛选 | 按下单日期筛选 |
| 查看详情 | 查看完整订单 |
| 修改状态 | 管理员手动流转订单 |
| 修改付款状态 | 人工维护付款情况 |
| 填写物流 | 物流公司和单号 |
| 添加备注 | 内部备注和顾客可见备注 |

订单列表字段：

| 字段 | 说明 |
|---|---|
| 订单号 | 唯一 |
| 顾客账号 | 下单用户 |
| 收货人 | 订单收货人 |
| 联系方式 | 顾客填写 |
| 金额 | 订单总金额 |
| 订单状态 | 当前状态 |
| 付款状态 | 当前付款状态 |
| 下单时间 | 创建时间 |
| 操作 | 查看、编辑 |

## 6. 订单状态

| 状态值 | 中文名 | 说明 |
|---|---|---|
| `pending_confirm` | 待确认 | 顾客已提交订单，管理员未确认 |
| `confirmed` | 已确认 | 管理员确认订单有效 |
| `purchasing` | 处理中 | 商品准备、采购或备货中 |
| `ready_to_ship` | 待发货 | 商品已准备好 |
| `shipped` | 已发货 | 已填写物流信息 |
| `completed` | 已完成 | 订单结束 |
| `cancelled` | 已取消 | 订单取消 |
| `exception` | 异常 | 缺货、信息错误等异常情况 |

常规状态流：

- 待确认 -> 已确认 -> 处理中 -> 待发货 -> 已发货 -> 已完成

特殊状态流：

- 待确认 -> 已取消
- 已确认、处理中、待发货 -> 异常
- 异常 -> 已确认、处理中或已取消

## 7. 付款状态

系统不接入在线支付，但后台需要记录付款状态。

| 状态值 | 中文名 | 说明 |
|---|---|---|
| `unpaid` | 未付款 | 默认状态 |
| `deposit_paid` | 已付定金 | 管理员手动标记 |
| `paid` | 已付全款 | 管理员手动标记 |
| `need_extra_payment` | 需补款 | 价格变化或补运费 |
| `refunded` | 已退款 | 管理员手动标记 |

## 8. 顾客管理

路径：`/admin/users`

| 功能 | 说明 |
|---|---|
| 查看顾客列表 | 查看注册顾客 |
| 搜索顾客 | 按账号搜索 |
| 查看订单历史 | 查看该顾客所有订单 |
| 禁用顾客 | 禁止登录 |
| 启用顾客 | 恢复登录 |
| 重置密码 | 管理员设置新密码 |

用户状态：

| 状态 | 说明 |
|---|---|
| `active` | 正常 |
| `disabled` | 禁用 |

密码重置规则：

- 管理员不能查看原密码。
- 管理员只能设置新密码。
- 新密码仍只限制最大长度。
- 重置密码后该顾客旧 Session 全部失效。

## 9. 站点配置

路径：`/admin/settings`

| 配置 | 说明 |
|---|---|
| 店铺名称 | 前台展示 |
| 首页公告 | 首页公告栏 |
| 联系方式 | 页脚或订单说明展示 |
| 默认货币 | 如 CNY、JPY、USD |
| 订单说明 | 结算页展示 |
| 售后说明 | 商品详情页或页脚展示 |
| 是否允许取消待确认订单 | 控制顾客端操作 |

# 四、技术设计总览

## 1. 技术栈

| 层级 | 技术 |
|---|---|
| 前端框架 | Next.js App Router |
| 开发语言 | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 表单 | React Hook Form + Zod |
| 后端接口 | Next.js Route Handlers |
| 表单变更 | Server Actions |
| 运行环境 | Vercel Node.js Runtime |
| 数据库 | Supabase Postgres |
| ORM | Drizzle ORM |
| 文件存储 | Supabase Storage |
| 鉴权 | 自建用户名密码 + Session Cookie |
| 部署 | Vercel Hobby |
| DNS | Cloudflare DNS |
| 域名 | 自购域名 |
| 包管理 | pnpm |
| 代码托管 | GitHub |

## 2. Node.js 与 Bun 选择

本项目生产环境选择 Node.js Runtime，不选择 Bun 作为生产后端运行时。

选择原因：

1. Next.js 与 Vercel 对 Node.js Runtime 的支持更成熟。
2. Supabase、Drizzle、图片上传和加密库在 Node.js 环境兼容性更稳定。
3. 项目体量小，不需要为了启动速度引入额外运行时变量。
4. 前台、后台和 API 都部署在同一个 Next.js 项目中，Node.js 更省心。

## 3. 总体架构

架构关系：

```txt
顾客浏览器
  -> 自购域名
  -> Cloudflare DNS
  -> Vercel Next.js 应用
       -> 前台页面
       -> 后台页面
       -> Route Handlers API
       -> Server Actions
  -> Supabase Postgres
  -> Supabase Storage
```

本项目不拆成多个仓库。前台、后台和后端 API 放在一个 Next.js 应用中，降低部署和维护成本。

## 4. 推荐目录结构

```txt
light-commerce-platform
├── app
│   ├── (store)
│   ├── (auth)
│   ├── admin
│   └── api
├── components
│   ├── store
│   ├── admin
│   └── ui
├── db
│   ├── schema.ts
│   ├── migrations
│   └── client.ts
├── lib
│   ├── auth
│   ├── validators
│   ├── permissions
│   ├── storage
│   ├── order
│   └── utils
├── server
│   ├── services
│   └── repositories
├── public
├── middleware.ts
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

# 五、前台前端技术文档

## 1. 前台路由

| 路由 | 页面 |
|---|---|
| `/` | 首页 |
| `/products` | 商品列表 |
| `/products/[slug]` | 商品详情 |
| `/login` | 登录 |
| `/register` | 注册 |
| `/cart` | 购物车 |
| `/checkout` | 结算 |
| `/orders` | 我的订单 |
| `/orders/[orderNo]` | 订单详情 |

## 2. 页面渲染策略

| 页面 | 渲染方式 | 原因 |
|---|---|---|
| 首页 | Server Component | 首屏快，利于 SEO |
| 商品列表 | Server Component + URL Query | 利于 SEO，筛选条件可分享 |
| 商品详情 | Server Component | 商品内容进入 HTML |
| 登录注册 | Client Component 表单 | 需要交互和校验 |
| 购物车 | Server Component + Client 交互 | 读取服务端数据，局部交互 |
| 结算页 | Client Form + Server Action | 表单提交 |
| 我的订单 | Server Component | 读取当前顾客订单 |
| 订单详情 | Server Component | 权限校验后展示 |

## 3. 前台组件划分

```txt
components/store
├── Header.tsx
├── Footer.tsx
├── ProductCard.tsx
├── ProductGrid.tsx
├── ProductGallery.tsx
├── VariantSelector.tsx
├── QuantityInput.tsx
├── AddToCartButton.tsx
├── CartItemRow.tsx
├── CheckoutForm.tsx
├── OrderStatusBadge.tsx
└── EmptyState.tsx
```

## 4. 加入购物车交互

流程：

1. 顾客点击加入购物车。
2. 前端检查当前是否登录。
3. 未登录则跳转 `/login?redirect=当前商品页`。
4. 已登录则校验规格和数量。
5. 调用 `/api/cart/items`。
6. 成功后更新购物车数量并提示加入成功。

前端行为：

- 未登录状态不直接调用购物车 API。
- 商品无库存时按钮禁用。
- 规格未选时按钮禁用或提示选择规格。
- 提交中按钮显示 loading。
- 成功后刷新 Header 购物车数量。

## 5. SEO 前端策略

- 商品详情页使用服务端渲染获取商品数据。
- 每个商品详情页生成独立 title、description 和 OG image。
- 商品列表页使用 URL Query 表达筛选条件。
- 登录、注册、购物车、订单、后台页面不允许搜索引擎索引。

# 六、前台后端技术文档

## 1. 前台 API 模块

| 模块 | 说明 |
|---|---|
| Auth API | 注册、登录、退出、当前用户、修改密码 |
| Product API | 商品列表、商品详情 |
| Category API | 前台分类列表 |
| Cart API | 购物车增删改查 |
| Order API | 提交订单、我的订单、订单详情 |
| Address API | 顾客收货地址，可选 |

## 2. Auth API

### 注册

`POST /api/auth/register`

请求体：

```json
{
  "username": "customer01",
  "password": "123456"
}
```

处理规则：

- 使用 Zod 校验账号和密码长度。
- 对账号 trim 后生成 `normalized_username`。
- 检查账号是否重复。
- 对密码进行哈希。
- 创建用户和 session。
- 写入 HttpOnly Cookie。

### 登录

`POST /api/auth/login`

请求体：

```json
{
  "username": "customer01",
  "password": "123456"
}
```

处理规则：

- 登录失败统一返回“账号或密码错误”。
- 禁用账号不可登录。
- 登录成功后写入 session cookie。
- 更新 `last_login_at`。

### 退出

`POST /api/auth/logout`

处理规则：

- 删除当前 session。
- 清除浏览器 Cookie。

## 3. Product API

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/products` | 公开 | 商品列表 |
| GET | `/api/products/[slug]` | 公开 | 商品详情 |

商品列表 Query：

| 参数 | 说明 |
|---|---|
| keyword | 搜索词 |
| category | 分类 slug |
| stock | 库存筛选 |
| sort | 排序 |
| page | 页码 |
| pageSize | 每页数量 |

## 4. Cart API

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/cart` | 登录顾客 | 获取购物车 |
| POST | `/api/cart/items` | 登录顾客 | 加入购物车 |
| PATCH | `/api/cart/items/[id]` | 登录顾客 | 修改数量 |
| DELETE | `/api/cart/items/[id]` | 登录顾客 | 删除购物车项 |
| DELETE | `/api/cart` | 登录顾客 | 清空购物车 |

加入购物车请求体：

```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 1
}
```

服务端校验：

- 当前用户已登录。
- 商品存在且已上架。
- 规格存在且启用。
- 库存足够。
- 数量大于 0 且不超过 99。

## 5. Order API

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | `/api/orders` | 登录顾客 | 创建订单 |
| GET | `/api/orders` | 登录顾客 | 我的订单 |
| GET | `/api/orders/[orderNo]` | 登录顾客 | 订单详情 |

创建订单请求体：

```json
{
  "cartItemIds": ["uuid"],
  "receiverName": "张三",
  "receiverContact": "13800000000",
  "receiverAddress": "详细地址",
  "userNote": "请尽快发货"
}
```

创建订单必须在数据库事务中完成：

1. 读取购物车项。
2. 校验商品和规格状态。
3. 校验库存。
4. 生成订单号。
5. 创建订单主表。
6. 创建订单明细快照。
7. 扣减库存。
8. 删除已下单购物车项。
9. 写入订单状态日志。

# 七、后台前端技术文档

## 1. 后台路由

| 路由 | 页面 |
|---|---|
| `/admin/login` | 后台登录 |
| `/admin` | 数据概览 |
| `/admin/products` | 商品列表 |
| `/admin/products/new` | 新增商品 |
| `/admin/products/[id]` | 编辑商品 |
| `/admin/categories` | 分类管理 |
| `/admin/orders` | 订单列表 |
| `/admin/orders/[id]` | 订单详情 |
| `/admin/users` | 顾客管理 |
| `/admin/settings` | 站点配置 |

## 2. 后台布局

```txt
AdminLayout
├── Sidebar
├── Topbar
├── Breadcrumb
└── PageContent
```

后台布局要求：

- 左侧固定导航。
- 顶部展示当前管理员和退出入口。
- 页面内显示面包屑。
- 表格页面支持搜索、筛选、分页。
- 表单页面支持保存、取消和错误提示。

## 3. 后台组件划分

```txt
components/admin
├── AdminSidebar.tsx
├── AdminTopbar.tsx
├── DashboardCards.tsx
├── ProductTable.tsx
├── ProductForm.tsx
├── ProductImageUploader.tsx
├── VariantEditor.tsx
├── CategoryTable.tsx
├── CategoryForm.tsx
├── OrderTable.tsx
├── OrderDetailPanel.tsx
├── OrderStatusSelect.tsx
├── PaymentStatusSelect.tsx
├── UserTable.tsx
└── SettingsForm.tsx
```

## 4. 后台权限策略

前端只做体验层保护，真正权限必须在服务端校验。

| 层级 | 处理 |
|---|---|
| middleware | 未登录访问 `/admin/*` 时跳转 |
| 页面 Server Component | 读取 session，校验 role |
| API Route Handler | 每个后台接口校验 admin |
| Server Action | 每个后台 action 校验 admin |

## 5. 后台表格交互

通用表格能力：

- 分页。
- 关键词搜索。
- 状态筛选。
- 日期筛选。
- 空状态。
- loading 状态。
- 错误重试。
- 危险操作二次确认。

# 八、后台后端技术文档

## 1. 后台 API 模块

| 模块 | 说明 |
|---|---|
| Admin Auth | 管理员登录、权限校验 |
| Admin Dashboard | 首页统计 |
| Admin Products | 商品 CRUD、上下架、规格管理 |
| Admin Categories | 分类 CRUD、排序、隐藏 |
| Admin Orders | 订单查询、状态修改、付款修改、物流修改 |
| Admin Users | 顾客查询、禁用、启用、重置密码 |
| Admin Settings | 站点配置 |
| Admin Uploads | 商品图片上传 |

## 2. Admin Product API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/products` | 后台商品列表 |
| POST | `/api/admin/products` | 新增商品 |
| GET | `/api/admin/products/[id]` | 商品详情 |
| PUT | `/api/admin/products/[id]` | 编辑商品 |
| PATCH | `/api/admin/products/[id]/status` | 修改上下架状态 |
| DELETE | `/api/admin/products/[id]` | 删除或软删除商品 |

删除规则：

- 商品未产生订单时可以物理删除。
- 商品已产生订单时只能下架。
- 删除前必须二次确认。

## 3. Admin Category API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/categories` | 分类列表 |
| POST | `/api/admin/categories` | 新增分类 |
| PUT | `/api/admin/categories/[id]` | 编辑分类 |
| DELETE | `/api/admin/categories/[id]` | 删除分类 |

删除规则：

- 分类下存在商品时不允许删除。
- 可使用隐藏分类替代删除。

## 4. Admin Order API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/orders` | 订单列表 |
| GET | `/api/admin/orders/[id]` | 订单详情 |
| PATCH | `/api/admin/orders/[id]/status` | 修改订单状态 |
| PATCH | `/api/admin/orders/[id]/payment-status` | 修改付款状态 |
| PATCH | `/api/admin/orders/[id]/shipping` | 修改物流信息 |
| PATCH | `/api/admin/orders/[id]/notes` | 修改备注 |

修改订单状态请求体：

```json
{
  "status": "confirmed",
  "note": "订单已确认"
}
```

处理规则：

- 校验管理员权限。
- 校验订单存在。
- 校验状态流转是否合法。
- 更新订单状态。
- 写入订单状态日志。

## 5. Admin Upload API

`POST /api/admin/uploads/product-image`

上传限制：

| 项目 | 限制 |
|---|---|
| 文件类型 | jpg、jpeg、png、webp |
| 单文件大小 | 最大 5MB |
| 权限 | 仅 admin |
| 存储位置 | Supabase Storage |

安全规则：

- 不允许 SVG。
- 不允许 HTML 文件。
- 不信任前端 MIME，服务端重复校验。
- 上传路径由服务端生成。
- 不使用用户原始文件名作为最终路径。

# 九、数据库设计

## 1. ERD 概览

```txt
users
  ├── sessions
  ├── cart_items
  ├── orders
  └── user_addresses

categories
  └── products
        ├── product_images
        └── product_variants
              ├── cart_items
              └── order_items

orders
  ├── order_items
  └── order_status_logs
```

## 2. users

用途：存储顾客和管理员账号。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| username | text | 用户输入账号 |
| normalized_username | text | 标准化账号，唯一 |
| password_hash | text | 密码哈希 |
| role | text | customer 或 admin |
| status | text | active 或 disabled |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |
| last_login_at | timestamptz | 最近登录时间 |

关键约束：

- `normalized_username` 唯一。
- `role` 只允许 customer、admin。
- `status` 只允许 active、disabled。
- `username` 最大 64 字符。

## 3. sessions

用途：存储登录会话。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| token_hash | text | Session token 哈希 |
| expires_at | timestamptz | 过期时间 |
| created_at | timestamptz | 创建时间 |
| last_used_at | timestamptz | 最近使用时间 |

关键规则：

- Cookie 中保存原始 token。
- 数据库只保存 token hash。
- 用户退出时删除当前 session。
- 修改密码或禁用用户时删除该用户所有 session。

## 4. categories

用途：商品分类。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| name | text | 分类名称 |
| slug | text | URL 唯一标识 |
| sort_order | int | 排序值 |
| is_visible | boolean | 是否前台展示 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

## 5. products

用途：商品主表。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| category_id | uuid | 分类 ID |
| name | text | 商品名称 |
| slug | text | URL 唯一标识 |
| sku | text | 商品编码 |
| summary | text | 简介 |
| description | text | 商品详情 |
| purchase_note | text | 购买说明 |
| status | text | draft、active、inactive |
| tags | text[] | 标签 |
| seo_title | text | SEO 标题 |
| seo_description | text | SEO 描述 |
| main_image_url | text | 主图 URL |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

## 6. product_images

用途：商品图片列表。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| product_id | uuid | 商品 ID |
| url | text | 图片 URL |
| storage_path | text | Storage 路径 |
| sort_order | int | 排序 |
| created_at | timestamptz | 创建时间 |

## 7. product_variants

用途：商品规格、价格和库存。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| product_id | uuid | 商品 ID |
| sku | text | 规格 SKU |
| option_values | jsonb | 规格值 |
| price | numeric | 售价 |
| cost_price | numeric | 成本价 |
| stock | int | 库存 |
| status | text | active 或 inactive |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

关键约束：

- stock 大于等于 0。
- price 大于等于 0。
- status 只允许 active、inactive。

## 8. cart_items

用途：购物车。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 顾客 ID |
| product_id | uuid | 商品 ID |
| variant_id | uuid | 规格 ID |
| quantity | int | 数量 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

关键约束：

- `unique(user_id, variant_id)`。
- quantity 必须大于 0 且小于等于 99。

## 9. orders

用途：订单主表。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| order_no | text | 订单号，唯一 |
| user_id | uuid | 顾客 ID |
| status | text | 订单状态 |
| payment_status | text | 付款状态 |
| total_amount | numeric | 订单金额 |
| receiver_name | text | 收货人 |
| receiver_contact | text | 联系方式 |
| receiver_address | text | 收货地址 |
| user_note | text | 顾客备注 |
| admin_note | text | 管理员内部备注 |
| public_note | text | 顾客可见备注 |
| shipping_company | text | 物流公司 |
| shipping_no | text | 物流单号 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |
| completed_at | timestamptz | 完成时间 |
| cancelled_at | timestamptz | 取消时间 |

## 10. order_items

用途：订单商品明细快照。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| order_id | uuid | 订单 ID |
| product_id | uuid | 商品 ID，可为空 |
| variant_id | uuid | 规格 ID，可为空 |
| product_name | text | 下单时商品名称 |
| product_slug | text | 下单时商品 slug |
| product_image_url | text | 下单时商品图 |
| variant_snapshot | jsonb | 下单时规格快照 |
| unit_price | numeric | 下单时单价 |
| quantity | int | 数量 |
| subtotal | numeric | 小计 |
| created_at | timestamptz | 创建时间 |

## 11. order_status_logs

用途：订单状态变更日志。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| order_id | uuid | 订单 ID |
| from_status | text | 原状态 |
| to_status | text | 新状态 |
| operator_id | uuid | 操作人 |
| note | text | 备注 |
| created_at | timestamptz | 创建时间 |

## 12. site_settings

用途：站点配置。

| 字段 | 类型 | 说明 |
|---|---|---|
| key | text | 配置键 |
| value | jsonb | 配置值 |
| updated_at | timestamptz | 更新时间 |

# 十、鉴权与权限设计

## 1. 自建鉴权原因

系统要求账号不限制邮箱或手机号格式，只要求唯一和最大长度。因此使用自建 `users` 与 `sessions` 表更直接。Supabase 用于 Postgres 数据库和 Storage 文件存储，不使用 Supabase Auth 作为主鉴权系统。

## 2. Session 模型

Cookie 名称：`lc_session`

Session 流程：

1. 用户登录成功。
2. 服务端生成随机 session token。
3. 数据库存储 token hash。
4. 浏览器 Cookie 存储原始 token。
5. 后续请求读取 Cookie。
6. 服务端 hash 后查询 session。
7. session 有效则返回当前用户。

Cookie 配置：

| 配置 | 值 |
|---|---|
| HttpOnly | true |
| Secure | 生产环境 true |
| SameSite | Lax |
| Path | `/` |
| Max-Age | 30 天 |

## 3. 权限函数

建议封装以下函数：

| 函数 | 说明 |
|---|---|
| `getCurrentUser()` | 获取当前登录用户，可为空 |
| `requireUser()` | 要求用户登录 |
| `requireAdmin()` | 要求管理员权限 |
| `requireOrderOwner()` | 要求订单归属当前顾客 |
| `requireCartOwner()` | 要求购物车项归属当前顾客 |

## 4. 权限边界

| 资源 | 权限规则 |
|---|---|
| 商品列表 | 公开读取，仅 active 商品 |
| 商品详情 | 公开读取，仅 active 商品 |
| 购物车 | 顾客只能操作自己的购物车 |
| 订单 | 顾客只能查看自己的订单 |
| 后台商品 | 仅 admin |
| 后台订单 | 仅 admin |
| 后台顾客 | 仅 admin |
| 文件上传 | 仅 admin |

# 十一、核心业务流程

## 1. 创建订单流程

创建订单必须使用数据库事务。

流程：

1. 开始事务。
2. 读取购物车项。
3. 锁定相关规格库存。
4. 检查商品状态。
5. 检查规格状态。
6. 检查库存。
7. 生成订单号。
8. 创建 `orders`。
9. 创建 `order_items` 快照。
10. 扣减 `product_variants.stock`。
11. 删除已下单 `cart_items`。
12. 写入 `order_status_logs`。
13. 提交事务。

库存扣减原则：

```sql
update product_variants
set stock = stock - :quantity
where id = :variantId
  and stock >= :quantity;
```

如果影响行数为 0，说明库存不足。

## 2. 修改订单状态流程

流程：

1. 管理员提交新状态。
2. 服务端校验管理员权限。
3. 查询订单。
4. 校验状态流转是否合法。
5. 更新 `orders.status`。
6. 写入 `order_status_logs`。
7. 返回最新订单。

## 3. 修改付款状态流程

流程：

1. 管理员提交付款状态。
2. 校验管理员权限。
3. 校验订单存在。
4. 更新 `orders.payment_status`。
5. 可选写入备注。
6. 返回最新订单。

# 十二、安全设计

## 1. 输入校验

所有 API 入参使用 Zod 校验。

示例：

```ts
const registerSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
})
```

## 2. 密码安全

要求：

- 使用 Argon2id 或 bcrypt。
- 不保存明文密码。
- 不在日志打印密码。
- 修改密码后删除该用户所有旧 session。
- 登录失败返回统一错误信息。

## 3. Session 安全

要求：

- token 使用高强度随机数。
- 数据库只保存 token hash。
- Cookie 设置 HttpOnly。
- 生产环境 Cookie 设置 Secure。
- 过期 session 定期清理。
- 用户禁用后所有 session 失效。

## 4. 上传安全

要求：

- 文件大小限制。
- 文件类型白名单。
- 文件名服务端生成。
- 不允许用户控制最终路径。
- 不允许 SVG 和 HTML 文件。
- Service Role Key 不进入客户端代码。

## 5. 富文本安全

如果商品详情支持富文本，需要：

- 使用白名单 HTML。
- 过滤 script、iframe、事件属性。
- 展示前进行服务端或前端安全清洗。
- 后台输入也不可信，仍需要过滤。

# 十三、部署技术设计

## 1. 部署方案

| 模块 | 方案 |
|---|---|
| 应用部署 | Vercel Hobby |
| 数据库 | Supabase Free |
| 图片存储 | Supabase Storage |
| DNS | Cloudflare DNS |
| 域名 | 自购域名 |
| HTTPS | Vercel 自动证书 |
| CI/CD | GitHub push 自动部署 |

## 2. 域名结构

推荐：

| 域名 | 用途 |
|---|---|
| `www.example.com` | 主站 |
| `example.com` | 301 跳转到 www |

初期建议 Cloudflare DNS 记录使用 DNS only，减少双 CDN 或代理带来的排查成本。

## 3. Vercel 设置

| 设置项 | 建议值 |
|---|---|
| Framework | Next.js |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Output Directory | 默认 |
| Node.js Version | 显式指定 LTS 版本 |
| Environment Variables | 按环境变量表配置 |

## 4. 环境变量

```env
NEXT_PUBLIC_APP_URL=
SESSION_SECRET=
NODE_ENV=
DATABASE_URL=
DIRECT_DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=product-images
PASSWORD_PEPPER=
```

环境变量说明：

| 变量 | 是否可暴露前端 | 说明 |
|---|---:|---|
| `NEXT_PUBLIC_APP_URL` | 是 | 前台 URL |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 否 | 服务端上传和管理 Storage |
| `DATABASE_URL` | 否 | 应用数据库连接 |
| `DIRECT_DATABASE_URL` | 否 | migration 和管理工具使用 |
| `SESSION_SECRET` | 否 | Session 相关密钥 |
| `PASSWORD_PEPPER` | 否 | 密码哈希增强 |

# 十四、测试与验收

## 1. 前台验收标准

| 编号 | 标准 |
|---|---|
| F-001 | 游客可以访问首页、商品列表、商品详情 |
| F-002 | 游客点击加入购物车时提示登录 |
| F-003 | 顾客可以注册任意格式账号 |
| F-004 | 重复账号不能注册 |
| F-005 | 账号最大 64 字符 |
| F-006 | 密码最大 128 字符 |
| F-007 | 顾客登录后可以加入购物车 |
| F-008 | 顾客可以修改购物车数量 |
| F-009 | 库存不足时不能提交订单 |
| F-010 | 顾客可以提交订单 |
| F-011 | 顾客只能查看自己的订单 |
| F-012 | 商品详情页具备 SEO title 和 description |

## 2. 后台验收标准

| 编号 | 标准 |
|---|---|
| A-001 | 普通顾客不能进入后台 |
| A-002 | 管理员可以新增商品 |
| A-003 | 管理员可以上传商品图片 |
| A-004 | 管理员可以设置商品上下架 |
| A-005 | 下架商品前台不可见 |
| A-006 | 管理员可以维护商品规格和库存 |
| A-007 | 管理员可以查看所有订单 |
| A-008 | 管理员可以修改订单状态 |
| A-009 | 管理员可以修改付款状态 |
| A-010 | 管理员可以填写物流信息 |
| A-011 | 订单状态变更写入日志 |
| A-012 | 管理员可以禁用顾客 |

## 3. 数据验收标准

| 编号 | 标准 |
|---|---|
| D-001 | 数据库不保存明文密码 |
| D-002 | 用户账号唯一 |
| D-003 | 商品 slug 唯一 |
| D-004 | 订单号唯一 |
| D-005 | 订单明细保存商品快照 |
| D-006 | 修改商品价格不影响历史订单 |
| D-007 | 创建订单时库存正确扣减 |
| D-008 | 并发提交不会导致库存为负 |
| D-009 | 后台删除有订单商品时只能下架 |
| D-010 | 顾客不能访问他人订单 |

# 十五、开发顺序

## 1. 第一阶段：基础闭环

1. 初始化 Next.js + TypeScript + Tailwind。
2. 配置 Supabase Postgres。
3. 配置 Drizzle ORM。
4. 创建数据库表。
5. 实现注册、登录、退出、Session。
6. 实现后台管理员鉴权。
7. 实现分类管理。
8. 实现商品管理。
9. 实现商品前台列表和详情。
10. 实现购物车。
11. 实现提交订单。
12. 实现后台订单管理。

## 2. 第二阶段：体验完善

1. 商品图片上传。
2. 商品多图排序。
3. 商品规格编辑。
4. 订单状态时间线。
5. 后台首页统计。
6. 顾客管理。
7. 站点配置。
8. SEO metadata。
9. sitemap。
10. robots。

## 3. 第三阶段：上线与稳定性

1. Vercel 部署。
2. Supabase 环境变量配置。
3. 自购域名接入 Cloudflare DNS。
4. Vercel 自定义域名配置。
5. HTTPS 检查。
6. 数据库备份流程。
7. 错误日志检查。
8. 基础性能优化。

# 十六、MVP 边界

## 1. 必须实现

- 前台商品浏览。
- 商品详情 SEO。
- 用户注册登录。
- 加入购物车。
- 提交订单。
- 我的订单。
- 后台商品管理。
- 后台分类管理。
- 后台订单管理。
- 后台付款状态维护。
- 后台物流信息维护。
- 商品图片上传。
- 管理员权限控制。

## 2. 暂不实现

- 在线支付。
- 优惠券。
- 秒杀。
- 拼团。
- 积分。
- 会员等级。
- 自动物流轨迹。
- 多仓库。
- 发票。
- 复杂售后。
- 多语言。
- App。
- 小程序。

# 十七、最终技术结论

本系统采用以下技术路线：

| 层级 | 结论 |
|---|---|
| 前台商城 | Next.js App Router + Server Components |
| 后台管理 | Next.js `/admin` 模块 |
| 后端 API | Route Handlers + Server Actions |
| 运行环境 | Node.js Runtime |
| 数据库 | Supabase Postgres |
| ORM | Drizzle ORM |
| 文件存储 | Supabase Storage |
| 鉴权 | 自建 users / sessions 表 + HttpOnly Cookie |
| 部署 | Vercel Hobby |
| DNS | Cloudflare DNS |

该方案能覆盖真实电商核心流程，同时避免引入当前体量不需要的复杂组件。整体结构轻量、清晰、易开发、易部署，并能支持后续按需扩展商品规格、订单导出、低库存提醒、站点配置和自动备份等能力。
