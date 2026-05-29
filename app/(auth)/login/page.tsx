import Link from "next/link";

import { LoginForm } from "@/components/auth/auth-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const redirectTo = first(params.redirect) ?? "/";
  return (
    <>
      <h1 className="text-2xl font-semibold">登录</h1>
      <p className="mt-2 text-sm text-muted">登录后可加入购物车、提交订单和查看订单状态。</p>
      <div className="mt-6">
        <LoginForm redirectTo={redirectTo} />
      </div>
      <p className="mt-5 text-sm text-muted">
        还没有账号？{" "}
        <Link className="font-medium text-brand" href={`/register?redirect=${encodeURIComponent(redirectTo)}`}>
          立即注册
        </Link>
      </p>
    </>
  );
}
