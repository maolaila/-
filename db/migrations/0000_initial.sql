create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null check (char_length(username) between 1 and 64),
  normalized_username text not null unique,
  password_hash text not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_expires_at_idx on sessions(expires_at);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  slug text not null unique,
  sort_order int not null default 100,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique,
  sku text,
  summary text check (summary is null or char_length(summary) <= 300),
  description text check (description is null or char_length(description) <= 5000),
  purchase_note text check (purchase_note is null or char_length(purchase_note) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive')),
  tags text[] not null default array[]::text[],
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 160),
  main_image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on products(category_id);
create index if not exists products_status_idx on products(status);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on product_images(product_id);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text,
  option_values jsonb not null default '{}'::jsonb,
  price numeric(12,2) not null check (price >= 0),
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  stock int not null default 0 check (stock >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on product_variants(product_id);
create index if not exists product_variants_stock_idx on product_variants(stock);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity int not null check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, variant_id)
);

create index if not exists cart_items_user_id_idx on cart_items(user_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  user_id uuid not null references users(id) on delete restrict,
  status text not null default 'pending_confirm' check (status in ('pending_confirm','confirmed','purchasing','ready_to_ship','shipped','completed','cancelled','exception')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','deposit_paid','paid','need_extra_payment','refunded')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  receiver_name text not null check (char_length(receiver_name) between 1 and 50),
  receiver_contact text not null check (char_length(receiver_contact) between 1 and 100),
  receiver_address text not null check (char_length(receiver_address) between 1 and 300),
  user_note text check (user_note is null or char_length(user_note) <= 500),
  admin_note text,
  public_note text,
  shipping_company text,
  shipping_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_payment_status_idx on orders(payment_status);
create index if not exists orders_created_at_idx on orders(created_at desc);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name text not null,
  product_slug text not null,
  product_image_url text not null,
  variant_snapshot jsonb not null default '{}'::jsonb,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on order_items(order_id);
create index if not exists order_items_product_id_idx on order_items(product_id);

create table if not exists order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('pending_confirm','confirmed','purchasing','ready_to_ship','shipped','completed','cancelled','exception')),
  operator_id uuid references users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_logs_order_id_idx on order_status_logs(order_id);

create table if not exists user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  receiver_name text not null,
  receiver_contact text not null,
  receiver_address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
