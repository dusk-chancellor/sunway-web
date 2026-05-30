import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "navy" | "ok" | "warn" | "bad" | "neutral";

const tones: Record<Tone, string> = {
  navy: "bg-navy-soft text-navy",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-[#8a6a00]",
  bad: "bg-bad-soft text-bad",
  neutral: "bg-card text-muted",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
