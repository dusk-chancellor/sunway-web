"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X } from "lucide-react";
import { uploadImage } from "@/lib/api/resources/uploads";
import { cn } from "@/lib/utils/cn";

/**
 * Admin image uploader. Uploads each picked file immediately and tracks the
 * resulting URLs. Supports single (max=1) or multiple images up to `max`.
 * Nothing is shown when there are no images, so optional uploaders stay tidy.
 */
export function ImageUploader({
  label,
  value,
  onChange,
  max = 1,
  required = false,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  required?: boolean;
}) {
  const t = useTranslations("admin");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = max - value.length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const picked = Array.from(files).slice(0, remaining);
      const uploaded: string[] = [];
      for (const f of picked) {
        const media = await uploadImage(f);
        uploaded.push(media.url);
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy">
        {label}
        {required && <span className="text-bad"> *</span>}
        {max > 1 && <span className="ml-1 font-normal text-muted">{t("upTo", { max })}</span>}
      </label>

      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-r-md border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={t("removeImage")}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-navy/80 text-white hover:bg-bad"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && max > 1 && (
                <span className="absolute bottom-0 left-0 right-0 bg-navy/80 py-0.5 text-center text-[10px] text-white">{t("primary")}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-r-md border border-dashed border-line px-4 text-sm text-muted hover:border-navy hover:text-navy",
            busy && "opacity-60",
          )}
        >
          <Upload className="h-4 w-4" /> {busy ? t("uploading") : t("upload")}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple={max > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-1 text-sm text-bad">{error}</p>}
    </div>
  );
}
