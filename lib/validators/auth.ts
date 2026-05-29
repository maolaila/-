import { z } from "zod";

export const usernameSchema = z.string().trim().min(1, "账号不能为空").max(64, "账号最多 64 个字符");
export const passwordSchema = z.string().min(1, "密码不能为空").max(128, "密码最多 128 个字符");

export const registerSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  redirect: z.string().optional()
});

export const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: passwordSchema
});
