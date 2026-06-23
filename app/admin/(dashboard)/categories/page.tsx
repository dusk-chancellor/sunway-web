"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminCategories, useSaveAdminCategory, useDeleteAdminCategory } from "@/lib/api/hooks/admin";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { TranslationsEditor } from "@/components/admin/TranslationsEditor";
import type { Category, Translations } from "@/lib/validation/schemas";
import { Pencil, Trash2, Plus } from "lucide-react";

interface FormState {
  name: string;
  imageUrls: string[];
  translations: Translations;
  featured: boolean;
  isActive: boolean;
}
const EMPTY: FormState = { name: "", imageUrls: [], translations: {}, featured: false, isActive: true };

export default function AdminCategoriesPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const { data: categories, isLoading } = useAdminCategories();
  const save = useSaveAdminCategory();
  const del = useDeleteAdminCategory();

  function openCreate() {
    setForm(EMPTY);
    setError(null);
    setCreating(true);
  }
  function openEdit(c: Category) {
    setForm({ name: c.name, imageUrls: c.imageUrl ? [c.imageUrl] : [], translations: c.translations ?? {}, featured: c.featured, isActive: c.isActive });
    setError(null);
    setEditing(c);
  }
  function close() {
    setCreating(false);
    setEditing(null);
  }
  function submit() {
    if (!form.name.trim()) return setError(t("errNameRequired"));
    save.mutate(
      { id: editing?.id, input: { name: form.name.trim(), imageUrl: form.imageUrls[0], translations: form.translations, featured: form.featured, isActive: form.isActive } },
      { onSuccess: close },
    );
  }

  const columns: Column<Category>[] = [
    { key: "name", header: t("category"), render: (c) => <span className="font-medium text-navy">{c.name}</span> },
    { key: "count", header: t("products"), render: (c) => <span className="text-muted">{c.productCount}</span> },
    { key: "featured", header: t("featured"), render: (c) => (c.featured ? <Badge tone="navy">{t("featured")}</Badge> : <span className="text-muted">—</span>) },
    { key: "status", header: t("status"), render: (c) => <Badge tone={c.isActive ? "ok" : "neutral"}>{c.isActive ? t("active") : t("hidden")}</Badge> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => openEdit(c)} aria-label={tc("edit")} className="rounded-r-md p-2 text-muted hover:bg-card hover:text-navy">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const msg =
                c.productCount > 0
                  ? t("confirmRemoveCategory", { name: c.name, count: c.productCount })
                  : t("confirmRemove", { name: c.name });
              if (confirm(msg)) del.mutate(c.id);
            }}
            aria-label={tc("delete")}
            className="rounded-r-md p-2 text-muted hover:bg-bad-soft hover:text-bad"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const open = creating || editing !== null;

  return (
    <div>
      <AdminTopbar
        title={t("categories")}
        action={
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" /> {t("newCategory")}
          </Button>
        }
      />
      {isLoading ? (
        <div className="grid place-items-center py-20"><Spinner className="h-6 w-6 text-navy" /></div>
      ) : (
        <AdminTable columns={columns} rows={categories ?? []} rowKey={(c) => c.id} empty={t("noCategories")} />
      )}

      <Modal open={open} onClose={close} title={editing ? t("editCategory") : t("newCategory")}>
        <div className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <ImageUploader
            label={t("categoryImage")}
            value={form.imageUrls}
            onChange={(urls) => setForm({ ...form, imageUrls: urls })}
            max={1}
          />
          <TranslationsEditor
            title={t("translationsOptional")}
            value={form.translations}
            onChange={(tr) => setForm({ ...form, translations: tr })}
            fields={[{ key: "name", label: t("name") }]}
          />
          <Checkbox label={t("featuredHint")} checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          <Checkbox label={t("activeHint")} checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close}>{tc("cancel")}</Button>
            <Button onClick={submit} disabled={save.isPending}>{save.isPending ? t("saving") : tc("save")}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
