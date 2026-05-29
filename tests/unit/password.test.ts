import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("stores verifiable hashes instead of plaintext", async () => {
    const hash = await hashPassword("secret");
    expect(hash).not.toContain("secret");
    await expect(verifyPassword("secret", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });
});
