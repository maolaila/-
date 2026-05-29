import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/server/services/settings";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">站点配置</h1>
        <p className="mt-1 text-sm text-muted">配置前台展示文案、联系方式、货币和订单说明。</p>
      </div>
      <section className="rounded-md border border-line bg-white p-5">
        <SettingsForm settings={settings} />
      </section>
    </div>
  );
}
