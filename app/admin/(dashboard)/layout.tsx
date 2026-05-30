"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

// Wraps every authenticated admin page with the sidebar chrome and a role gate.
// /admin/login is NOT in this group, so it renders without the sidebar.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (isReady && user?.role !== "sales_manager") router.replace("/admin/login");
  }, [isReady, user, router]);

  if (!isReady) {
    return <div className="grid min-h-screen place-items-center"><Spinner className="h-6 w-6 text-navy" /></div>;
  }
  if (user?.role !== "sales_manager") return null;

  return (
    <div className="flex min-h-screen bg-card/40">
      <AdminSidebar />
      <div className="flex-1 overflow-x-hidden">
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </div>
    </div>
  );
}
