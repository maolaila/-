import { z } from "zod";

export const siteSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(80),
  announcement: z.string().trim().max(500).default(""),
  contact: z.string().trim().max(200).default(""),
  currency: z.string().trim().min(3).max(3).default("CNY"),
  orderNotice: z.string().trim().max(1000).default(""),
  afterSaleNotice: z.string().trim().max(1000).default(""),
  allowPendingCancel: z.coerce.boolean().default(true)
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
