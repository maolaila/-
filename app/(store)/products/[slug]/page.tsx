import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToCartForm } from "@/components/store/add-to-cart-form";
import { sanitizeRichText } from "@/lib/sanitize";
import { formatMoney } from "@/lib/utils";
import { getProductBySlug } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return {};
  }
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.summary || product.name,
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.summary || product.name,
      images: [product.mainImageUrl]
    }
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSiteSettings()]);
  if (!product) {
    notFound();
  }

  const images = product.images.length > 0 ? product.images : [{ id: "main", url: product.mainImageUrl, storagePath: null, sortOrder: 0 }];
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <section className="grid gap-4">
          <div className="aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
            <img alt={product.name} className="h-full w-full object-cover" src={product.mainImageUrl} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {images.slice(0, 4).map((image) => (
              <div className="aspect-square overflow-hidden rounded-md border border-line bg-white" key={image.id}>
                <img alt={product.name} className="h-full w-full object-cover" src={image.url} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-line bg-white p-6">
          <p className="text-sm text-muted">{product.categoryName}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">{product.name}</h1>
          <div className="mt-4 text-2xl font-bold text-brand">
            {formatMoney(product.minPrice, settings.currency)}
          </div>
          <p className="mt-3 text-sm text-muted">{product.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span className="rounded bg-wash px-2 py-1 text-xs text-muted" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-md bg-wash p-3 text-sm text-muted">
            库存：{totalStock > 0 ? `${totalStock} 件` : "已售罄"}
          </div>
          <div className="mt-6">
            <AddToCartForm productId={product.id} redirectTo={`/products/${product.slug}`} variants={product.variants} />
          </div>
        </section>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.4fr]">
        <div className="rounded-md border border-line bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">商品详情</h2>
          <div className="prose-lite text-sm leading-7 text-ink" dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) || "<p>暂无详情。</p>" }} />
        </div>
        <div className="rounded-md border border-line bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">购买说明</h2>
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted">{product.purchaseNote || settings.orderNotice}</p>
        </div>
      </section>
    </div>
  );
}
