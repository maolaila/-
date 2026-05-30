import Link from "next/link";

import { ProductFilterBar } from "@/components/store/product-filter-bar";
import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { getPublicProducts, getVisibleCategories } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function productsHref(params: Record<string, string | string[] | undefined>, updates: Record<string, string>) {
  const next = {
    q: value(params, "q") ?? "",
    category: value(params, "category") ?? "",
    sort: value(params, "sort") ?? "",
    stock: value(params, "stock") ?? "",
    ...updates
  };
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(next)) {
    const item = raw.trim();
    if (item && item !== "newest" && item !== "all") {
      query.set(key, item);
    }
  }
  const queryString = query.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentCategory = value(params, "category") ?? "";
  const [settings, categories, products] = await Promise.all([
    getSiteSettings(),
    getVisibleCategories(),
    getPublicProducts({
      category: value(params, "category"),
      q: value(params, "q"),
      sort: value(params, "sort"),
      stock: value(params, "stock")
    })
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">商品列表</h1>
          <p className="mt-1 text-sm text-muted">共展示 {products.length} 件商品</p>
        </div>
      </div>

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="flex min-w-max gap-2">
          <Link
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-medium transition active:scale-[0.98]",
              currentCategory ? "border-line bg-white text-muted" : "border-brand bg-teal-50 text-brand"
            )}
            href={productsHref(params, { category: "" })}
          >
            全部
          </Link>
          {categories.map((category) => (
            <Link
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition active:scale-[0.98]",
                currentCategory === category.slug ? "border-brand bg-teal-50 text-brand" : "border-line bg-white text-muted"
              )}
              href={productsHref(params, { category: category.slug })}
              key={category.id}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <ProductFilterBar
        values={{
          category: currentCategory,
          q: value(params, "q") ?? "",
          sort: value(params, "sort") ?? "newest",
          stock: value(params, "stock") ?? "all"
        }}
      />

      {products.length === 0 ? (
        <EmptyState title="没有找到商品" description="请更换分类或搜索词。" actionHref="/products" actionLabel="查看全部商品" />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard currency={settings.currency} key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
