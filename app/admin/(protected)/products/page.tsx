import { Edit, Plus, Trash2 } from "lucide-react";

import { deleteProductAction, productStatusAction } from "@/app/admin/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { ProductStatusBadge } from "@/components/ui/status";
import type { ProductStatus } from "@/db/schema";
import { formatMoney } from "@/lib/utils";
import { getAdminCategories, getAdminProducts } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [products, categories, settings] = await Promise.all([
    getAdminProducts({
      q: first(params.q),
      categoryId: first(params.categoryId),
      status: (first(params.status) as ProductStatus | "all" | undefined) ?? "all"
    }),
    getAdminCategories(),
    getSiteSettings()
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">商品管理</h1>
          <p className="mt-1 text-sm text-muted">管理商品上下架、库存、规格和图片。</p>
        </div>
        <ButtonLink href="/admin/products/new">
          <Plus className="h-4 w-4" />
          新增商品
        </ButtonLink>
      </div>
      <form className="grid gap-3 rounded-md border border-line bg-white p-4 md:grid-cols-[1fr_180px_160px_auto]">
        <input className="h-10 rounded-md border border-line px-3" defaultValue={first(params.q) ?? ""} name="q" placeholder="搜索商品名称" />
        <Select defaultValue={first(params.categoryId) ?? ""} name="categoryId">
          <option value="">全部分类</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select defaultValue={first(params.status) ?? "all"} name="status">
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="active">上架</option>
          <option value="inactive">下架</option>
        </Select>
        <Button>筛选</Button>
      </form>
      <section className="overflow-auto rounded-md border border-line bg-white">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-wash text-muted">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">价格</th>
              <th className="px-4 py-3">库存</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr className="border-t border-line" key={product.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img alt={product.name} className="h-14 w-14 rounded-md object-cover" src={product.mainImageUrl} />
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.summary ? <div className="line-clamp-1 text-xs text-muted">{product.summary}</div> : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{product.categoryName}</td>
                <td className="px-4 py-3">{formatMoney(product.minPrice, settings.currency)}</td>
                <td className="px-4 py-3">{product.totalStock}</td>
                <td className="px-4 py-3"><ProductStatusBadge status={product.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink className="h-9 px-3" href={`/admin/products/${product.id}`} variant="secondary">
                      <Edit className="h-4 w-4" />
                    </ButtonLink>
                    <form action={productStatusAction} className="flex gap-2">
                      <input type="hidden" name="id" value={product.id} />
                      <Select className="h-9" defaultValue={product.status} name="status">
                        <option value="draft">草稿</option>
                        <option value="active">上架</option>
                        <option value="inactive">下架</option>
                      </Select>
                      <Button className="h-9 px-3" type="submit" variant="secondary">
                        保存
                      </Button>
                    </form>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <Button className="h-9 px-3" type="submit" variant="danger" title="删除或下架">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
