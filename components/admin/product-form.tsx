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
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        body: data
      });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) {
        throw new Error(body.error ?? "上传失败");
      }
      const uploadedUrl = body.url;
      setMainImageUrl((current) => current || uploadedUrl);
      setImages((current) => [current, uploadedUrl].filter(Boolean).join("\n"));
    } catch (error) {
      alert(error instanceof Error ? error.message : "上传失败");
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
        <Field label="主图 URL">
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
        </label>
      </div>
      <Field label="轮播图片 URL">
        <Textarea name="images" onChange={(event) => setImages(event.target.value)} value={images} />
      </Field>
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
