"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/i18n/content";
import { CreditCard, Banknote, Plus } from "lucide-react";
import { useCart } from "@/lib/cart/useCart";
import { useAddresses, useSaveAddress } from "@/lib/api/hooks/account";
import { useShippingMethods } from "@/lib/api/hooks/catalog";
import { placeOrder } from "@/lib/api/resources/orders";
import { useNasiyaQuote } from "@/lib/api/hooks/nasiya";
import { ServerError } from "@/lib/api/client";
import { ulid } from "@/lib/utils/ids";
import { Money } from "@/components/shared/Money";
import { PaymeLogo, ClickLogo, UzumNasiyaLogo } from "@/components/shared/PaymentLogos";
import { NasiyaPanel } from "@/components/storefront/NasiyaPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useUI } from "@/stores/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils/cn";
import { isOnlineMethod, type PaymentMethod } from "@/lib/validation/schemas";

// Which of the two shipping methods a row is. Matched on the untranslated
// name, so it holds whatever language the customer is reading in.
function isPickupMethod(name: string | undefined): boolean {
  return (name ?? "").toLowerCase().includes("pickup");
}

export function CheckoutView() {
  const t = useTranslations("checkout");
  const locale = useLocale();
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
  const [payment, setPayment] = useState<PaymentMethod>("payme");
  const [nasiyaTariff, setNasiyaTariff] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [addressModal, setAddressModal] = useState(false);

  // Idempotency key persists across retries of the same checkout attempt.
  const idemKey = useRef<string>(ulid());

  // New-address form state
  const [form, setForm] = useState({ fullName: "", region: "", city: "", street: "", apartment: "", postalCode: "" });

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

  const selectedMethod = useMemo(
    () => shippingMethods?.find((s) => s.id === selectedShipping),
    [shippingMethods, selectedShipping],
  );
  const isOnline = isOnlineMethod(payment);
  const isNasiya = payment === "uzum_nasiya";
  // Pickup orders need no shipping address; everything else does.
  const isPickup = isPickupMethod(selectedMethod?.name);
  // The delivery fee is paid in cash to the courier and is not part of the
  // order total — the total is the goods, and that is what every gateway
  // charges (and what Uzum Nasiya finances).
  const total = cart?.subtotalMinor ?? 0n;
  const cur = cart?.currency ?? "UZS";

  // The quote prices the current cart, so it is keyed on the cart's contents:
  // changing the cart must never leave a stale monthly payment on screen.
  const cartKey = useMemo(
    () => (cart?.items ?? []).map((i) => `${i.id}x${i.quantity}`).join(",") + `:${total}`,
    [cart, total],
  );
  const nasiyaQuery = useNasiyaQuote(isNasiya && Boolean(cart?.items.length), cartKey);

  const canPlace =
    Boolean(selectedShipping) &&
    (isPickup || Boolean(selectedAddress)) &&
    Boolean(cart && cart.items.length > 0) &&
    // Installments cannot be placed without a plan — the contract is written
    // against exactly one tariff.
    (!isNasiya || Boolean(nasiyaTariff));

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
    if (!selectedShipping || (!isPickup && !selectedAddress)) return;
    setPlacing(true);
    setStockError(null);
    try {
      const order = await placeOrder(
        {
          shippingAddressId: isPickup ? undefined : selectedAddress!,
          shippingMethodId: selectedShipping,
          paymentMethod: payment,
          locale,
          nasiyaTariff: isNasiya ? (nasiyaTariff ?? undefined) : undefined,
        },
        idemKey.current,
      );
      // The backend emptied the cart in the checkout tx — drop the stale cache so
      // the header badge and cart page reflect it immediately.
      queryClient.setQueryData(["cart"], { items: [], subtotalMinor: 0n, currency: cart?.currency ?? "UZS", count: 0 });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      // Online methods return a hosted URL — leave the site to pay (or, for
      // installments, to sign). The order is confirmed by the provider's
      // callback or by our own confirmation call, never on return. COD has no
      // redirect and goes straight to the confirmation page.
      if (order.paymentRedirectUrl) {
        window.location.href = order.paymentRedirectUrl;
        return; // keep the spinner up while the browser navigates away
      }
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

          {/* Shipping method — chosen first; delivery then reveals the address form. */}
          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-lg text-navy">{t("shippingMethod")}</h2>
            <div className="space-y-2">
              {shippingMethods?.map((s) => {
                const pickup = isPickupMethod(s.name);
                return (
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
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-navy">{localized(s.translations, locale, "name", s.name)}</span>
                          {/* The two facts that decide the method for most
                              customers, and neither is in the method's own
                              description: delivery inside the city costs
                              nothing, and pickup is arranged by a call. */}
                          {!pickup && (
                            <span className="rounded-r-sm bg-ok-soft px-1.5 py-0.5 text-xs font-medium text-ok">
                              {t("tashkentFree")}
                            </span>
                          )}
                        </span>
                        <span className="block text-muted">{localized(s.translations, locale, "description", s.description)}</span>
                        {pickup && <span className="mt-1 block text-xs font-medium text-navy">{t("pickupManagerNotice")}</span>}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {/* Only about delivery, so it is out of the way when picking up. */}
            {!isPickup && (
              <p className="mt-3 rounded-r-md bg-card px-3 py-2 text-sm text-muted">{t("deliveryCashNotice")}</p>
            )}
          </section>

          {/* Shipping address — only for delivery (pickup needs none). */}
          {!isPickup && (
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
                <p className="text-sm text-muted">{t("addAddressHint")}</p>
              )}
            </section>
          )}

          {/* Payment — a top-level choice of online vs cash; picking "online"
              reveals the Payme/Click providers (each redirects to its hosted
              page after the order is placed). */}
          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-lg text-navy">{t("payment")}</h2>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { if (!isOnline) setPayment("payme"); }}
                aria-pressed={isOnline}
                className={cn("flex items-center justify-center gap-2 rounded-r-md border p-3 text-sm", isOnline ? "border-navy bg-navy-soft/40" : "border-line")}
              >
                <CreditCard className="h-4 w-4" /> {t("payOnline")}
              </button>
              <button
                type="button"
                onClick={() => setPayment("cod")}
                aria-pressed={payment === "cod"}
                className={cn("flex items-center justify-center gap-2 rounded-r-md border p-3 text-sm", payment === "cod" ? "border-navy bg-navy-soft/40" : "border-line")}
              >
                <Banknote className="h-4 w-4" /> {t("payCod")}
              </button>
            </div>

            {isOnline && (
              /* Two up on phones: three ~3:1 brand lockups side by side leave
                 each logo about 70px of room, which is not enough to read. */
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setPayment("payme")}
                  aria-pressed={payment === "payme"}
                  aria-label={t("payPayme")}
                  className={cn("flex items-center justify-center rounded-r-md border bg-white p-3", payment === "payme" ? "border-navy ring-2 ring-navy/30" : "border-line")}
                >
                  <PaymeLogo className="h-6 w-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => setPayment("click")}
                  aria-pressed={payment === "click"}
                  aria-label={t("payClick")}
                  className={cn("flex items-center justify-center rounded-r-md border bg-white p-3", payment === "click" ? "border-navy ring-2 ring-navy/30" : "border-line")}
                >
                  <ClickLogo className="h-6 w-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => setPayment("uzum_nasiya")}
                  aria-pressed={isNasiya}
                  aria-label={t("payNasiya")}
                  className={cn("flex items-center justify-center rounded-r-md border bg-white p-3", isNasiya ? "border-navy ring-2 ring-navy/30" : "border-line")}
                >
                  <UzumNasiyaLogo className="h-6 w-auto" />
                </button>
              </div>
            )}

            {payment === "cod" ? (
              <p className="rounded-r-md bg-card px-3 py-2 text-sm text-muted">{t("codNotice")}</p>
            ) : isNasiya ? (
              /* Installments qualify the customer before they can be chosen —
                 eligibility and the monthly payment both come from Uzum. */
              <NasiyaPanel
                quote={nasiyaQuery.data}
                isLoading={nasiyaQuery.isLoading}
                error={nasiyaQuery.error as Error | null}
                selected={nasiyaTariff}
                onSelect={setNasiyaTariff}
                currency={cur}
              />
            ) : (
              <p className="rounded-r-md bg-card px-3 py-2 text-sm text-muted">
                {t("redirectNotice", { provider: payment === "payme" ? t("payPayme") : t("payClick") })}
              </p>
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
                <Money minor={it.lineTotalMinor} currency={cur} className="shrink-0 text-navy" />
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t("orderSummary")}</span><Money minor={cart?.subtotalMinor ?? 0n} currency={cur} className="text-navy" /></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <span className="text-navy">{t("total")}</span><Money minor={total} currency={cur} className="text-navy" />
            </div>
            {/* The delivery fee is settled in cash with the courier, so it is
                deliberately absent from this total. Nothing to say about it on
                a pickup order. */}
            {!isPickup && <p className="text-xs text-muted">{t("deliveryCashNotice")}</p>}
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
