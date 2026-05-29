import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ForbiddenFailure, requireAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    if (error instanceof ForbiddenFailure) {
      redirect("/");
    }
    throw error;
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
