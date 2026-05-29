import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

function pepper() {
  return process.env.PASSWORD_PEPPER ?? "dev-password-pepper";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(`${password}${pepper()}`, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(`${password}${pepper()}`, hash);
}
