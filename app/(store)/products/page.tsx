import { Search } from "lucide-react";

import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { getPublicProducts, getVisibleCategories } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">商品列表</h1>
        <p className="mt-1 text-sm text-muted">按分类、关键词和库存快速筛选可购买商品。</p>
      </div>

      <form className="mb-6 grid gap-3 rounded-md border border-line bg-white p-4 md:grid-cols-[1fr_180px_160px_160px_auto]">
        <label className="flex h-10 items-center gap-2 rounded-md border border-line px-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            className="min-w-0 flex-1 outline-none"
            defaultValue={value(params, "q") ?? ""}
            maxLength={50}
            name="q"
            placeholder="商品名称或简介"
          />
        </label>
        <Select defaultValue={value(params, "category") ?? ""} name="category">
          <option value="">全部分类</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select defaultValue={value(params, "sort") ?? "newest"} name="sort">
          <option value="newest">最新</option>
          <option value="price_asc">价格升序</option>
          <option value="price_desc">价格降序</option>
        </Select>
        <Select defaultValue={value(params, "stock") ?? "all"} name="stock">
          <option value="all">全部库存</option>
          <option value="in_stock">有货</option>
          <option value="sold_out">售罄</option>
        </Select>
        <button className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-white" type="submit">
          筛选
        </button>
      </form>

      {products.length === 0 ? (
        <EmptyState title="没有找到商品" description="请更换分类或搜索词。" actionHref="/products" actionLabel="查看全部商品" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard currency={settings.currency} key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
