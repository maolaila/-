"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { errorState } from "@/lib/action-state";
import { compactText } from "@/lib/utils";
import { clearCurrentSession, loginUser, registerCustomer } from "@/server/auth";

function safeRedirect(value: string | null, fallback: string) {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return fallback;
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const redirectTo = safeRedirect(compactText(formData.get("redirect")), "/");
  try {
    await registerCustomer({
      username: formData.get("username"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword")
    });
  } catch (error) {
    return errorState(error);
  }
  redirect(redirectTo);
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const redirectTo = safeRedirect(compactText(formData.get("redirect")), "/");
  try {
    await loginUser({
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: redirectTo
    });
  } catch (error) {
    return errorState(error);
  }
  redirect(redirectTo);
}

export async function adminLoginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await loginUser(
      {
        username: formData.get("username"),
        password: formData.get("password"),
        redirect: "/admin"
      },
      "admin"
    );
  } catch (error) {
    return errorState(error);
  }
  redirect("/admin");
}

export async function logoutAction() {
  await clearCurrentSession();
  revalidatePath("/", "layout");
  redirect("/");
}
