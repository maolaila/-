import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export type UserRole = "customer" | "admin";
export type UserStatus = "active" | "disabled";
export type ProductStatus = "draft" | "active" | "inactive";
export type VariantStatus = "active" | "inactive";
export type OrderStatus =
  | "pending_confirm"
  | "confirmed"
  | "purchasing"
  | "ready_to_ship"
  | "shipped"
  | "completed"
  | "cancelled"
  | "exception";
export type PaymentStatus =
  | "unpaid"
  | "deposit_paid"
  | "paid"
  | "need_extra_payment"
  | "refunded";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull(),
    normalizedUsername: text("normalized_username").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<UserRole>().notNull().default("customer"),
    status: text("status").$type<UserStatus>().notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true })
  },
  (table) => ({
    normalizedUsernameUnique: uniqueIndex("users_normalized_username_uidx").on(
      table.normalizedUsername
    )
  })
);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow()
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").notNull().default(100),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    slugUnique: uniqueIndex("categories_slug_uidx").on(table.slug)
  })
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sku: text("sku"),
    summary: text("summary"),
    description: text("description"),
    purchaseNote: text("purchase_note"),
    status: text("status").$type<ProductStatus>().notNull().default("draft"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    mainImageUrl: text("main_image_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    slugUnique: uniqueIndex("products_slug_uidx").on(table.slug)
  })
);

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  storagePath: text("storage_path"),
  sortOrder: integer("sort_order").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku"),
  optionValues: jsonb("option_values").$type<Record<string, string>>().notNull().default({}),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  status: text("status").$type<VariantStatus>().notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userVariantUnique: uniqueIndex("cart_items_user_variant_uidx").on(
      table.userId,
      table.variantId
    )
  })
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNo: text("order_no").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: text("status").$type<OrderStatus>().notNull().default("pending_confirm"),
    paymentStatus: text("payment_status").$type<PaymentStatus>().notNull().default("unpaid"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    receiverName: text("receiver_name").notNull(),
    receiverContact: text("receiver_contact").notNull(),
    receiverAddress: text("receiver_address").notNull(),
    userNote: text("user_note"),
    adminNote: text("admin_note"),
    publicNote: text("public_note"),
    shippingCompany: text("shipping_company"),
    shippingNo: text("shipping_no"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true })
  },
  (table) => ({
    orderNoUnique: uniqueIndex("orders_order_no_uidx").on(table.orderNo)
  })
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  productSlug: text("product_slug").notNull(),
  productImageUrl: text("product_image_url").notNull(),
  variantSnapshot: jsonb("variant_snapshot").$type<Record<string, string>>().notNull().default({}),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const orderStatusLogs = pgTable("order_status_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").$type<OrderStatus>().notNull(),
  operatorId: uuid("operator_id").references(() => users.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const userAddresses = pgTable("user_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverName: text("receiver_name").notNull(),
  receiverContact: text("receiver_contact").notNull(),
  receiverAddress: text("receiver_address").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
