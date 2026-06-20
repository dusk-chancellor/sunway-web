"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAddresses, useSaveAddress, useDeleteAddress, useUpdateProfile } from "@/lib/api/hooks/account";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatPhone } from "@/lib/format/phone";

export default function ProfilePage() {
  const t = useTranslations("account");
  const { user, setUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const { data: addresses } = useAddresses();
  const saveAddress = useSaveAddress();
  const deleteAddress = useDeleteAddress();

  const [name, setName] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ fullName: "", region: "", city: "", street: "", apartment: "", postalCode: "" });

  useEffect(() => {
    if (user) {
      setName(user.fullName);
    }
  }, [user]);

  const saveProfile = async () => {
    const updated = await updateProfile.mutateAsync({ fullName: name });
    setUser(updated);
  };

  const addAddress = async () => {
    await saveAddress.mutateAsync({
      input: {
        fullName: form.fullName,
        country: "Uzbekistan",
        region: form.region,
        city: form.city,
        street: form.street,
        apartment: form.apartment || undefined,
        postalCode: form.postalCode || undefined,
      },
    });
    setModal(false);
    setForm({ fullName: "", region: "", city: "", street: "", apartment: "", postalCode: "" });
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 font-display text-xl text-navy">{t("personalInfo")}</h1>
        <div className="space-y-4 rounded-r-lg border border-line bg-white p-5">
          <Input label={t("name")} name="name" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <p className="mb-1.5 text-sm font-medium text-navy">{t("phoneLabel")}</p>
            <p className="text-sm text-muted">{user ? formatPhone(user.phone) : ""}</p>
          </div>
          <Button onClick={saveProfile} disabled={updateProfile.isPending}>{t("saved")}</Button>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-navy">{t("addresses")}</h2>
          <Button size="sm" variant="outline" onClick={() => setModal(true)}>{t("addAddress")}</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses?.map((a) => (
            <div key={a.id} className="rounded-r-md border border-line bg-white p-4 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium text-navy">{a.fullName}</p>
                {a.isDefault && <Badge tone="navy">{t("default")}</Badge>}
              </div>
              <p className="text-muted">{a.street}{a.apartment ? `, ${a.apartment}` : ""}</p>
              <p className="text-muted">{a.city}, {a.region}</p>
              <div className="mt-3 flex gap-3 text-xs">
                {!a.isDefault && (
                  <button className="text-navy hover:underline" onClick={() => saveAddress.mutate({ id: a.id, input: { fullName: a.fullName, country: a.country, region: a.region, city: a.city, street: a.street, apartment: a.apartment ?? undefined, postalCode: a.postalCode ?? undefined, isDefault: true } })}>
                    {t("setDefault")}
                  </button>
                )}
                <button className="text-bad hover:underline" onClick={() => deleteAddress.mutate(a.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal open={modal} onClose={() => setModal(false)} title={t("addAddress")}>
        <div className="space-y-3">
          <Input label="Full name" name="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Region" name="region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            <Input label="City" name="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <Input label="Street" name="street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <Button block onClick={addAddress} disabled={saveAddress.isPending || !form.fullName || !form.city}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
