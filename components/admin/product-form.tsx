"use client";

import { useActionState, useMemo, useState } from "react";
import { Save, Upload } from "lucide-react";

import { createProductAction, updateProductAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { emptyActionState } from "@/lib/action-state";
import type { CategoryRow, ProductDetail, ProductVariant } from "@/server/services/catalog";

type UploadResult = {
  url?: string;
  detailUrl?: string;
  thumbUrl?: string;
  error?: string;
  contentType?: string;
  originalBytes?: number;
  storedBytes?: number;
  thumbBytes?: number;
};

type EditableProductVariant = {
  id?: string;
  sku?: string | null;
  optionValues: Record<string, string>;
  price: number;
  costPrice: number | null;
  stock: number;
  status: "active" | "inactive";
};

const defaultVariant: EditableProductVariant[] = [
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
  const [variantBaseList] = useState(() => toEditableVariants(product?.variants));
  const primaryVariantBase = variantBaseList[0] ?? defaultVariant[0];
  const [price, setPrice] = useState(() => formatNumberInput(primaryVariantBase.price));
  const [costPrice, setCostPrice] = useState(() =>
    primaryVariantBase.costPrice == null ? "" : formatNumberInput(primaryVariantBase.costPrice)
  );
  const [stock, setStock] = useState(() => String(primaryVariantBase.stock));
  const [variantStatus, setVariantStatus] = useState<"active" | "inactive">(primaryVariantBase.status);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [detailUploading, setDetailUploading] = useState(false);
  const [thumbnailUploadError, setThumbnailUploadError] = useState<string | null>(null);
  const [detailUploadError, setDetailUploadError] = useState<string | null>(null);
  const [thumbnailUploadInfo, setThumbnailUploadInfo] = useState<string | null>(null);
  const [detailUploadInfo, setDetailUploadInfo] = useState<string | null>(null);
  const [uploadedThumbs, setUploadedThumbs] = useState<Record<string, string>>({});
  const detailImageUrls = useMemo(() => parseImageUrls(images), [images]);
  const variantsJson = useMemo(
    () =>
      JSON.stringify([
        {
          ...primaryVariantBase,
          price: toNumber(price),
          costPrice: costPrice.trim() ? toNumber(costPrice) : null,
          stock: toInteger(stock),
          status: variantStatus
        },
        ...variantBaseList.slice(1)
      ]),
    [costPrice, price, primaryVariantBase, stock, variantBaseList, variantStatus]
  );

  async function uploadOne(file: File, usage: "thumbnail" | "detail") {
    const data = new FormData();
    data.set("file", file);
    data.set("usage", usage);
    const response = await fetch("/api/admin/uploads/product-image", {
      method: "POST",
      body: data
    });
    const body = (await response.json()) as UploadResult;
    if (!response.ok || !body.url) {
      throw new Error(body.error ?? "上传失败");
    }
    return body;
  }

  async function uploadThumbnail(file: File | null) {
    if (!file) {
      return;
    }
    setThumbnailUploading(true);
    setThumbnailUploadError(null);
    setThumbnailUploadInfo(null);
    try {
      const body = await uploadOne(file, "thumbnail");
      setMainImageUrl(body.thumbUrl ?? body.detailUrl ?? body.url ?? "");
      setThumbnailUploadInfo(
        body.contentType === "image/webp"
          ? `缩略图已生成 WebP${body.thumbBytes ? `：${formatBytes(body.thumbBytes)}` : ""}`
          : "上传成功"
      );
    } catch (error) {
      setThumbnailUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setThumbnailUploading(false);
    }
  }

  async function uploadDetailImages(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }
    setDetailUploading(true);
    setDetailUploadError(null);
    setDetailUploadInfo(null);
    try {
      const uploaded: UploadResult[] = [];
      for (const file of selectedFiles) {
        uploaded.push(await uploadOne(file, "detail"));
      }
      const detailUrls = uploaded
        .map((body) => body.detailUrl ?? body.url)
        .filter((url): url is string => Boolean(url));
      setImages((current) => appendDetailImageUrls(current, detailUrls));
      setUploadedThumbs((current) => {
        const next = { ...current };
        for (const body of uploaded) {
          const detailUrl = body.detailUrl ?? body.url;
          if (detailUrl && body.thumbUrl) {
            next[detailUrl] = body.thumbUrl;
          }
        }
        return next;
      });
      const totalOriginalBytes = uploaded.reduce((sum, body) => sum + (body.originalBytes ?? 0), 0);
      const totalStoredBytes = uploaded.reduce((sum, body) => sum + (body.storedBytes ?? 0), 0);
      setDetailUploadInfo(
        `已上传 ${uploaded.length} 张详情图并转成 WebP${
          totalOriginalBytes > 0 && totalStoredBytes > 0
            ? `：原图 ${formatBytes(totalOriginalBytes)}，详情图 ${formatBytes(totalStoredBytes)}`
            : ""
        }`
      );
    } catch (error) {
      setDetailUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setDetailUploading(false);
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
        <Field label="商品状态">
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
      <input name="variantsJson" type="hidden" value={variantsJson} />
      <div className="grid gap-4 lg:grid-cols-4">
        <Field label="售价">
          <Input
            min="0"
            name="price"
            onChange={(event) => setPrice(event.target.value)}
            required
            step="0.01"
            type="number"
            value={price}
          />
        </Field>
        <Field label="成本价">
          <Input
            min="0"
            name="costPrice"
            onChange={(event) => setCostPrice(event.target.value)}
            placeholder="可不填"
            step="0.01"
            type="number"
            value={costPrice}
          />
        </Field>
        <Field label="库存">
          <Input
            min="0"
            name="stock"
            onChange={(event) => setStock(event.target.value)}
            required
            step="1"
            type="number"
            value={stock}
          />
        </Field>
        <Field label="售卖状态">
          <Select
            name="variantStatus"
            onChange={(event) => setVariantStatus(event.target.value as "active" | "inactive")}
            value={variantStatus}
          >
            <option value="active">可购买</option>
            <option value="inactive">暂停购买</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <Field label="商品缩略图 URL">
          <Input name="mainImageUrl" onChange={(event) => setMainImageUrl(event.target.value)} required value={mainImageUrl} />
        </Field>
        <label className="grid gap-2 text-sm font-medium">
          上传列表缩略图
          <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {thumbnailUploading ? "上传中" : "选择缩略图"}
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={thumbnailUploading || detailUploading}
              onChange={(event) => {
                void uploadThumbnail(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
              type="file"
            />
          </span>
          {thumbnailUploadError ? <span className="text-xs font-normal text-red-600">{thumbnailUploadError}</span> : null}
          {thumbnailUploadInfo ? <span className="text-xs font-normal text-emerald-700">{thumbnailUploadInfo}</span> : null}
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
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <Field label="详情图片 URL（每行一个，不限数量）">
          <Textarea name="images" onChange={(event) => setImages(event.target.value)} value={images} />
        </Field>
        <label className="grid content-start gap-2 text-sm font-medium">
          批量上传详情图
          <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {detailUploading ? "上传中" : "选择详情图"}
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={thumbnailUploading || detailUploading}
              multiple
              onChange={(event) => {
                void uploadDetailImages(event.target.files);
                event.target.value = "";
              }}
              type="file"
            />
          </span>
          <span className="text-xs font-normal text-muted">可一次选择多张，也可以只选一张。</span>
          {detailUploadError ? <span className="text-xs font-normal text-red-600">{detailUploadError}</span> : null}
          {detailUploadInfo ? <span className="text-xs font-normal text-emerald-700">{detailUploadInfo}</span> : null}
        </label>
      </div>
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

function appendDetailImageUrls(images: string, urls: string[]) {
  return Array.from(new Set([...parseImageUrls(images), ...urls])).join("\n");
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
  return null;
}

function formatNumberInput(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
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
