import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: string | number, currency = "CNY") {
  const numeric = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatPriceRange(min: string | number, max: string | number, currency = "CNY") {
  const minValue = Number(min);
  const maxValue = Number(max);
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue === maxValue) {
    return formatMoney(min, currency);
  }
  return `${formatMoney(minValue, currency)} - ${formatMoney(maxValue, currency)}`;
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseTags(input: string | null | undefined) {
  if (!input) {
    return [];
  }
  return input
    .split(/[,\n，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function compactText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
