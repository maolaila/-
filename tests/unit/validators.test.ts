import { describe, expect, it } from "vitest";

import { registerSchema } from "@/lib/validators/auth";
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
});
