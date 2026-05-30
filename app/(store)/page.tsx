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
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:py-12 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <p className="mb-3 inline-flex max-w-full items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-sm font-medium text-brand">
              <Megaphone className="h-4 w-4 shrink-0" />
              {settings.announcement}
            </p>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-normal text-ink sm:text-4xl md:text-5xl">
              {settings.storeName}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              精选现货和预订商品，下单后由客服确认付款、采购和发货进度。
            </p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <ButtonLink className="w-full sm:w-auto" href="/products">
                浏览商品
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink className="w-full sm:w-auto" href="/register" variant="secondary">
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
            <p className="mt-1 text-sm text-muted">按商品类型快速浏览。</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
            <p className="mt-1 text-sm text-muted">优先展示现货和近期上新的商品。</p>
          </div>
          <Link className="text-sm font-medium text-brand" href="/products">
            查看全部
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {products.featured.map((product) => (
            <ProductCard currency={settings.currency} key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">最新商品</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {products.latest.map((product) => (
            <ProductCard currency={settings.currency} key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
