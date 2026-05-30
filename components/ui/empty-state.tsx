import { PackageOpen } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="grid place-items-center rounded-md border border-dashed border-line bg-white px-6 py-14 text-center">
      <PackageOpen className="mb-3 h-8 w-8 text-muted" aria-hidden />
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link className="mt-5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-teal-800" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
