import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const styles = {
  primary: "bg-brand text-white hover:bg-teal-800",
  secondary: "border border-line bg-white text-ink hover:bg-slate-50",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  ghost: "text-muted hover:bg-white"
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: keyof typeof styles;
}) {
  return (
    <Link
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
