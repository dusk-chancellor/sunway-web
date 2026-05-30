import { clsx, type ClassValue } from "clsx";

/** Conditional className join. Keeps JSX tidy without pulling in tailwind-merge. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
