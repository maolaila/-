import "server-only";

import { getSql } from "@/db/client";
import type { ProductStatus, VariantStatus } from "@/db/schema";
import { sanitizeRichText } from "@/lib/sanitize";
import { productSchema, productStatusSchema, categorySchema } from "@/lib/validators/catalog";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isVisible: boolean;
  productCount?: number;
};

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  status: ProductStatus;
  tags: string[];
  mainImageUrl: string;
  categoryName: string;
  categorySlug: string;
  minPrice: string;
  maxPrice: string;
  totalStock: number;
  createdAt: string;
};

export type ProductVariant = {
  id: string;
  sku: string | null;
  optionValues: Record<string, string>;
  price: string;
  costPrice: string | null;
  stock: number;
  status: VariantStatus;
};

export type ProductImage = {
  id: string;
  url: string;
  storagePath: string | null;
  sortOrder: number;
};

export type ProductDetail = ProductCard & {
  sku: string | null;
  description: string | null;
  purchaseNote: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string;
  images: ProductImage[];
  variants: ProductVariant[];
};

const productSelect = `
  p.id,
  p.name,
  p.slug,
  p.summary,
  p.status,
  p.tags,
  p.main_image_url as "mainImageUrl",
  c.name as "categoryName",
  c.slug as "categorySlug",
  coalesce(min(v.price), 0)::text as "minPrice",
  coalesce(max(v.price), 0)::text as "maxPrice",
  coalesce(sum(case when v.status = 'active' then v.stock else 0 end), 0)::int as "totalStock",
  p.created_at::text as "createdAt"
`;

function publicOrderBy(sort: string | undefined) {
  switch (sort) {
    case "price_asc":
      return `"minPrice" asc, p.created_at desc`;
    case "price_desc":
      return `"maxPrice" desc, p.created_at desc`;
    default:
      return "p.created_at desc";
  }
}

export async function getVisibleCategories() {
  const sql = getSql();
  return sql<CategoryRow[]>`
    select
      c.id,
      c.name,
      c.slug,
      c.sort_order as "sortOrder",
      c.is_visible as "isVisible",
      count(p.id)::int as "productCount"
    from categories c
    left join products p on p.category_id = c.id and p.status = 'active'
    where c.is_visible = true
    group by c.id
    order by c.sort_order asc, c.created_at asc
  `;
}

export async function getAdminCategories() {
  const sql = getSql();
  return sql<CategoryRow[]>`
    select
      c.id,
      c.name,
      c.slug,
      c.sort_order as "sortOrder",
      c.is_visible as "isVisible",
      count(p.id)::int as "productCount"
    from categories c
    left join products p on p.category_id = c.id
    group by c.id
    order by c.sort_order asc, c.created_at asc
  `;
}

export async function createCategory(input: unknown) {
  const parsed = categorySchema.parse(input);
  const sql = getSql();
  const [row] = await sql<{ id: string }[]>`
    insert into categories (name, slug, sort_order, is_visible)
    values (${parsed.name}, ${parsed.slug}, ${parsed.sortOrder}, ${parsed.isVisible})
    returning id
  `;
  return row.id;
}

export async function updateCategory(id: string, input: unknown) {
  const parsed = categorySchema.parse(input);
  const sql = getSql();
  await sql`
    update categories
    set name = ${parsed.name},
        slug = ${parsed.slug},
        sort_order = ${parsed.sortOrder},
        is_visible = ${parsed.isVisible},
        updated_at = now()
    where id = ${id}
  `;
}

export async function deleteCategory(id: string) {
  const sql = getSql();
  const existing = await sql`select id from products where category_id = ${id} limit 1`;
  if (existing.length > 0) {
    throw new Error("分类下存在商品，不能删除，可改为隐藏");
  }
  await sql`delete from categories where id = ${id}`;
}

