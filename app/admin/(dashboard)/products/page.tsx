"use client";

import { useMemo, useState } from "react";
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
import type { Product } from "@/lib/validation/schemas";
import type { ProductUpsert } from "@/lib/api/resources/admin";
import { Pencil, Trash2, Plus } from "lucide-react";

interface FormState {
  name: string;
  description: string;
  price: string; // major units of the chosen currency; converted to minor on save
  currency: "UZS" | "USD";
  stockQty: string;
  categoryId: string;
  isActive: boolean;
}

const EMPTY: FormState = { name: "", description: "", price: "", currency: "UZS", stockQty: "0", categoryId: "", isActive: true };

export default function AdminProductsPage() {
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
  function openEdit(p: Product) {
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.priceMinor / 100n),
      currency: p.currency,
      stockQty: String(p.stockQty),
      categoryId: p.categoryId,
      isActive: p.isActive,
    });
    setError(null);
    setEditing(p);
  }
  function close() {
    setCreating(false);
    setEditing(null);
  }

  function submit() {
    const price = Number(form.price);
    const stock = Number(form.stockQty);
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.categoryId) return setError("Pick a category.");
    if (!Number.isFinite(price) || price < 0) return setError("Price must be a positive number.");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a non-negative integer.");

    const input: ProductUpsert = {
      name: form.name.trim(),
      description: form.description.trim(),
      priceMinor: String(BigInt(Math.round(price)) * 100n),
      currency: form.currency,
      stockQty: stock,
      categoryId: form.categoryId,
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
      header: "Product",
      render: (p) => (
        <div>
          <p className="font-medium text-navy">{p.name}</p>
          <p className="text-xs text-muted">{p.sku}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (p) => <span className="text-muted">{p.categoryName}</span> },
    { key: "price", header: "Price", render: (p) => <Money minor={p.priceMinor} currency={p.currency} /> },
    {
      key: "stock",
      header: "Stock",
      render: (p) => (
        <span className={p.stockQty === 0 ? "text-bad" : p.stockQty < 10 ? "text-warn" : "text-navy"}>{p.stockQty}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge tone={p.isActive ? "ok" : "neutral"}>{p.isActive ? "Active" : "Hidden"}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} className="rounded-r-md p-2 text-muted hover:bg-card hover:text-navy">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Remove "${p.name}"?`)) del.mutate(p.id);
            }}
            aria-label={`Delete ${p.name}`}
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
        title="Products"
        action={
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" /> New product
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20"><Spinner className="h-6 w-6 text-navy" /></div>
      ) : (
        <AdminTable columns={columns} rows={products ?? []} rowKey={(p) => p.id} empty="No products match your search." />
      )}

      <Modal open={open} onClose={close} title={editing ? "Edit product" : "New product"}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor="p-desc">Description</label>
            <textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-r-md border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Price" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as "UZS" | "USD" })}>
              <option value="UZS">UZS (so&apos;m)</option>
              <option value="USD">USD ($)</option>
            </Select>
            <Input label="Stock qty" inputMode="numeric" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
          </div>
          <Select label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="" disabled>Select a category</option>
            {catOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Checkbox label="Active (visible in storefront)" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
