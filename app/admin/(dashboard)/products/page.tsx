"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminProducts, useSaveAdminProduct, useDeleteAdminProduct, useAdminCategories } from "@/lib/api/hooks/admin";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/shared/Money";
import { Spinner } from "@/components/ui/Spinner";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MarkdownTextarea } from "@/components/admin/MarkdownTextarea";
import { TranslationsEditor } from "@/components/admin/TranslationsEditor";
import type { Product, Translations } from "@/lib/validation/schemas";
import { type ProductUpsert, fetchAdminProduct } from "@/lib/api/resources/admin";
import { Pencil, Trash2, Plus } from "lucide-react";

interface FormState {
  name: string;
  description: string;
  price: string; // major units of the chosen currency; converted to minor on save
  currency: "UZS" | "USD";
  stockQty: string;
  categoryId: string;
  imageUrls: string[];
  translations: Translations;
  isActive: boolean;
}

const EMPTY: FormState = { name: "", description: "", price: "", currency: "UZS", stockQty: "0", categoryId: "", imageUrls: [], translations: {}, isActive: true };

export default function AdminProductsPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const { data: products, isLoading } = useAdminProducts(search.trim() || undefined);
  const { data: categories } = useAdminCategories();
  const save = useSaveAdminProduct();
  const del = useDeleteAdminProduct();

  const catOptions = useMemo(
    () => (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  function openCreate() {
    setForm({ ...EMPTY, categoryId: categories?.[0]?.id ?? "" });
    setError(null);
    setCreating(true);
  }
  async function openEdit(p: Product) {
    setError(null);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.priceMinor / 100n),
      currency: p.currency,
      stockQty: String(p.stockQty),
      categoryId: p.categoryId,
      imageUrls: p.images.map((i) => i.url).filter((u): u is string => Boolean(u)),
      translations: p.translations ?? {},
      isActive: p.isActive,
    });
    setEditing(p);
    // The list rows only carry the primary image; fetch the full record so the
    // admin can swap any photo in the gallery, not just the primary one.
    const full = await fetchAdminProduct(p.id).catch(() => null);
    if (full) {
      setForm((prev) => ({
        ...prev,
        imageUrls: full.images.map((i) => i.url).filter((u): u is string => Boolean(u)),
        translations: full.translations ?? {},
      }));
    }
  }
  function close() {
    setCreating(false);
    setEditing(null);
  }

  function submit() {
    const price = Number(form.price);
    const stock = Number(form.stockQty);
    if (!form.name.trim()) return setError(t("errNameRequired"));
    if (!form.categoryId) return setError(t("errPickCategory"));
    if (!Number.isFinite(price) || price < 0) return setError(t("errPrice"));
    if (!Number.isInteger(stock) || stock < 0) return setError(t("errStock"));
    if (form.imageUrls.length === 0) return setError(t("errImageRequired"));

    const input: ProductUpsert = {
      name: form.name.trim(),
      description: form.description.trim(),
      priceMinor: String(BigInt(Math.round(price)) * 100n),
      currency: form.currency,
      stockQty: stock,
      categoryId: form.categoryId,
      imageUrls: form.imageUrls,
      translations: form.translations,
      isActive: form.isActive,
    };
    save.mutate(
      { id: editing?.id, input },
      { onSuccess: close },
    );
  }

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: t("colProduct"),
      render: (p) => (
        <div>
          <p className="font-medium text-navy">{p.name}</p>
          <p className="text-xs text-muted">{p.sku}</p>
        </div>
      ),
    },
    { key: "category", header: t("category"), render: (p) => <span className="text-muted">{p.categoryName}</span> },
    { key: "price", header: t("price"), render: (p) => <Money minor={p.priceMinor} currency={p.currency} /> },
    {
      key: "stock",
      header: t("stock"),
      render: (p) => (
        <span className={p.stockQty === 0 ? "text-bad" : p.stockQty < 10 ? "text-warn" : "text-navy"}>{p.stockQty}</span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (p) => <Badge tone={p.isActive ? "ok" : "neutral"}>{p.isActive ? t("active") : t("hidden")}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => openEdit(p)} aria-label={tc("edit")} className="rounded-r-md p-2 text-muted hover:bg-card hover:text-navy">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(t("confirmRemove", { name: p.name }))) del.mutate(p.id);
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
        title={t("products")}
        action={
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" /> {t("newProduct")}
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input placeholder={t("searchProducts")} value={search} onChange={(e) => setSearch(e.target.value)} aria-label={t("searchProducts")} />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20"><Spinner className="h-6 w-6 text-navy" /></div>
      ) : (
        <AdminTable columns={columns} rows={products ?? []} rowKey={(p) => p.id} empty={t("noProducts")} />
      )}

      <Modal open={open} onClose={close} title={editing ? t("editProduct") : t("newProduct")}>
        <div className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor="p-desc">{t("description")}</label>
            <MarkdownTextarea
              id="p-desc"
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label={t("price")} inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Select label={t("currencyLabel")} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as "UZS" | "USD" })}>
              <option value="UZS">UZS (so&apos;m)</option>
              <option value="USD">USD ($)</option>
            </Select>
            <Input label={t("stock")} inputMode="numeric" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
          </div>
          <Select label={t("category")} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="" disabled>{t("selectCategory")}</option>
            {catOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <ImageUploader
            label={t("productImages")}
            value={form.imageUrls}
            onChange={(urls) => setForm({ ...form, imageUrls: urls })}
            max={7}
            required
          />
          <TranslationsEditor
            title={t("translationsOptional")}
            value={form.translations}
            onChange={(tr) => setForm({ ...form, translations: tr })}
            fields={[
              { key: "name", label: t("name") },
              { key: "description", label: t("description"), markdown: true },
            ]}
          />
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
