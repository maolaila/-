import { ArrowRight, Megaphone } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { getHomeProducts, getVisibleCategories } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

export default async function HomePage() {
  const [settings, categories, products] = await Promise.all([
    getSiteSettings(),
    getVisibleCategories(),
    getHomeProducts()
  ]);

  return (
    <div>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-sm font-medium text-brand">
              <Megaphone className="h-4 w-4" />
              {settings.announcement}
            </p>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-normal text-ink md:text-5xl">
              {settings.storeName}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              轻量真实销售商城，支持现货、预订、人工确认付款和后台订单流转。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/products">
                浏览商品
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/register" variant="secondary">
                注册账号
              </ButtonLink>
            </div>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
            <img
              alt="商品展示"
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1400&q=80"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">分类入口</h2>
            <p className="mt-1 text-sm text-muted">按实际销售品类快速浏览。</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              className="rounded-md border border-line bg-white p-4 transition hover:border-brand hover:shadow-soft"
              href={`/products?category=${category.slug}`}
              key={category.id}
            >
              <div className="font-semibold">{category.name}</div>
              <div className="mt-1 text-sm text-muted">{category.productCount ?? 0} 个上架商品</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">推荐商品</h2>
            <p className="mt-1 text-sm text-muted">优先展示现货和重点商品。</p>
          </div>
          <Link className="text-sm font-medium text-brand" href="/products">
            查看全部
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.featured.map((product) => (
            <ProductCard currency={settings.currency} key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">最新商品</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.latest.map((product) => (
            <ProductCard currency={settings.currency} key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
