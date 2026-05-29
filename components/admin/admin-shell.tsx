import { Boxes, ClipboardList, Gauge, LogOut, Settings, Tags, Users } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/server/auth";

const links = [
  { href: "/admin", label: "数据概览", icon: Gauge },
  { href: "/admin/products", label: "商品管理", icon: Boxes },
  { href: "/admin/categories", label: "分类管理", icon: Tags },
  { href: "/admin/orders", label: "订单管理", icon: ClipboardList },
  { href: "/admin/users", label: "顾客管理", icon: Users },
  { href: "/admin/settings", label: "站点配置", icon: Settings }
];

export function AdminShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-wash lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-30 border-b border-line bg-white lg:static lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 border-b border-line p-4 lg:block">
          <Link href="/admin" className="text-lg font-bold">
            Light Admin
          </Link>
          <p className="mt-1 shrink-0 text-xs text-muted">{user.username}</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto p-3 lg:grid lg:gap-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-wash hover:text-ink lg:gap-3"
                href={item.href}
                key={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
          <Link className="text-sm font-medium text-brand" href="/">
            返回前台
          </Link>
          <form action={logoutAction}>
            <Button className="h-9 px-3" variant="secondary">
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </form>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
