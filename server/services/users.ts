import "server-only";

import { getSql } from "@/db/client";
import type { UserStatus } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { deleteUserSessions } from "@/server/auth";

export type CustomerRow = {
  id: string;
  username: string;
  normalizedUsername: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  orderCount: number;
  totalSpent: string;
};

export async function getCustomers(q?: string) {
  const sql = getSql();
  const keyword = q?.trim() || null;
  return sql<CustomerRow[]>`
    select
      u.id,
      u.username,
      u.normalized_username as "normalizedUsername",
      u.status,
      u.created_at::text as "createdAt",
      u.last_login_at::text as "lastLoginAt",
      count(o.id)::int as "orderCount",
      coalesce(sum(o.total_amount), 0)::text as "totalSpent"
    from users u
    left join orders o on o.user_id = u.id
    where u.role = 'customer'
      and (${keyword}::text is null or u.username ilike '%' || ${keyword} || '%')
    group by u.id
    order by u.created_at desc
    limit 100
  `;
}

export async function setCustomerStatus(id: string, status: UserStatus) {
  const sql = getSql();
  await sql`update users set status = ${status}, updated_at = now() where id = ${id} and role = 'customer'`;
  if (status === "disabled") {
    await deleteUserSessions(id);
  }
}

export async function resetCustomerPassword(input: unknown) {
  const parsed = resetPasswordSchema.parse(input);
  const passwordHash = await hashPassword(parsed.password);
  const sql = getSql();
  await sql`
    update users
    set password_hash = ${passwordHash}, updated_at = now()
    where id = ${parsed.userId}
      and role = 'customer'
  `;
  await deleteUserSessions(parsed.userId);
}
