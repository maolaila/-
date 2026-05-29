import { LoginForm } from "@/components/auth/auth-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-wash px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-semibold">后台登录</h1>
        <p className="mt-2 text-sm text-muted">仅管理员账号可进入后台。</p>
        <div className="mt-6">
          <LoginForm admin redirectTo="/admin" />
        </div>
      </div>
    </main>
  );
}
