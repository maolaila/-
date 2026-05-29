import { Plus, Trash2 } from "lucide-react";

import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { getAdminCategories } from "@/server/services/catalog";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">分类管理</h1>
        <p className="mt-1 text-sm text-muted">分类下存在商品时不能删除，可隐藏。</p>
      </div>
      <form action={createCategoryAction} className="grid gap-4 rounded-md border border-line bg-white p-4 lg:grid-cols-[1fr_1fr_120px_120px]">
        <Field label="分类名称">
          <Input name="name" maxLength={50} required />
        </Field>
        <Field label="Slug">
          <Input name="slug" required />
        </Field>
        <Field label="排序">
          <Input name="sortOrder" defaultValue={100} min={0} type="number" />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input defaultChecked name="isVisible" type="checkbox" />
          显示
        </label>
        <div className="lg:col-span-4">
          <Button>
            <Plus className="h-4 w-4" />
            新增分类
          </Button>
        </div>
      </form>
      <section className="overflow-x-auto rounded-md border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-wash text-muted">
            <tr>
              <th className="px-4 py-3">名称</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">排序</th>
              <th className="px-4 py-3">显示</th>
              <th className="px-4 py-3">商品数</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr className="border-t border-line" key={category.id}>
                <td className="px-4 py-3" colSpan={5}>
                  <form action={updateCategoryAction} className="grid gap-3 md:grid-cols-[1fr_1fr_100px_80px_80px_120px] md:items-center">
                    <input type="hidden" name="id" value={category.id} />
                    <Input name="name" defaultValue={category.name} />
                    <Input name="slug" defaultValue={category.slug} />
                    <Input name="sortOrder" defaultValue={category.sortOrder} type="number" />
                    <label className="flex items-center gap-2">
                      <input defaultChecked={category.isVisible} name="isVisible" type="checkbox" />
                      显示
                    </label>
                    <span>{category.productCount ?? 0}</span>
                    <div className="flex gap-2">
                      <Button className="h-9 px-3" type="submit" variant="secondary">
                        保存
                      </Button>
                    </div>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <Button className="h-9 px-3" type="submit" variant="danger" title="删除">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
