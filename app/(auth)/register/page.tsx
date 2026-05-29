import Link from "next/link";

import { RegisterForm } from "@/components/auth/auth-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const redirectTo = first(params.redirect) ?? "/";
  return (
    <>
      <h1 className="text-2xl font-semibold">注册</h1>
      <p className="mt-2 text-sm text-muted">账号不限制邮箱或手机号格式，系统按忽略大小写后的账号保持唯一。</p>
      <div className="mt-6">
        <RegisterForm redirectTo={redirectTo} />
      </div>
      <p className="mt-5 text-sm text-muted">
        已有账号？{" "}
        <Link className="font-medium text-brand" href={`/login?redirect=${encodeURIComponent(redirectTo)}`}>
          去登录
        </Link>
      </p>
    </>
  );
}
