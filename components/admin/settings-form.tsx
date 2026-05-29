"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import { updateSettingsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { emptyActionState } from "@/lib/action-state";
import type { SiteSettings } from "@/lib/validators/settings";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(updateSettingsAction, emptyActionState);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="店铺名称">
          <Input name="storeName" defaultValue={settings.storeName} required />
        </Field>
        <Field label="默认货币">
          <Input name="currency" defaultValue={settings.currency} maxLength={3} required />
        </Field>
      </div>
      <Field label="首页公告">
        <Textarea name="announcement" defaultValue={settings.announcement} maxLength={500} />
      </Field>
      <Field label="联系方式">
        <Input name="contact" defaultValue={settings.contact} />
      </Field>
      <Field label="订单说明">
        <Textarea name="orderNotice" defaultValue={settings.orderNotice} maxLength={1000} />
      </Field>
      <Field label="售后说明">
        <Textarea name="afterSaleNotice" defaultValue={settings.afterSaleNotice} maxLength={1000} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={settings.allowPendingCancel} name="allowPendingCancel" type="checkbox" />
        允许顾客申请取消待确认订单
      </label>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{state.message}</p>
      ) : null}
      <div>
        <Button disabled={pending}>
          <Save className="h-4 w-4" />
          保存配置
        </Button>
      </div>
    </form>
  );
}