export async function getPublicProducts(params: {
  category?: string;
  q?: string;
  sort?: string;
  stock?: string;
  page?: number;
  pageSize?: number;
}) {
  const sql = getSql();
  const q = params.q?.trim().slice(0, 50) || null;
  const category = params.category?.trim() || null;
  const stock = params.stock ?? "all";
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(40, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  return sql<ProductCard[]>`
    select ${sql.unsafe(productSelect)}
    from products p
    join categories c on c.id = p.category_id
    left join product_variants v on v.product_id = p.id
    where p.status = 'active'
      and (${category}::text is null or c.slug = ${category})
      and (${q}::text is null or p.name ilike '%' || ${q} || '%' or coalesce(p.summary, '') ilike '%' || ${q} || '%')
    group by p.id, c.id
    having (
      ${stock} = 'all'
      or (${stock} = 'in_stock' and coalesce(sum(case when v.status = 'active' then v.stock else 0 end), 0) > 0)
      or (${stock} = 'sold_out' and coalesce(sum(case when v.status = 'active' then v.stock else 0 end), 0) = 0)
    )
    order by ${sql.unsafe(publicOrderBy(params.sort))}
    limit ${pageSize}
    offset ${offset}
  `;
}

export async function getHomeProducts() {
  const sql = getSql();
  const featured = await sql<ProductCard[]>`
    select ${sql.unsafe(productSelect)}
    from products p
    join categories c on c.id = p.category_id
    left join product_variants v on v.product_id = p.id
    where p.status = 'active'
    group by p.id, c.id
    order by case when '现货' = any(p.tags) then 0 else 1 end, p.created_at desc
    limit 8
  `;

  const latest = await sql<ProductCard[]>`
    select ${sql.unsafe(productSelect)}
    from products p
    join categories c on c.id = p.category_id
    left join product_variants v on v.product_id = p.id
    where p.status = 'active'
    group by p.id, c.id
    order by p.created_at desc
    limit 8
  `;

  return { featured, latest };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const sql = getSql();
  const rows = await sql<(ProductCard & {
    sku: string | null;
    description: string | null;
    purchaseNote: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    categoryId: string;
  })[]>`
    select
      ${sql.unsafe(productSelect)},
      p.sku,
      p.description,
      p.purchase_note as "purchaseNote",
      p.seo_title as "seoTitle",
      p.seo_description as "seoDescription",
      p.category_id as "categoryId"
    from products p
    join categories c on c.id = p.category_id
    left join product_variants v on v.product_id = p.id
    where p.slug = ${slug}
      and p.status = 'active'
    group by p.id, c.id
    limit 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const images = await sql<ProductImage[]>`
    select id, url, storage_path as "storagePath", sort_order as "sortOrder"
    from product_images
    where product_id = ${rows[0].id}
    order by sort_order asc, created_at asc
  `;

  const variants = await sql<ProductVariant[]>`
    select
      id,
      sku,
      option_values as "optionValues",
      price::text,
      cost_price::text as "costPrice",
      stock,
      status
    from product_variants
    where product_id = ${rows[0].id}
      and status = 'active'
    order by created_at asc
  `;

  return { ...rows[0], images, variants };
}

export async function getAdminProducts(params: {
  q?: string;
  categoryId?: string;
  status?: ProductStatus | "all";
}) {
  const sql = getSql();
  const q = params.q?.trim() || null;
  const categoryId = params.categoryId || null;
  const status = params.status && params.status !== "all" ? params.status : null;

  return sql<ProductCard[]>`
    select ${sql.unsafe(productSelect)}
    from products p
    join categories c on c.id = p.category_id
    left join product_variants v on v.product_id = p.id
    where (${q}::text is null or p.name ilike '%' || ${q} || '%' or coalesce(p.sku, '') ilike '%' || ${q} || '%')
      and (${categoryId}::uuid is null or p.category_id = ${categoryId})
      and (${status}::text is null or p.status = ${status})
    group by p.id, c.id
    order by p.updated_at desc
    limit 100
  `;
}

export async function getProductForAdmin(id: string): Promise<ProductDetail | null> {
  const sql = getSql();
  const rows = await sql<(ProductCard & {
    sku: string | null;
    description: string | null;
    purchaseNote: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    categoryId: string;
  })[]>`
    select
      ${sql.unsafe(productSelect)},
      p.sku,
      p.description,
      p.purchase_note as "purchaseNote",
      p.seo_title as "seoTitle",
      p.seo_description as "seoDescription",
      p.category_id as "categoryId"
    from products p
    join categories c on c.id = p.category_id
    left join product_variants v on v.product_id = p.id
    where p.id = ${id}
    group by p.id, c.id
    limit 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const images = await sql<ProductImage[]>`
    select id, url, storage_path as "storagePath", sort_order as "sortOrder"
    from product_images
    where product_id = ${id}
    order by sort_order asc, created_at asc
  `;

  const variants = await sql<ProductVariant[]>`
    select id, sku, option_values as "optionValues", price::text, cost_price::text as "costPrice", stock, status
    from product_variants
    where product_id = ${id}
    order by created_at asc
  `;

  return { ...rows[0], images, variants };
}

export async function createProduct(input: unknown) {
  const parsed = productSchema.parse(input);
  const sql = getSql();
  const description = sanitizeRichText(parsed.description);

  return sql.begin(async (tx) => {
    const [product] = await tx<{ id: string }[]>`
      insert into products (
        category_id, name, slug, sku, summary, description, purchase_note, status,
        tags, seo_title, seo_description, main_image_url
      )
      values (
        ${parsed.categoryId}, ${parsed.name}, ${parsed.slug}, ${parsed.sku || null},
        ${parsed.summary || null}, ${description || null}, ${parsed.purchaseNote || null},
        ${parsed.status}, ${parsed.tags}, ${parsed.seoTitle || null},
        ${parsed.seoDescription || null}, ${parsed.mainImageUrl}
      )
      returning id
    `;

    const imageUrls = [parsed.mainImageUrl, ...parsed.images.filter((url) => url !== parsed.mainImageUrl)].slice(0, 8);
    for (const [index, url] of imageUrls.entries()) {
      await tx`
        insert into product_images (product_id, url, sort_order)
        values (${product.id}, ${url}, ${(index + 1) * 10})
      `;
    }

    for (const variant of parsed.variants) {
      await tx`
        insert into product_variants (product_id, sku, option_values, price, cost_price, stock, status)
        values (
          ${product.id}, ${variant.sku || null}, ${tx.json(variant.optionValues)},
          ${variant.price.toFixed(2)}, ${variant.costPrice == null ? null : variant.costPrice.toFixed(2)},
          ${variant.stock}, ${variant.status}
        )
      `;
    }

    return product.id;
  });
}

export async function updateProduct(id: string, input: unknown) {
  const parsed = productSchema.parse(input);
  const sql = getSql();
  const description = sanitizeRichText(parsed.description);

  await sql.begin(async (tx) => {
    await tx`
      update products
      set category_id = ${parsed.categoryId},
          name = ${parsed.name},
          slug = ${parsed.slug},
          sku = ${parsed.sku || null},
          summary = ${parsed.summary || null},
          description = ${description || null},
          purchase_note = ${parsed.purchaseNote || null},
          status = ${parsed.status},
          tags = ${parsed.tags},
          seo_title = ${parsed.seoTitle || null},
          seo_description = ${parsed.seoDescription || null},
          main_image_url = ${parsed.mainImageUrl},
          updated_at = now()
      where id = ${id}
    `;

    await tx`delete from product_images where product_id = ${id}`;
    const imageUrls = [parsed.mainImageUrl, ...parsed.images.filter((url) => url !== parsed.mainImageUrl)].slice(0, 8);
    for (const [index, url] of imageUrls.entries()) {
      await tx`
        insert into product_images (product_id, url, sort_order)
        values (${id}, ${url}, ${(index + 1) * 10})
      `;
    }

    const existing = await tx<{ id: string }[]>`select id from product_variants where product_id = ${id}`;
    const keep = new Set<string>();
    for (const variant of parsed.variants) {
      if (variant.id) {
        keep.add(variant.id);
        await tx`
          update product_variants
          set sku = ${variant.sku || null},
              option_values = ${tx.json(variant.optionValues)},
              price = ${variant.price.toFixed(2)},
              cost_price = ${variant.costPrice == null ? null : variant.costPrice.toFixed(2)},
              stock = ${variant.stock},
              status = ${variant.status},
              updated_at = now()
          where id = ${variant.id}
            and product_id = ${id}
        `;
      } else {
        await tx`
          insert into product_variants (product_id, sku, option_values, price, cost_price, stock, status)
          values (
            ${id}, ${variant.sku || null}, ${tx.json(variant.optionValues)},
            ${variant.price.toFixed(2)}, ${variant.costPrice == null ? null : variant.costPrice.toFixed(2)},
            ${variant.stock}, ${variant.status}
          )
        `;
      }
    }

    for (const variant of existing) {
      if (keep.has(variant.id)) {
        continue;
      }
      const used = await tx`
        select id from cart_items where variant_id = ${variant.id} limit 1
        union all
        select id from order_items where variant_id = ${variant.id} limit 1
      `;
      if (used.length > 0) {
        await tx`update product_variants set status = 'inactive', updated_at = now() where id = ${variant.id}`;
      } else {
        await tx`delete from product_variants where id = ${variant.id}`;
      }
    }
  });
}

export async function updateProductStatus(id: string, input: unknown) {
  const parsed = productStatusSchema.parse(input);
  const sql = getSql();
  await sql`update products set status = ${parsed.status}, updated_at = now() where id = ${id}`;
}

export async function deleteProduct(id: string) {
  const sql = getSql();
  const used = await sql`select id from order_items where product_id = ${id} limit 1`;
  if (used.length > 0) {
    await sql`update products set status = 'inactive', updated_at = now() where id = ${id}`;
    return "inactivated";
  }
  await sql`delete from products where id = ${id}`;
  return "deleted";
}
