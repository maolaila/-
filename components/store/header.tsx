import { LogOut, Search, ShoppingCart, UserRound } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth";
import { getCartItems } from "@/server/services/cart";
import { getVisibleCategories } from "@/server/services/catalog";
import { getSiteSettings } from "@/server/services/settings";

export async function StoreHeader() {
  const [user, categories, settings] = await Promise.all([getCurrentUser(), getVisibleCategories(), getSiteSettings()]);
  const cartCount = user ? (await getCartItems(user.id)).reduce((sum, item) => sum + item.quantity, 0) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4">
        <Link href="/" className="min-w-0 flex-1 text-base font-bold tracking-normal text-ink sm:text-lg md:flex-none">
          {settings.storeName}
        </Link>
        <nav className="hidden min-w-0 items-center gap-1 md:flex">
          <Link className="shrink-0 rounded-md px-3 py-2 text-sm text-muted hover:bg-wash hover:text-ink" href="/products">
            全部商品
          </Link>
          {categories.slice(0, 4).map((category) => (
            <Link
              className="max-w-24 truncate rounded-md px-3 py-2 text-sm text-muted hover:bg-wash hover:text-ink"
              href={`/products?category=${category.slug}`}
              key={category.id}
              title={category.name}
            >
              {category.name}
            </Link>
          ))}
        </nav>
        <form action="/products" className="ml-auto hidden w-full max-w-xs items-center gap-2 rounded-md border border-line bg-wash px-3 md:flex">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          <input
            name="q"
            aria-label="搜索商品"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="搜索商品"
            maxLength={50}
          />
        </form>
        <Link className="relative shrink-0 rounded-md p-2 hover:bg-wash" href="/cart" aria-label="购物车">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-semibold text-white">
              {cartCount}
            </span>
          ) : null}
        </Link>
        {user ? (
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link className="rounded-md p-2 hover:bg-wash" href="/orders" aria-label="我的订单">
              <UserRound className="h-5 w-5" />
            </Link>
            <form action={logoutAction}>
              <Button variant="ghost" className="h-9 px-2" title="退出">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <Link className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-brand hover:bg-teal-50" href="/login">
            登录
          </Link>
        )}
      </div>
      <div className="border-t border-line px-3 py-2 md:hidden">
        <form action="/products" className="flex h-10 items-center gap-2 rounded-md border border-line bg-wash px-3">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            name="q"
            aria-label="搜索商品"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="搜索商品"
            maxLength={50}
          />
        </form>
        <nav className="mt-2 flex gap-2 overflow-x-auto pb-1">
          <Link className="shrink-0 rounded-md bg-wash px-3 py-2 text-sm text-ink" href="/products">
            全部商品
          </Link>
          {categories.slice(0, 8).map((category) => (
            <Link
              className="shrink-0 rounded-md px-3 py-2 text-sm text-muted hover:bg-wash hover:text-ink"
              href={`/products?category=${category.slug}`}
              key={category.id}
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
