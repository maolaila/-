import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { getAdminCategories, getProductForAdmin } from "@/server/services/catalog";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const [categories, product] = await Promise.all([getAdminCategories(), getProductForAdmin(id)]);
  if (!product) {
    notFound();
  }
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">编辑商品</h1>
        <p className="mt-1 text-sm text-muted">{product.name}</p>
      </div>
      <section className="rounded-md border border-line bg-white p-5">
        <ProductForm categories={categories} product={product} />
      </section>
    </div>
  );
}
