import { PackageOpen } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="grid place-items-center rounded-md border border-dashed border-line bg-white px-6 py-14 text-center">
      <PackageOpen className="mb-3 h-8 w-8 text-muted" aria-hidden />
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
    </div>
  );
}
