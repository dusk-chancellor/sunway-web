import type { Metadata } from "next";
import { Suspense } from "react";
import { OtpForm } from "@/components/storefront/OtpForm";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <Suspense>
      <OtpForm mode="register" />
    </Suspense>
  );
}
