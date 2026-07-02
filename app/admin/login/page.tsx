"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { requestOtp } from "@/lib/api/resources/auth";
import { ServerError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/shared/Logo";
import { isValidPhone, toE164 } from "@/lib/format/phone";

export default function AdminLoginPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const { login, user, isReady } = useAuth();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isReady && user?.role === "sales_manager") router.replace("/admin/dashboard");
  }, [isReady, user, router]);

  const send = async () => {
    setError(null);
    const e164 = toE164(phone);
    if (!isValidPhone(phone) || !e164) return setError("Enter a valid phone number");
    setBusy(true);
    try {
      const res = await requestOtp(e164, "admin_login");
      setDevCode(res.devCode ?? null);
      setStep("code");
    } catch (err) {
      setError(err instanceof ServerError ? err.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError(null);
    const e164 = toE164(phone);
    if (!e164) return;
    setBusy(true);
    try {
      const u = await login(e164, code);
      if (u.role !== "sales_manager") {
        setError("This account does not have admin access.");
        return;
      }
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof ServerError ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-card px-4">
      <div className="w-full max-w-sm rounded-r-lg border border-line bg-white p-8 shadow-brand-2">
        <div className="mb-6 flex justify-center"><Logo href="/admin/login" /></div>
        <h1 className="mb-1 text-center font-display text-xl text-navy">{t("loginTitle")}</h1>
        <p className="mb-6 text-center text-sm text-muted">Sales manager access only.</p>
        <div className="space-y-4">
          {step === "phone" ? (
            <>
              <Input label="Phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} error={error ?? undefined} />
              <Button block onClick={send} disabled={busy}>Send code</Button>
            </>
          ) : (
            <>
              <Input label="Code" name="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} error={error ?? undefined} hint={devCode ? `Dev code: ${devCode}` : undefined} />
              <Button block onClick={verify} disabled={busy || code.length < 4}>Verify</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
