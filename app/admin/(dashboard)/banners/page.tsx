"use client";

import { useState } from "react";
import { useAdminBanners, useSaveAdminBanner, useDeleteAdminBanner } from "@/lib/api/hooks/admin";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { Banner } from "@/lib/validation/schemas";
import { Pencil, Trash2, Plus } from "lucide-react";

interface FormState {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
}
const EMPTY: FormState = { title: "", subtitle: "", ctaLabel: "Shop now", ctaHref: "/", active: true };

export default function AdminBannersPage() {
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const { data: banners, isLoading } = useAdminBanners();
  const save = useSaveAdminBanner();
  const del = useDeleteAdminBanner();

  function openCreate() {
    setForm(EMPTY);
    setError(null);
    setCreating(true);
  }
  function openEdit(b: Banner) {
    setForm({ title: b.title, subtitle: b.subtitle, ctaLabel: b.ctaLabel, ctaHref: b.ctaHref, active: b.active });
    setError(null);
    setEditing(b);
  }
  function close() {
    setCreating(false);
    setEditing(null);
  }
  function submit() {
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.ctaHref.trim()) return setError("CTA link is required.");
    save.mutate(
      {
        id: editing?.id,
        input: {
          title: form.title.trim(),
          subtitle: form.subtitle.trim(),
          ctaLabel: form.ctaLabel.trim() || "Shop now",
          ctaHref: form.ctaHref.trim(),
          active: form.active,
        },
      },
      { onSuccess: close },
    );
  }

  const columns: Column<Banner>[] = [
    {
      key: "title",
      header: "Banner",
      render: (b) => (
        <div>
          <p className="font-medium text-navy">{b.title}</p>
          {b.subtitle && <p className="text-xs text-muted">{b.subtitle}</p>}
        </div>
      ),
    },
    { key: "cta", header: "CTA", render: (b) => <span className="text-muted">{b.ctaLabel} → {b.ctaHref}</span> },
    { key: "status", header: "Status", render: (b) => <Badge tone={b.active ? "ok" : "neutral"}>{b.active ? "Active" : "Hidden"}</Badge> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (b) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => openEdit(b)} aria-label={`Edit ${b.title}`} className="rounded-r-md p-2 text-muted hover:bg-card hover:text-navy">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Remove "${b.title}"?`)) del.mutate(b.id);
            }}
            aria-label={`Delete ${b.title}`}
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
        title="Banners"
        action={
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" /> New banner
          </Button>
        }
      />
      {isLoading ? (
        <div className="grid place-items-center py-20"><Spinner className="h-6 w-6 text-navy" /></div>
      ) : (
        <AdminTable columns={columns} rows={banners ?? []} rowKey={(b) => b.id} empty="No banners yet." />
      )}

      <Modal open={open} onClose={close} title={editing ? "Edit banner" : "New banner"}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="CTA label" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} />
            <Input label="CTA link" value={form.ctaHref} onChange={(e) => setForm({ ...form, ctaHref: e.target.value })} />
          </div>
          <Checkbox label="Active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
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
