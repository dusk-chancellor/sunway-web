"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CreditCard, Banknote, Plus } from "lucide-react";
import { useCart } from "@/lib/cart/useCart";
import { useAddresses, useSaveAddress } from "@/lib/api/hooks/account";
import { useShippingMethods } from "@/lib/api/hooks/catalog";
import { placeOrder } from "@/lib/api/resources/orders";
import { ServerError } from "@/lib/api/client";
import { ulid } from "@/lib/utils/ids";
import { Money } from "@/components/shared/Money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useUI } from "@/stores/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils/cn";
import type { PaymentMethod } from "@/lib/validation/schemas";

/** Group digits into 4s: "1234567812345678" → "1234 5678 1234 5678" (max 16). */
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
/** Auto-insert the slash: "0131" → "01/31" (max MM/YY). */
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function CheckoutView() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const queryClient = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  const { user } = useAuth();
  const { data: cart } = useCart();
  const { data: addresses } = useAddresses();
  const { data: shippingMethods } = useShippingMethods();
  const saveAddress = useSaveAddress();

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [placing, setPlacing] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [addressModal, setAddressModal] = useState(false);

  // Idempotency key persists across retries of the same checkout attempt.
  const idemKey = useRef<string>(ulid());

  // New-address form state
  const [form, setForm] = useState({ fullName: "", region: "", city: "", street: "", apartment: "", postalCode: "" });
  // Card form (simple, never charged — demo only per project decision)
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses.find((a) => a.isDefault)?.id ?? addresses[0]!.id);
    }
  }, [addresses, selectedAddress]);
  useEffect(() => {
    if (shippingMethods && shippingMethods.length > 0 && !selectedShipping) {
      setSelectedShipping(shippingMethods[0]!.id);
    }
  }, [shippingMethods, selectedShipping]);

  const shippingCost = useMemo(
    () => shippingMethods?.find((s) => s.id === selectedShipping)?.priceMinor ?? 0n,
    [shippingMethods, selectedShipping],
  );
  const total = useMemo(() => (cart?.subtotalMinor ?? 0n) + shippingCost, [cart, shippingCost]);

  const canPlace =
    Boolean(selectedAddress) &&
    Boolean(selectedShipping) &&
    Boolean(cart && cart.items.length > 0) &&
    (payment === "cod" ||
      (card.number.replace(/\s/g, "").length >= 12 && card.name && card.expiry.length === 5 && card.cvv.length >= 3));

  const submitAddress = async () => {
    const created = await saveAddress.mutateAsync({
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
    setSelectedAddress(created.id);
    setAddressModal(false);
    setForm({ fullName: "", region: "", city: "", street: "", apartment: "", postalCode: "" });
  };

  const onPlaceOrder = async () => {
    if (!selectedAddress || !selectedShipping) return;
    setPlacing(true);
    setStockError(null);
    try {
      const order = await placeOrder(
        { shippingAddressId: selectedAddress, shippingMethodId: selectedShipping, paymentMethod: payment },
        idemKey.current,
      );
      // The backend emptied the cart in the checkout tx — drop the stale cache so
      // the header badge and cart page reflect it immediately.
      queryClient.setQueryData(["cart"], { items: [], subtotalMinor: 0n, currency: cart?.currency ?? "UZS", count: 0 });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      router.push(`/orders/${order.number}/confirmation`);
    } catch (err) {
      if (err instanceof ServerError && err.code === "STOCK_CONFLICT") {
        setStockError(t("stockChangedBody"));
        idemKey.current = ulid(); // fresh key for the next attempt
      } else {
        pushToast(err instanceof Error ? err.message : t("placeOrder"), "bad");
      }
    } finally {
      setPlacing(false);
    }
  };

  if (cart && cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">{t("orderSummary")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl text-navy">{t("title")}</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contact */}
          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-lg text-navy">{t("contact")}</h2>
            <p className="text-sm text-muted">{t("phone")}: <span className="font-medium text-navy">{user?.phone}</span></p>
          </section>

          {/* Shipping address */}
          <section className="rounded-r-lg border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg text-navy">{t("shippingAddress")}</h2>
              <Button size="sm" variant="outline" onClick={() => setAddressModal(true)}>
                <Plus className="h-4 w-4" /> {t("useNewAddress")}
              </Button>
            </div>
            {addresses && addresses.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={cn(
                      "cursor-pointer rounded-r-md border p-3 text-sm",
                      selectedAddress === a.id ? "border-navy bg-navy-soft/40" : "border-line",
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="sr-only"
                      checked={selectedAddress === a.id}
                      onChange={() => setSelectedAddress(a.id)}
                    />
                    <p className="font-medium text-navy">{a.fullName}</p>
                    <p className="text-muted">{a.street}{a.apartment ? `, ${a.apartment}` : ""}</p>
                    <p className="text-muted">{a.city}, {a.region}</p>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Add a delivery address to continue.</p>
            )}
          </section>

          {/* Shipping method */}
          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-lg text-navy">{t("shippingMethod")}</h2>
            <div className="space-y-2">
              {shippingMethods?.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-r-md border p-3 text-sm",
                    selectedShipping === s.id ? "border-navy bg-navy-soft/40" : "border-line",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="shipping" checked={selectedShipping === s.id} onChange={() => setSelectedShipping(s.id)} />
                    <span>
                      <span className="font-medium text-navy">{s.name}</span>
                      <span className="block text-muted">{s.description}</span>
                    </span>
                  </span>
                  <Money minor={s.priceMinor} className="font-medium text-navy" />
                </label>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-lg text-navy">{t("payment")}</h2>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayment("card")}
                className={cn("flex items-center gap-2 rounded-r-md border p-3 text-sm", payment === "card" ? "border-navy bg-navy-soft/40" : "border-line")}
              >
                <CreditCard className="h-4 w-4" /> {t("payCard")}
              </button>
              <button
                type="button"
                onClick={() => setPayment("cod")}
                className={cn("flex items-center gap-2 rounded-r-md border p-3 text-sm", payment === "cod" ? "border-navy bg-navy-soft/40" : "border-line")}
              >
                <Banknote className="h-4 w-4" /> {t("payCod")}
              </button>
            </div>

            {payment === "card" ? (
              <div className="space-y-3">
                <Input label={t("cardNumber")} name="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9123 4567" value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} />
                <Input label={t("cardName")} name="cardName" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label={t("cardExpiry")} name="cardExpiry" inputMode="numeric" autoComplete="cc-exp" placeholder="01/31" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} />
                  <Input label={t("cardCvv")} name="cardCvv" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                </div>
                <p className="rounded-r-md bg-warn-soft px-3 py-2 text-xs text-[#8a6a00]">{t("cardNotice")}</p>
              </div>
            ) : (
              <p className="rounded-r-md bg-card px-3 py-2 text-sm text-muted">{t("codNotice")}</p>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-r-lg border border-line bg-white p-5 shadow-brand">
          <h2 className="mb-4 font-display text-lg text-navy">{t("orderSummary")}</h2>
          <ul className="mb-4 max-h-64 space-y-3 overflow-y-auto">
            {cart?.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="line-clamp-1 text-muted">{it.quantity}× {it.name}</span>
                <Money minor={it.lineTotalMinor} className="shrink-0 text-navy" />
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t("orderSummary")}</span><Money minor={cart?.subtotalMinor ?? 0n} className="text-navy" /></div>
            <div className="flex justify-between"><span className="text-muted">{t("shippingMethod")}</span><Money minor={shippingCost} className="text-navy" /></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <span className="text-navy">Total</span><Money minor={total} className="text-navy" />
            </div>
          </div>

          {stockError && (
            <p className="mt-3 rounded-r-md bg-bad-soft px-3 py-2 text-xs text-bad" role="alert">{stockError}</p>
          )}

          <Button block size="lg" className="mt-4" disabled={!canPlace || placing} onClick={onPlaceOrder}>
            {placing ? t("placing") : t("placeOrder")}
          </Button>
        </aside>
      </div>

      {/* New address modal */}
      <Modal open={addressModal} onClose={() => setAddressModal(false)} title={t("useNewAddress")}>
        <div className="space-y-3">
          <Input label={t("fullName")} name="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("region")} name="region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            <Input label={t("city")} name="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <Input label={t("street")} name="street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("apartment")} name="apartment" value={form.apartment} onChange={(e) => setForm({ ...form, apartment: e.target.value })} />
            <Input label={t("postalCode")} name="postalCode" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </div>
          <Button block onClick={submitAddress} disabled={saveAddress.isPending || !form.fullName || !form.city || !form.street}>
            {t("savedAddresses")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
