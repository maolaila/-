"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "newest", label: "最新" },
  { value: "price_asc", label: "价格从低到高" },
  { value: "price_desc", label: "价格从高到低" }
];

const stockOptions = [
  { value: "all", label: "全部库存" },
  { value: "in_stock", label: "有货" },
  { value: "sold_out", label: "售罄" }
];

type FilterValues = {
  category: string;
  q: string;
  sort: string;
  stock: string;
};

export function ProductFilterBar({ values }: { values: FilterValues }) {
  const router = useRouter();
  const [mobileQuery, setMobileQuery] = useState(values.q);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const normalized = useMemo(
    () => ({
      category: values.category,
      q: values.q,
      sort: values.sort || "newest",
      stock: values.stock || "all"
    }),
    [values]
  );
  const activeFilterCount = Number(normalized.sort !== "newest") + Number(normalized.stock !== "all");
  const filterLabel = `${labelFor(sortOptions, normalized.sort)} · ${labelFor(stockOptions, normalized.stock)}`;

  function openSheet() {
    setSheetVisible(true);
    window.requestAnimationFrame(() => setSheetOpen(true));
  }

  function closeSheet() {
    setSheetOpen(false);
    window.setTimeout(() => setSheetVisible(false), 180);
  }

  function applyFilters(updates: Partial<FilterValues>) {
    const next = {
      ...normalized,
      q: mobileQuery,
      ...updates
    };
    router.replace(productsHref(next));
    closeSheet();
  }

  function submitMobileSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters({ q: mobileQuery });
  }

  return (
    <>
      <form
        className="mb-5 hidden gap-2 rounded-md border border-line bg-white p-3 md:grid md:grid-cols-[minmax(220px,1fr)_150px_150px_auto] md:items-center"
        action="/products"
      >
        <input name="category" type="hidden" value={normalized.category} />
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-line px-3 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-teal-100">
          <Search className="h-4 w-4 text-muted" />
          <input
            className="min-w-0 flex-1 outline-none"
            defaultValue={normalized.q}
            maxLength={50}
            name="q"
            placeholder="商品名称或简介"
          />
        </label>
        <Select defaultValue={normalized.sort} name="sort">
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select defaultValue={normalized.stock} name="stock">
          {stockOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <button className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-white transition hover:bg-teal-800 active:scale-[0.98]" type="submit">
          筛选
        </button>
      </form>

      <div className="mb-5 flex gap-2 md:hidden">
        <form className="min-w-0 flex-1" onSubmit={submitMobileSearch}>
          <label className="flex h-11 min-w-0 items-center gap-2 rounded-md border border-line bg-white px-3 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-teal-100">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              maxLength={50}
              onChange={(event) => setMobileQuery(event.target.value)}
              placeholder="搜索商品"
              value={mobileQuery}
            />
          </label>
        </form>
        <button
          className="relative inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink transition hover:bg-wash active:scale-[0.98]"
          onClick={openSheet}
          type="button"
        >
          <SlidersHorizontal className="h-4 w-4" />
          筛选
          {activeFilterCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {sheetVisible ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="关闭筛选"
            className={cn("absolute inset-0 bg-black/40 transition-opacity duration-200", sheetOpen ? "opacity-100" : "opacity-0")}
            onClick={closeSheet}
            type="button"
          />
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-[0_-18px_60px_rgba(15,23,42,0.22)] transition-transform duration-200 ease-out",
              sheetOpen ? "translate-y-0" : "translate-y-full"
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">筛选商品</h2>
                <p className="mt-1 text-xs text-muted">{filterLabel}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-md hover:bg-wash" onClick={closeSheet} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>

            <FilterGroup
              currentValue={normalized.sort}
              label="排序"
              onSelect={(sort) => applyFilters({ sort })}
              options={sortOptions}
            />
            <FilterGroup
              className="mt-5"
              currentValue={normalized.stock}
              label="库存"
              onSelect={(stock) => applyFilters({ stock })}
              options={stockOptions}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterGroup({
  className,
  currentValue,
  label,
  onSelect,
  options
}: {
  className?: string;
  currentValue: string;
  label: string;
  onSelect: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <section className={className}>
      <h3 className="mb-2 text-sm font-medium text-ink">{label}</h3>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            className={cn(
              "h-11 rounded-md border px-3 text-sm font-medium transition active:scale-[0.98]",
              currentValue === option.value
                ? "border-brand bg-teal-50 text-brand"
                : "border-line bg-white text-ink hover:border-brand"
            )}
            key={option.value}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function productsHref(values: FilterValues) {
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(values)) {
    const value = raw.trim();
    if (value && value !== "newest" && value !== "all") {
      query.set(key, value);
    }
  }
  const queryString = query.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

function labelFor(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? options[0].label;
}
