import { Ban, CheckCircle2 } from "lucide-react";

import { setCustomerStatusAction } from "@/app/admin/actions";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { getCustomers } from "@/server/services/users";
import { getSiteSettings } from "@/server/services/settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [users, settings] = await Promise.all([getCustomers(first(params.q)), getSiteSettings()]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">顾客管理</h1>
        <p className="mt-1 text-sm text-muted">查看顾客、禁用账号、启用账号和重置密码。</p>
      </div>
      <form className="grid gap-3 rounded-md border border-line bg-white p-4 md:grid-cols-[1fr_auto]">
        <input className="h-10 rounded-md border border-line px-3" defaultValue={first(params.q) ?? ""} name="q" placeholder="搜索账号" />
        <Button>搜索</Button>
      </form>
      <section className="overflow-auto rounded-md border border-line bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-wash text-muted">
            <tr>
              <th className="px-4 py-3">账号</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">订单数</th>
              <th className="px-4 py-3">消费金额</th>
              <th className="px-4 py-3">注册时间</th>
              <th className="px-4 py-3">最近登录</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-t border-line" key={user.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-xs text-muted">{user.normalizedUsername}</div>
                </td>
                <td className="px-4 py-3">{user.status === "active" ? "正常" : "禁用"}</td>
                <td className="px-4 py-3">{user.orderCount}</td>
                <td className="px-4 py-3">{formatMoney(user.totalSpent, settings.currency)}</td>
                <td className="px-4 py-3">{formatDateTime(user.createdAt)}</td>
                <td className="px-4 py-3">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "-"}</td>
                <td className="px-4 py-3">
                  <div className="grid gap-2">
                    <div className="flex gap-2">
                      <form action={setCustomerStatusAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="status" value={user.status === "active" ? "disabled" : "active"} />
                        <Button className="h-9 px-3" type="submit" variant={user.status === "active" ? "danger" : "secondary"}>
                          {user.status === "active" ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          {user.status === "active" ? "禁用" : "启用"}
                        </Button>
                      </form>
                    </div>
                    <ResetPasswordForm userId={user.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
