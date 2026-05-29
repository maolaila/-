import type { MetadataRoute } from "next";

import { getPublicProducts } from "@/server/services/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const products = await getPublicProducts({ pageSize: 500 });
  return [
    {
      url: baseUrl,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date()
    },
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: new Date(product.createdAt)
    }))
  ];
}
