import "server-only";

import { getSql } from "@/db/client";
import { siteSettingsSchema, type SiteSettings } from "@/lib/validators/settings";

export const defaultSiteSettings: SiteSettings = {
  storeName: "Light Commerce",
  announcement: "小批量商品现货和预订，订单提交后由管理员确认。",
  contact: "service@example.com",
  currency: "CNY",
  orderNotice: "系统不接入在线支付，请等待管理员确认付款方式。",
  afterSaleNotice: "如需售后请联系店铺客服。",
  allowPendingCancel: true
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const sql = getSql();
  const rows = await sql<{ value: unknown }[]>`select value from site_settings where key = 'site' limit 1`;
  if (rows.length === 0) {
    return defaultSiteSettings;
  }
  return siteSettingsSchema.parse({ ...defaultSiteSettings, ...(rows[0].value as object) });
}

export async function updateSiteSettings(input: unknown) {
  const settings = siteSettingsSchema.parse(input);
  const sql = getSql();
  await sql`
    insert into site_settings (key, value, updated_at)
    values ('site', ${sql.json(settings)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
  return settings;
}
