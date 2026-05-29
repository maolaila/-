import { ProductForm } from "@/components/admin/product-form";
import { getAdminCategories } from "@/server/services/catalog";

export default async function NewProductPage() {
  const categories = await getAdminCategories();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">新增商品</h1>
        <p className="mt-1 text-sm text-muted">单规格商品也需要保留一个默认规格。</p>
      </div>
      <section className="rounded-md border border-line bg-white p-5">
        <ProductForm categories={categories} />
      </section>
    </div>
  );
}
