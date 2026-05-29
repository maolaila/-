import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "分类名称不能为空").max(50, "分类名称最多 50 个字符"),
  slug: z.string().trim().min(1, "Slug 不能为空").max(80, "Slug 最多 80 个字符"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(100),
  isVisible: z.coerce.boolean().default(true)
});

export const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().max(80).optional().nullable(),
  optionValues: z.record(z.string()).default({}),
  price: z.coerce.number().min(0, "售价不能小于 0"),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0, "库存不能小于 0"),
  status: z.enum(["active", "inactive"]).default("active")
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "商品名称不能为空").max(120, "商品名称最多 120 个字符"),
  slug: z.string().trim().min(1, "Slug 不能为空").max(100, "Slug 最多 100 个字符"),
  categoryId: z.string().uuid("请选择分类"),
  sku: z.string().trim().max(80).optional().nullable(),
  summary: z.string().trim().max(300, "简介最多 300 个字符").optional().nullable(),
  description: z.string().max(5000, "详情最多 5000 个字符").optional().nullable(),
  purchaseNote: z.string().max(2000, "购买说明最多 2000 个字符").optional().nullable(),
  status: z.enum(["draft", "active", "inactive"]),
  tags: z.array(z.string().trim().min(1)).max(12).default([]),
  seoTitle: z.string().trim().max(70, "SEO 标题最多 70 个字符").optional().nullable(),
  seoDescription: z.string().trim().max(160, "SEO 描述最多 160 个字符").optional().nullable(),
  mainImageUrl: z.string().trim().url("主图必须是有效 URL"),
  images: z.array(z.string().trim().url()).max(8).default([]),
  variants: z.array(variantInputSchema).min(1, "至少需要一个规格")
});

export const productStatusSchema = z.object({
  status: z.enum(["draft", "active", "inactive"])
});
