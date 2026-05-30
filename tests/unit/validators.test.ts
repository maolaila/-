import { describe, expect, it } from "vitest";

import { registerSchema } from "@/lib/validators/auth";
import { productSchema } from "@/lib/validators/catalog";
import { checkoutSchema } from "@/lib/validators/order";
import { normalizeUsername } from "@/lib/utils";

describe("validators", () => {
  it("normalizes usernames case-insensitively", () => {
    expect(normalizeUsername(" Alice ")).toBe("alice");
  });

  it("accepts arbitrary account formats within length", () => {
    expect(registerSchema.parse({
      username: "任意账号#001",
      password: "p",
      confirmPassword: "p"
    }).username).toBe("任意账号#001");
  });

  it("rejects overlong credentials and mismatched confirmation", () => {
    expect(() => registerSchema.parse({
      username: "a".repeat(65),
      password: "p",
      confirmPassword: "p"
    })).toThrow();
    expect(() => registerSchema.parse({
      username: "alice",
      password: "one",
      confirmPassword: "two"
    })).toThrow();
  });

  it("requires at least one cart item for checkout", () => {
    expect(() => checkoutSchema.parse({
      cartItemIds: [],
      receiverName: "张三",
      receiverContact: "13800000000",
      receiverAddress: "地址"
    })).toThrow();
  });

  it("accepts local uploaded product image paths", () => {
    const parsed = productSchema.parse({
      name: "本地上传商品",
      slug: "local-upload-product",
      categoryId: "00000000-0000-4000-8000-000000000001",
      status: "active",
      mainImageUrl: "/uploads/products/2026/05/example-thumb.webp",
      images: Array.from({ length: 12 }, (_, index) => `/uploads/products/2026/05/detail-${index}.webp`),
      variants: [
        {
          optionValues: { 规格: "默认" },
          price: 12.5,
          stock: 1,
          status: "active"
        }
      ]
    });

    expect(parsed.mainImageUrl).toBe("/uploads/products/2026/05/example-thumb.webp");
    expect(parsed.images).toHaveLength(12);
  });
});
