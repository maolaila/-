"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ProductStatus, UserStatus } from "@/db/schema";
import type { ActionState } from "@/lib/action-state";
import { errorState } from "@/lib/action-state";
import { compactText, parseTags, toSlug } from "@/lib/utils";
import { requireAdmin } from "@/server/auth";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateCategory,
  updateProduct,
  updateProductStatus
} from "@/server/services/catalog";
import {
  updateOrderNotes,
  updateOrderStatus,
  updatePaymentStatus,
  updateShipping
} from "@/server/services/orders";
import { updateSiteSettings } from "@/server/services/settings";
import { resetCustomerPassword, setCustomerStatus } from "@/server/services/users";

function productInput(formData: FormData) {
  const variantsRaw = compactText(formData.get("variantsJson"));
  const imagesRaw = compactText(formData.get("images"));
  const name = compactText(formData.get("name"));
  const slug = compactText(formData.get("slug"));
  return {
    name,
    slug: slug || autoProductSlug(name),
    categoryId: compactText(formData.get("categoryId")),
    sku: compactText(formData.get("sku")) || null,
    summary: compactText(formData.get("summary")) || null,
    description: String(formData.get("description") ?? ""),
    purchaseNote: String(formData.get("purchaseNote") ?? ""),
    status: compactText(formData.get("status")),
    tags: parseTags(compactText(formData.get("tags"))),
    seoTitle: compactText(formData.get("seoTitle")) || null,
    seoDescription: compactText(formData.get("seoDescription")) || null,
    mainImageUrl: compactText(formData.get("mainImageUrl")),
    images: imagesRaw ? imagesRaw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) : [],
    variants: variantsRaw ? JSON.parse(variantsRaw) : []
  };
}

function autoProductSlug(name: string) {
  return autoSlug(name, "product", 100);
}

function autoCategorySlug(name: string) {
  return autoSlug(name, "category", 80);
}

function autoSlug(name: string, fallback: string, maxLength: number) {
  const suffix = Date.now().toString(36);
  const maxBaseLength = Math.max(1, maxLength - suffix.length - 1);
  const base = toSlug(name).slice(0, maxBaseLength) || fallback;
  return `${base}-${suffix}`.slice(0, maxLength);
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = compactText(formData.get("name"));
  const slug = compactText(formData.get("slug"));
  await createCategory({
    name,
    slug: slug || autoCategorySlug(name),
    sortOrder: formData.get("sortOrder"),
    isVisible: formData.get("isVisible") === "on"
  });
  revalidatePath("/admin/categories");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = compactText(formData.get("name"));
  const slug = compactText(formData.get("slug"));
  await updateCategory(compactText(formData.get("id")), {
    name,
    slug: slug || autoCategorySlug(name),
    sortOrder: formData.get("sortOrder"),
    isVisible: formData.get("isVisible") === "on"
  });
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  await deleteCategory(compactText(formData.get("id")));
  revalidatePath("/admin/categories");
}

export async function createProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  let id: string;
  try {
    id = await createProduct(productInput(formData));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/admin/products");
  redirect(`/admin/products/${id}`);
}

export async function updateProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = compactText(formData.get("id"));
  try {
    await updateProduct(id, productInput(formData));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: true, message: "商品已保存" };
}

export async function productStatusAction(formData: FormData) {
  await requireAdmin();
  await updateProductStatus(compactText(formData.get("id")), {
    status: compactText(formData.get("status")) as ProductStatus
  });
  revalidatePath("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  await deleteProduct(compactText(formData.get("id")));
  revalidatePath("/admin/products");
}

export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = compactText(formData.get("id"));
  await updateOrderStatus(admin.id, id, {
    status: compactText(formData.get("status")),
    note: compactText(formData.get("note"))
  });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function updatePaymentStatusAction(formData: FormData) {
  await requireAdmin();
  const id = compactText(formData.get("id"));
  await updatePaymentStatus(id, {
    paymentStatus: compactText(formData.get("paymentStatus")),
    note: compactText(formData.get("note"))
  });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function updateShippingAction(formData: FormData) {
  await requireAdmin();
  const id = compactText(formData.get("id"));
  await updateShipping(id, {
    shippingCompany: compactText(formData.get("shippingCompany")),
    shippingNo: compactText(formData.get("shippingNo"))
  });
  revalidatePath(`/admin/orders/${id}`);
}

export async function updateOrderNotesAction(formData: FormData) {
  await requireAdmin();
  const id = compactText(formData.get("id"));
  await updateOrderNotes(id, {
    adminNote: compactText(formData.get("adminNote")),
    publicNote: compactText(formData.get("publicNote"))
  });
  revalidatePath(`/admin/orders/${id}`);
}

export async function setCustomerStatusAction(formData: FormData) {
  await requireAdmin();
  await setCustomerStatus(
    compactText(formData.get("id")),
    compactText(formData.get("status")) as UserStatus
  );
  revalidatePath("/admin/users");
}

export async function resetCustomerPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  try {
    await resetCustomerPassword({
      userId: compactText(formData.get("userId")),
      password: formData.get("password")
    });
    revalidatePath("/admin/users");
    return { ok: true, message: "密码已重置，旧 session 已失效" };
  } catch (error) {
    return errorState(error);
  }
}

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  try {
    await updateSiteSettings({
      storeName: compactText(formData.get("storeName")),
      announcement: compactText(formData.get("announcement")),
      contact: compactText(formData.get("contact")),
      currency: compactText(formData.get("currency")),
      orderNotice: compactText(formData.get("orderNotice")),
      afterSaleNotice: compactText(formData.get("afterSaleNotice")),
      allowPendingCancel: formData.get("allowPendingCancel") === "on"
    });
    revalidatePath("/", "layout");
    return { ok: true, message: "站点配置已保存" };
  } catch (error) {
    return errorState(error);
  }
}
