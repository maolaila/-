import Link from "next/link";

import type { ProductCard as ProductCardType } from "@/server/services/catalog";
import { formatMoney } from "@/lib/utils";

export function ProductCard({ product, currency }: { product: ProductCardType; currency: string }) {
  const soldOut = product.totalStock <= 0;
  return (
    <article className="overflow-hidden rounded-md border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[4/3] bg-slate-100">
          <img
            src={product.mainImageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="grid gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-2 text-sm font-semibold text-ink">{product.name}</h3>
              <p className="mt-1 text-xs text-muted">{product.categoryName}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-brand">
              {formatMoney(product.minPrice, currency)}
            </span>
          </div>
          {product.summary ? <p className="line-clamp-2 min-h-10 text-sm text-muted">{product.summary}</p> : null}
          <div className="flex min-h-6 flex-wrap items-center gap-2">
            <span className={soldOut ? "text-xs font-medium text-red-600" : "text-xs font-medium text-emerald-700"}>
              {soldOut ? "已售罄" : product.totalStock <= 5 ? "少量现货" : "有货"}
            </span>
            {product.tags.slice(0, 3).map((tag) => (
              <span className="rounded bg-wash px-2 py-1 text-xs text-muted" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
