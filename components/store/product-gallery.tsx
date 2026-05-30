"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string;
};

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const normalizedImages = useMemo(() => dedupeImages(images), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const activeImage = normalizedImages[activeIndex] ?? normalizedImages[0];

  useEffect(() => {
    if (!previewOpen) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => moveIndex(current, normalizedImages.length, -1));
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => moveIndex(current, normalizedImages.length, 1));
      }
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [normalizedImages.length, previewOpen]);

  if (!activeImage) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-md bg-slate-100 text-sm text-muted">
        暂无商品图片
      </div>
    );
  }

  return (
    <section className="grid gap-3">
      <button
        className="group relative aspect-[4/3] overflow-hidden rounded-md bg-slate-100 text-left"
        onClick={() => setPreviewOpen(true)}
        type="button"
      >
        <img alt={productName} className="h-full w-full object-contain" src={activeImage.url} />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-black/65 px-2.5 py-1.5 text-xs font-medium text-white opacity-95 transition group-hover:bg-black/75">
          <Maximize2 className="h-3.5 w-3.5" />
          预览
        </span>
      </button>

      {normalizedImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3">
          {normalizedImages.map((image, index) => (
            <button
              className={cn(
                "aspect-square overflow-hidden rounded-md border bg-white transition",
                index === activeIndex ? "border-brand ring-2 ring-teal-100" : "border-line hover:border-brand"
              )}
              key={image.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img alt={`${productName} 图片 ${index + 1}`} className="h-full w-full object-cover" src={image.url} />
            </button>
          ))}
        </div>
      ) : null}

      {previewOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid bg-black/85 p-3 sm:p-6"
          role="dialog"
        >
          <button
            aria-label="关闭预览"
            className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-md bg-white/95 text-ink shadow-sm hover:bg-white"
            onClick={() => setPreviewOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
          {normalizedImages.length > 1 ? (
            <>
              <button
                aria-label="上一张"
                className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white/95 text-ink shadow-sm hover:bg-white"
                onClick={() => setActiveIndex((current) => moveIndex(current, normalizedImages.length, -1))}
                type="button"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                aria-label="下一张"
                className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white/95 text-ink shadow-sm hover:bg-white"
                onClick={() => setActiveIndex((current) => moveIndex(current, normalizedImages.length, 1))}
                type="button"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}
          <div className="grid min-h-0 place-items-center">
            <img
              alt={`${productName} 大图`}
              className="max-h-[calc(100vh-72px)] max-w-full object-contain"
              src={activeImage.url}
            />
          </div>
          {normalizedImages.length > 1 ? (
            <div className="absolute bottom-4 left-1/2 rounded-md bg-white/95 px-3 py-1 text-sm font-medium text-ink shadow-sm">
              {activeIndex + 1} / {normalizedImages.length}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function dedupeImages(images: GalleryImage[]) {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (!image.url || seen.has(image.url)) {
      return false;
    }
    seen.add(image.url);
    return true;
  });
}

function moveIndex(current: number, length: number, direction: -1 | 1) {
  if (length <= 1) {
    return current;
  }
  return (current + direction + length) % length;
}
