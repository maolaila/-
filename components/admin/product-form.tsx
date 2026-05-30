"use client";

import { useActionState, useMemo, useState } from "react";
import { Save, Upload } from "lucide-react";

import { createProductAction, updateProductAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { emptyActionState } from "@/lib/action-state";
import type { CategoryRow, ProductDetail, ProductVariant } from "@/server/services/catalog";

const defaultVariant = [
  {
    optionValues: { 规格: "默认" },
    price: 0,
    costPrice: null,
    stock: 0,
    status: "active"
  }
];

export function ProductForm({
  categories,
  product
}: {
  categories: CategoryRow[];
  product?: ProductDetail;
}) {
  const [state, action, pending] = useActionState(product ? updateProductAction : createProductAction, emptyActionState);
  const [mainImageUrl, setMainImageUrl] = useState(product?.mainImageUrl ?? "");
  const [images, setImages] = useState((product?.images ?? []).map((image) => image.url).join("\n"));
  const [variantsJson, setVariantsJson] = useState(() => JSON.stringify(toEditableVariants(product?.variants), null, 2));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [uploadedThumbs, setUploadedThumbs] = useState<Record<string, string>>({});
  const detailImageUrls = useMemo(() => parseImageUrls(images), [images]);
  const parsedPreview = useMemo(() => {
    try {
      const parsed = JSON.parse(variantsJson) as ProductVariant[];
      return `${parsed.length} 个规格`;
    } catch {
      return "规格 JSON 格式错误";
    }
  }, [variantsJson]);

  async function upload(file: File | null) {
    if (!file) {
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadInfo(null);
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        body: data
      });
      const body = (await response.json()) as {
        url?: string;
        detailUrl?: string;
        thumbUrl?: string;
        error?: string;
        contentType?: string;
        originalBytes?: number;
        storedBytes?: number;
        thumbBytes?: number;
      };
      if (!response.ok || !body.url) {
        throw new Error(body.error ?? "上传失败");
      }
      const uploadedUrl = body.detailUrl ?? body.url;
      const uploadedThumbUrl = body.thumbUrl;
      setMainImageUrl((current) => current || uploadedThumbUrl || uploadedUrl);
      setImages((current) => appendDetailImageUrl(current, uploadedUrl));
      if (uploadedThumbUrl) {
        setUploadedThumbs((current) => ({ ...current, [uploadedUrl]: uploadedThumbUrl }));
      }
      setUploadInfo(
        body.contentType === "image/webp"
          ? `已生成详情图和缩略图${body.originalBytes && body.storedBytes ? `：原图 ${formatBytes(body.originalBytes)}，详情图 ${formatBytes(body.storedBytes)}${body.thumbBytes ? `，缩略图 ${formatBytes(body.thumbBytes)}` : ""}` : ""}`
          : "上传成功"
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="grid gap-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="商品名称">
          <Input name="name" defaultValue={product?.name ?? ""} maxLength={120} required />
        </Field>
        <Field label="Slug">
          <Input name="slug" defaultValue={product?.slug ?? ""} required />
        </Field>
        <Field label="分类">
          <Select name="categoryId" defaultValue={product?.categoryId ?? ""} required>
            <option value="">选择分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="状态">
          <Select name="status" defaultValue={product?.status ?? "draft"}>
            <option value="draft">草稿</option>
            <option value="active">上架</option>
            <option value="inactive">下架</option>
          </Select>
        </Field>
        <Field label="商品 SKU">
          <Input name="sku" defaultValue={product?.sku ?? ""} />
        </Field>
        <Field label="标签">
          <Input name="tags" defaultValue={product?.tags.join(", ") ?? ""} placeholder="新品, 现货, 预订" />
        </Field>
      </div>
      <Field label="商品简介">
        <Textarea name="summary" defaultValue={product?.summary ?? ""} maxLength={300} />
      </Field>
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <Field label="商品缩略图 URL">
          <Input name="mainImageUrl" onChange={(event) => setMainImageUrl(event.target.value)} required value={mainImageUrl} />
        </Field>
        <label className="grid gap-2 text-sm font-medium">
          上传商品图
          <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {uploading ? "上传中" : "选择图片"}
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => upload(event.target.files?.[0] ?? null)}
              type="file"
            />
          </span>
          {uploadError ? <span className="text-xs font-normal text-red-600">{uploadError}</span> : null}
          {uploadInfo ? <span className="text-xs font-normal text-emerald-700">{uploadInfo}</span> : null}
        </label>
      </div>
      {mainImageUrl ? (
        <div className="grid gap-2">
          <div className="text-sm font-medium text-ink">当前商品缩略图</div>
          <div className="w-28 overflow-hidden rounded-md border border-line bg-white">
            <div className="aspect-square bg-slate-100">
              <img alt="商品缩略图" className="h-full w-full object-cover" src={mainImageUrl} />
            </div>
          </div>
        </div>
      ) : null}
      <Field label="详情图片 URL（每行一个，不限数量）">
        <Textarea name="images" onChange={(event) => setImages(event.target.value)} value={images} />
      </Field>
      {detailImageUrls.length > 0 ? (
        <div className="grid gap-2">
          <div className="text-sm font-medium text-ink">详情图片预览</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {detailImageUrls.map((url, index) => {
              const generatedThumbUrl = uploadedThumbs[url] ?? toGeneratedThumbnailUrl(url);
              return (
                <figure className="overflow-hidden rounded-md border border-line bg-white" key={`${url}-${index}`}>
                  <div className="aspect-square bg-slate-100">
                    <img alt={`详情图 ${index + 1}`} className="h-full w-full object-cover" src={generatedThumbUrl ?? url} />
                  </div>
                  <figcaption className="grid gap-1 px-2 py-1 text-xs text-muted">
                    <span className="truncate">详情图 {index + 1}</span>
                    {generatedThumbUrl ? (
                      <button
                        className="text-left text-brand hover:underline"
                        onClick={() => setMainImageUrl(generatedThumbUrl)}
                        type="button"
                      >
                        设为商品缩略图
                      </button>
                    ) : null}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      ) : null}
      {detailImageUrls.length > 0 ? (
        <div className="rounded-md border border-line bg-white p-3 text-xs text-muted">
          详情图片数量：{detailImageUrls.length}。商品缩略图单独保存，详情图片不限制数量。
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="SEO 标题">
          <Input name="seoTitle" defaultValue={product?.seoTitle ?? ""} maxLength={70} />
        </Field>
        <Field label="SEO 描述">
          <Input name="seoDescription" defaultValue={product?.seoDescription ?? ""} maxLength={160} />
        </Field>
      </div>
      <Field label="商品详情">
        <Textarea name="description" defaultValue={product?.description ?? ""} maxLength={5000} />
      </Field>
      <Field label="购买说明">
        <Textarea name="purchaseNote" defaultValue={product?.purchaseNote ?? ""} maxLength={2000} />
      </Field>
      <Field label={`规格 JSON（${parsedPreview}）`} hint='示例：[{ "optionValues": { "颜色": "白色" }, "price": 89, "stock": 10, "status": "active" }]'>
        <Textarea
          className="min-h-48 font-mono"
          name="variantsJson"
          onChange={(event) => setVariantsJson(event.target.value)}
          value={variantsJson}
        />
      </Field>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{state.message}</p>
      ) : null}
      <div>
        <Button disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "保存中" : "保存商品"}
        </Button>
      </div>
    </form>
  );
}

function parseImageUrls(images: string) {
  return Array.from(
    new Set(
      images
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean)
    )
  );
}

function appendDetailImageUrl(images: string, url: string) {
  return Array.from(new Set([...parseImageUrls(images), url])).join("\n");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function toGeneratedThumbnailUrl(url: string) {
  if (url.endsWith("/main.webp")) {
    return url.replace(/\/main\.webp$/, "/thumb.webp");
  }
  if (url.endsWith("-thumb.webp")) {
    return url;
  }

  const pathname = getPathname(url);
  if (!pathname) {
    return null;
  }
  if (/^\/(?:uploads\/)?products\/\d{4}\/\d{2}\/[^/]+\.webp$/.test(pathname)) {
    return url.replace(/\.webp$/, "-thumb.webp");
  }
  return null;
}

function getPathname(url: string) {
  if (url.startsWith("/")) {
    return url;
  }
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

function toEditableVariants(variants: ProductVariant[] | undefined) {
  if (!variants || variants.length === 0) {
    return defaultVariant;
  }
  return variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    optionValues: variant.optionValues,
    price: Number(variant.price),
    costPrice: variant.costPrice == null ? null : Number(variant.costPrice),
    stock: variant.stock,
    status: variant.status
  }));
}
