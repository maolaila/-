export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-wash px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-soft">{children}</div>
    </main>
  );
}
