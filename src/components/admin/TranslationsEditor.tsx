"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { MarkdownTextarea } from "@/components/admin/MarkdownTextarea";
import { enabledLocales, localeNames, defaultLocale, type Locale } from "@/i18n/config";
import type { Translations } from "@/lib/validation/schemas";

export interface TranslatableField {
  key: string;
  label: string;
  textarea?: boolean;
  /** Render a Markdown editor (Bold toolbar) instead of a plain textarea. */
  markdown?: boolean;
}

/**
 * Optional per-locale translation editor for admin forms. Base (default-locale)
 * fields stay where they are; this edits overrides for the other locales, one
 * language at a time. Leaving a field blank means "fall back to the base value".
 */
export function TranslationsEditor({
  title,
  value,
  onChange,
  fields,
}: {
  title: string;
  value: Translations;
  onChange: (next: Translations) => void;
  fields: TranslatableField[];
}) {
  const t = useTranslations("admin");
  const others = enabledLocales.filter((l) => l !== defaultLocale);
  const [lang, setLang] = useState<Locale>(others[0] ?? defaultLocale);

  if (others.length === 0) return null;

  const current = value[lang] ?? {};
  const setField = (key: string, v: string) => {
    onChange({ ...value, [lang]: { ...current, [key]: v } });
  };

  return (
    <details className="rounded-r-md border border-line">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-navy">{title}</summary>
      <div className="space-y-3 border-t border-line p-3">
        <Select label={t("language")} value={lang} onChange={(e) => setLang(e.target.value as Locale)}>
          {others.map((l) => (
            <option key={l} value={l}>
              {localeNames[l]}
            </option>
          ))}
        </Select>
        {fields.map((f) =>
          f.markdown ? (
            <div key={f.key}>
              <label className="mb-1.5 block text-sm font-medium text-navy">{f.label}</label>
              <MarkdownTextarea value={current[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
            </div>
          ) : f.textarea ? (
            <div key={f.key}>
              <label className="mb-1.5 block text-sm font-medium text-navy">{f.label}</label>
              <textarea
                rows={3}
                value={current[f.key] ?? ""}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full rounded-r-md border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
              />
            </div>
          ) : (
            <Input key={f.key} label={f.label} value={current[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)} />
          ),
        )}
      </div>
    </details>
  );
}
