import { getSiteSettings } from "@/server/services/settings";

export async function StoreFooter() {
  const settings = await getSiteSettings();
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-8 text-sm text-muted md:grid-cols-3">
        <div>
          <div className="font-semibold text-ink">{settings.storeName}</div>
          <p className="mt-2">{settings.announcement}</p>
        </div>
        <div>
          <div className="font-semibold text-ink">联系方式</div>
          <p className="mt-2">{settings.contact}</p>
        </div>
        <div>
          <div className="font-semibold text-ink">售后说明</div>
          <p className="mt-2">{settings.afterSaleNotice}</p>
        </div>
      </div>
    </footer>
  );
}
