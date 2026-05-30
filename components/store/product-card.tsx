"use client";

import Link from "next/link";
import { useState } from "react";

import type { ProductCard as ProductCardType } from "@/server/services/catalog";
import { formatPriceRange } from "@/lib/utils";

export function ProductCard({ product, currency }: { product: ProductCardType; currency: string }) {
  const soldOut = product.totalStock <= 0;
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="h-full overflow-hidden rounded-md border border-line bg-white transition hover:-translate-y-0.5 hover:border-brand hover:shadow-soft">
      <Link href={`/products/${product.slug}`} className="grid h-full grid-rows-[auto_1fr]">
        <div className="relative aspect-square bg-slate-100">
          {imageFailed ? (
            <div className="grid h-full place-items-center bg-wash px-3 text-center text-xs text-muted">
              商品图片
            </div>
          ) : (
            <img
              src={product.mainImageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          )}
          <span
            className={
              soldOut
                ? "absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white"
                : "absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white"
            }
          >
            {soldOut ? "售罄" : product.totalStock <= 5 ? "少量" : "现货"}
          </span>
        </div>
        <div className="grid content-start gap-2 p-2.5 sm:p-3">
          <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-ink">{product.name}</h3>
          <div className="min-w-0 text-base font-bold leading-none text-red-600 sm:text-lg">
            {formatPriceRange(product.minPrice, product.maxPrice, currency)}
          </div>
          <div className="flex min-h-5 min-w-0 items-center gap-1.5 text-xs text-muted">
            <span className="truncate">{product.categoryName}</span>
            {product.tags.slice(0, 2).map((tag) => (
              <span className="shrink-0 rounded bg-wash px-1.5 py-0.5" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
