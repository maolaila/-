import bcrypt from "bcryptjs";

import { requiredSecret } from "@/lib/env";

const BCRYPT_ROUNDS = 12;

function pepper() {
  return requiredSecret("PASSWORD_PEPPER", "dev-password-pepper", 16);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(`${password}${pepper()}`, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(`${password}${pepper()}`, hash);
}
