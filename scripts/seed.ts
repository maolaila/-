import "./load-env";

import bcrypt from "bcryptjs";
import postgres from "postgres";

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DIRECT_DATABASE_URL is required.");
}

const isProduction = process.env.NODE_ENV === "production";
const pepper = process.env.PASSWORD_PEPPER ?? (isProduction ? "" : "dev-password-pepper");
const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
const allowInsecureSeedDefaults = process.env.ALLOW_INSECURE_SEED_DEFAULTS === "true";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? (allowInsecureSeedDefaults ? "admin123456" : "");
const seedDemoData = process.env.SEED_DEMO_DATA === "true";

if (pepper.length < 16) {
  throw new Error("PASSWORD_PEPPER must be set to at least 16 characters before seeding.");
}

if (!adminPassword || (!allowInsecureSeedDefaults && adminPassword === "admin123456")) {
  throw new Error(
    "SEED_ADMIN_PASSWORD must be set to a strong non-default value before seeding. For local demos only, set ALLOW_INSECURE_SEED_DEFAULTS=true."
  );
}
const sql = postgres(databaseUrl, { max: 1, prepare: false });

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

async function hashPassword(password: string) {
  return bcrypt.hash(`${password}${pepper}`, 12);
}

async function main() {
  const adminHash = await hashPassword(adminPassword);

  await sql`
    insert into users (username, normalized_username, password_hash, role, status)
    values (${adminUsername}, ${adminUsername.trim().toLowerCase()}, ${adminHash}, 'admin', 'active')
    on conflict (normalized_username) do nothing
  `;

  await sql`
    insert into site_settings (key, value)
    values (
      'site',
      ${sql.json({
        storeName: "Light Commerce",
        announcement: "小批量现货与预订商品，订单提交后由客服确认付款和发货。",
        contact: "service@example.com",
        currency: "CNY",
        orderNotice: "提交订单后请等待管理员确认，系统不接入在线支付。",
        afterSaleNotice: "签收后 7 天内如有质量问题请联系售后。",
        allowPendingCancel: true
      })}
    )
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;

  if (!seedDemoData) {
    console.log("seed complete: admin and site settings only");
    return;
  }

  const customerHash = await hashPassword("customer123");
  await sql`
    insert into users (username, normalized_username, password_hash, role, status)
    values ('customer', 'customer', ${customerHash}, 'customer', 'active')
    on conflict (normalized_username) do nothing
  `;

  const categoryRows = await sql<{ id: string; slug: string }[]>`
    insert into categories (name, slug, sort_order, is_visible)
    values
      ('日用好物', 'daily-goods', 10, true),
      ('美妆个护', 'beauty-care', 20, true),
      ('数码配件', 'digital-accessories', 30, true)
    on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, is_visible = excluded.is_visible
    returning id, slug
  `;

  const categories = new Map(categoryRows.map((row) => [row.slug, row.id]));
  const products = [
    {
      category: "daily-goods",
      name: "便携保温杯",
      slug: "portable-thermal-cup",
      sku: "LC-CUP-001",
      summary: "轻量杯身，适合通勤与旅行。",
      description: "<p>316 不锈钢内胆，杯盖防漏，适合咖啡、茶饮和日常饮水。</p>",
      purchaseNote: "现货商品通常 48 小时内安排发货。",
      tags: ["现货", "新品"],
      seoTitle: "便携保温杯 - Light Commerce",
      seoDescription: "轻量便携保温杯，适合通勤与旅行。",
      mainImageUrl: image("photo-1526406915894-7bcd65f60845"),
      price: "89.00",
      stock: 18,
      optionValues: { 颜色: "雾白", 容量: "450ml" }
    },
    {
      category: "beauty-care",
      name: "温和洁面乳",
      slug: "gentle-cleanser",
      sku: "LC-CLEAN-001",
      summary: "低刺激配方，适合日常清洁。",
      description: "<p>泡沫细腻，洗后不紧绷。敏感肌请先小面积试用。</p>",
      purchaseNote: "护肤品拆封后非质量问题不退换。",
      tags: ["现货"],
      seoTitle: "温和洁面乳 - Light Commerce",
      seoDescription: "低刺激温和洁面乳，适合日常清洁。",
      mainImageUrl: image("photo-1556228720-195a672e8a03"),
      price: "68.00",
      stock: 7,
      optionValues: { 规格: "120g" }
    },
    {
      category: "digital-accessories",
      name: "多口快充插头",
      slug: "multi-port-fast-charger",
      sku: "LC-CHG-001",
      summary: "USB-C 与 USB-A 多设备同时充电。",
      description: "<p>支持常见快充协议，适合手机、耳机和平板日常补电。</p>",
      purchaseNote: "电器类商品请确认接口和功率需求后下单。",
      tags: ["预订"],
      seoTitle: "多口快充插头 - Light Commerce",
      seoDescription: "多口快充插头，支持多设备同时充电。",
      mainImageUrl: image("photo-1609091839311-d5365f9ff1c5"),
      price: "129.00",
      stock: 0,
      optionValues: { 颜色: "黑色", 功率: "65W" }
    }
  ];

  for (const product of products) {
    const categoryId = categories.get(product.category);
    if (!categoryId) {
      throw new Error(`Missing category ${product.category}`);
    }

    const [row] = await sql<{ id: string }[]>`
      insert into products (
        category_id, name, slug, sku, summary, description, purchase_note, status,
        tags, seo_title, seo_description, main_image_url
      )
      values (
        ${categoryId}, ${product.name}, ${product.slug}, ${product.sku}, ${product.summary},
        ${product.description}, ${product.purchaseNote}, 'active', ${product.tags},
        ${product.seoTitle}, ${product.seoDescription}, ${product.mainImageUrl}
      )
      on conflict (slug) do update set
        name = excluded.name,
        sku = excluded.sku,
        summary = excluded.summary,
        description = excluded.description,
        purchase_note = excluded.purchase_note,
        status = excluded.status,
        tags = excluded.tags,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        main_image_url = excluded.main_image_url,
        updated_at = now()
      returning id
    `;

    const variantSku = `${product.sku}-DEFAULT`;
    await sql`delete from product_variants where product_id = ${row.id} and sku = ${variantSku}`;
    await sql`
      insert into product_variants (product_id, sku, option_values, price, stock, status)
      values (${row.id}, ${variantSku}, ${sql.json(product.optionValues)}, ${product.price}, ${product.stock}, 'active')
    `;

    await sql`delete from product_images where product_id = ${row.id} and url = ${product.mainImageUrl}`;
    await sql`
      insert into product_images (product_id, url, sort_order)
      values (${row.id}, ${product.mainImageUrl}, 10)
    `;
  }

  console.log("seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
