import "@/styles/globals.css";

// The admin area lives under /admin/* in the same Next.js app. It reuses the
// root layout's providers/fonts (it is nested within them), and adds its own
// chrome via the dashboard group. See DECISIONS.md for why admin is path-based
// rather than host-based.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
