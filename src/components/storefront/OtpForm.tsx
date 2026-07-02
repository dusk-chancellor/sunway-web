"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { requestOtp } from "@/lib/api/resources/auth";
import { updateProfile } from "@/lib/api/resources/me";
import { ServerError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { isValidPhone, toE164, formatAsYouType } from "@/lib/format/phone";
import { useUI } from "@/stores/ui";

export function OtpForm({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account/profile";
  const { login, setUser } = useAuth();
  const pushToast = useUI((s) => s.pushToast);

  const [step, setStep] = useState<"phone" | "code" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const e164 = toE164(phone);

  const sendCode = async () => {
    setError(null);
    if (!isValidPhone(phone) || !e164) {
      setError(t("invalidPhone"));
      return;
    }
    setBusy(true);
    try {
      const res = await requestOtp(e164, mode);
      setDevCode(res.devCode ?? null);
      setStep("code");
      setCooldown(30);
    } catch (err) {
      setError(err instanceof ServerError ? err.message : t("sendError"));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError(null);
    if (!e164) return;
    setBusy(true);
    try {
      const user = await login(e164, code, mode === "register" ? fullName : undefined);
      // Every account must have a name. If this is a first-time sign-in without
      // one, collect it now before continuing.
      if (!user.fullName.trim()) {
        setStep("name");
        return;
      }
      pushToast(t("signedIn"), "ok");
      router.push(next);
    } catch (err) {
      setError(err instanceof ServerError ? err.message : t("verifyError"));
    } finally {
      setBusy(false);
    }
  };

  const submitName = async () => {
    setError(null);
    if (fullName.trim().length < 2) {
      setError(t("nameRequired"));
      return;
    }
    setBusy(true);
    try {
      const updated = await updateProfile({ fullName: fullName.trim() });
      setUser(updated);
      pushToast(t("welcome"), "ok");
      router.push(next);
    } catch (err) {
      setError(err instanceof ServerError ? err.message : t("saveNameError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="font-display text-2xl text-navy">{mode === "login" ? t("loginTitle") : t("registerTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{mode === "login" ? t("loginSubtitle") : t("registerSubtitle")}</p>

      <div className="mt-6 space-y-4">
        {step === "phone" && (
          <>
            {mode === "register" && (
              <Input label={t("fullName")} name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            )}
            <Input
              label={t("phone")}
              name="phone"
              inputMode="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(formatAsYouType(e.target.value))}
              error={error ?? undefined}
            />
            {mode === "register" && (
              <Checkbox name="consent" label={t("consent")} checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            )}
            <Button block disabled={busy || (mode === "register" && (!consent || !fullName))} onClick={sendCode}>
              {busy ? t("sending") : t("sendCode")}
            </Button>
          </>
        )}
        {step === "code" && (
          <>
            <p className="text-sm text-muted">{t("codeSubtitle", { phone: formatAsYouType(phone) })}</p>
            <Input
              label={t("code")}
              name="code"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              error={error ?? undefined}
              hint={devCode ? `${t("devCodeHint")} (${devCode})` : undefined}
            />
            <Button block disabled={busy || code.length < 4} onClick={verify}>
              {busy ? t("verifying") : t("verify")}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button className="text-muted hover:text-navy" onClick={() => { setStep("phone"); setCode(""); }}>
                {t("changeNumber")}
              </button>
              <button className="text-navy disabled:text-muted" disabled={cooldown > 0} onClick={sendCode}>
                {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
              </button>
            </div>
          </>
        )}
        {step === "name" && (
          <>
            <p className="text-sm text-muted">{t("namePrompt")}</p>
            <Input
              label={t("fullName")}
              name="fullName"
              placeholder={t("namePlaceholder")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={error ?? undefined}
            />
            <Button block disabled={busy || fullName.trim().length < 2} onClick={submitName}>
              {busy ? t("saving") : t("continue")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
