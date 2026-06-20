"use client";

import { useState } from "react";
import { useAdminCategories, useSaveAdminCategory, useDeleteAdminCategory } from "@/lib/api/hooks/admin";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { Category } from "@/lib/validation/schemas";
import { Pencil, Trash2, Plus } from "lucide-react";

interface FormState {
  name: string;
  featured: boolean;
  isActive: boolean;
}
const EMPTY: FormState = { name: "", featured: false, isActive: true };

export default function AdminCategoriesPage() {
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
    setForm({ name: c.name, featured: c.featured, isActive: c.isActive });
    setError(null);
    setEditing(c);
  }
  function close() {
    setCreating(false);
    setEditing(null);
  }
  function submit() {
    if (!form.name.trim()) return setError("Name is required.");
    save.mutate(
      { id: editing?.id, input: { name: form.name.trim(), featured: form.featured, isActive: form.isActive } },
      { onSuccess: close },
    );
  }

  const columns: Column<Category>[] = [
    { key: "name", header: "Category", render: (c) => <span className="font-medium text-navy">{c.name}</span> },
    { key: "count", header: "Products", render: (c) => <span className="text-muted">{c.productCount}</span> },
    { key: "featured", header: "Featured", render: (c) => (c.featured ? <Badge tone="navy">Featured</Badge> : <span className="text-muted">—</span>) },
    { key: "status", header: "Status", render: (c) => <Badge tone={c.isActive ? "ok" : "neutral"}>{c.isActive ? "Active" : "Hidden"}</Badge> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`} className="rounded-r-md p-2 text-muted hover:bg-card hover:text-navy">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const msg =
                c.productCount > 0
                  ? `Remove "${c.name}"? Its ${c.productCount} product(s) will become uncategorised.`
                  : `Remove "${c.name}"?`;
              if (confirm(msg)) del.mutate(c.id);
            }}
            aria-label={`Delete ${c.name}`}
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
        title="Categories"
        action={
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" /> New category
          </Button>
        }
      />
      {isLoading ? (
        <div className="grid place-items-center py-20"><Spinner className="h-6 w-6 text-navy" /></div>
      ) : (
        <AdminTable columns={columns} rows={categories ?? []} rowKey={(c) => c.id} empty="No categories yet." />
      )}

      <Modal open={open} onClose={close} title={editing ? "Edit category" : "New category"}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Checkbox label="Featured on homepage" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
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
